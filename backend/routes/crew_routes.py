# backend/routes/crew_routes.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from sqlalchemy.orm import Session
import database
from schemas import Agent, CrewRun, AgentDeployment
from auth import verify_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uuid
import requests
from openai import OpenAI
import config
import secrets
import hashlib
import time
from pydantic import BaseModel
from typing import List

router = APIRouter()
security = HTTPBearer()
client = OpenAI(api_key=config.settings.OPENAI_API_KEY)

# Simple in-memory rate limiter (per-api-key). This is a PoC only.
# In production, use Redis or a distributed rate limiter.
RATE_LIMITS: dict = {}
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX = 20     # max requests per window per api key

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    username = verify_token(credentials.credentials)
    if not username:
        raise HTTPException(status_code=401, detail="Token invalide")
    return username

def search_arxiv(query: str):
    try:
        url = f"http://export.arxiv.org/api/query?search_query=all:{query}&max_results=5"
        resp = requests.get(url, timeout=10)
        return resp.text[:1500]
    except:
        return "Pas de sources ArXiv disponibles."

class RunCrewRequest(BaseModel):
    topic: str
    agent_ids: List[str]


@router.post("/crew/run")
def run_crew(request: RunCrewRequest, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    topic = request.topic
    agent_ids = request.agent_ids or []
    if not topic or not agent_ids:
        raise HTTPException(400, "topic et agent_ids requis")

    agents = db.query(Agent).filter(Agent.id.in_(agent_ids)).all()
    if len(agents) == 0:
        raise HTTPException(404, "Aucun agent trouvé")

    run = CrewRun(id=str(uuid.uuid4()), topic=topic, agent_ids=agent_ids, status="running", result_long="En cours...")
    db.add(run)
    db.commit()

    def task():
        try:
            sources = search_arxiv(topic)
            system = "Tu es une équipe d'experts :\n" + "\n".join([f"- {a.name} : {a.role} → {a.backstory}" for a in agents])
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": f"{topic}\n\nSources ArXiv :\n{sources}\n\nRéponds de façon complète et professionnelle."}
                ],
                max_tokens=3000
            )
            run.status = "completed"
            run.result_long = response.choices[0].message.content
        except Exception as e:
            run.status = "failed"
            run.result_long = f"Erreur : {str(e)}"
        db.commit()

    background_tasks.add_task(task)
    return {"run_id": run.id, "status": "running"}

@router.get("/crew/result/{run_id}")
def get_result(run_id: str, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    run = db.query(CrewRun).filter(CrewRun.id == run_id).first()
    if not run:
        raise HTTPException(404, "Run non trouvé")
    return run


@router.get("/crew/runs")
def get_all_runs(db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    runs = db.query(CrewRun).order_by(CrewRun.created_at.desc()).all()
    return [{
        "id": r.id,
        "topic": r.topic,
        "status": r.status,
        "created_at": r.created_at.isoformat() if r.created_at else None
    } for r in runs]


@router.delete("/crew/runs/{run_id}")
def delete_run(run_id: str, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    run = db.query(CrewRun).filter(CrewRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run non trouvé")
    db.delete(run)
    db.commit()
    return {"message": "Run supprimé avec succès"}


# ========== AGENT DEPLOYMENT ENDPOINTS ==========

@router.post("/agents/{agent_id}/deploy")
def deploy_agent(agent_id: str, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    """Generate API key for agent deployment. The plain key is returned only once.
    We store only the SHA256 hash in the database to avoid storing plaintext keys.
    """
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent non trouvé")

    # Check if agent already deployed
    existing = db.query(AgentDeployment).filter(AgentDeployment.agent_id == agent_id).first()
    if existing:
        # Return a masked fingerprint only, do NOT return the secret
        return {"message": "Agent déjà déployé", "deployment_id": existing.id, "api_key_fingerprint": existing.api_key[:8]}

    # Generate unique API key (plain) and compute hash
    plain_api_key = f"sk-agent-{secrets.token_hex(32)}"
    hashed = hashlib.sha256(plain_api_key.encode()).hexdigest()

    deployment = AgentDeployment(
        id=str(uuid.uuid4()),
        agent_id=agent_id,
        # store the hash (64 hex chars)
        api_key=hashed,
        is_active=True
    )
    db.add(deployment)
    db.commit()
    db.refresh(deployment)

    # Return the plain API key only once (client must keep it safe)
    return {
        "deployment_id": deployment.id,
        "agent_id": agent_id,
        "api_key": plain_api_key,
        "api_key_fingerprint": deployment.api_key[:8],
        "is_active": deployment.is_active,
        "created_at": deployment.created_at.isoformat() if deployment.created_at else None
    }


@router.get("/agents/{agent_id}/deployment")
def get_agent_deployment(agent_id: str, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    """Get deployment info for an agent. Does not return the raw key, only a fingerprint."""
    deployment = db.query(AgentDeployment).filter(AgentDeployment.agent_id == agent_id).first()
    if not deployment:
        raise HTTPException(status_code=404, detail="Agent non déployé")

    return {
        "deployment_id": deployment.id,
        "agent_id": deployment.agent_id,
        "api_key_fingerprint": deployment.api_key[:8],
        "is_active": deployment.is_active,
        "created_at": deployment.created_at.isoformat() if deployment.created_at else None
    }


@router.get("/deployments")
def list_deployments(db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    """List all agent deployments. Raw keys are NOT returned."""
    deployments = db.query(AgentDeployment).all()
    return [{
        "deployment_id": d.id,
        "agent_id": d.agent_id,
        "api_key_fingerprint": d.api_key[:8],
        "is_active": d.is_active,
        "created_at": d.created_at.isoformat() if d.created_at else None
    } for d in deployments]


class AskRequest(BaseModel):
    api_key: str | None = None
    question: str


@router.post("/agents/{agent_id}/ask")
async def ask_agent(agent_id: str, request: AskRequest, db: Session = Depends(database.get_db), authorization: str | None = Header(None)):
    """Public endpoint for external API consumption - requires api_key.
    Accepts the key in the JSON body or in the Authorization header as "Bearer <key>".
    """
    api_key = request.api_key
    question = request.question

    # Prefer Authorization header if present
    if not api_key and authorization:
        if authorization.lower().startswith("bearer "):
            api_key = authorization.split(" ", 1)[1].strip()

    if not api_key or not question:
        raise HTTPException(status_code=400, detail="api_key et question requis")

    # Rate limiting per api key (simple in-memory)
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    now = int(time.time())
    window_start, count = RATE_LIMITS.get(key_hash, (now, 0))
    if now - window_start >= RATE_LIMIT_WINDOW:
        window_start = now
        count = 0
    count += 1
    RATE_LIMITS[key_hash] = (window_start, count)
    if count > RATE_LIMIT_MAX:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    # Verify API key (we store the SHA256 hash in DB)
    deployment = db.query(AgentDeployment).filter(
        AgentDeployment.agent_id == agent_id,
        AgentDeployment.api_key == key_hash,
        AgentDeployment.is_active == True
    ).first()

    if not deployment:
        raise HTTPException(status_code=401, detail="Clé API invalide ou agent non déployé")

    # Get agent info
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent non trouvé")

    try:
        # Call OpenAI with agent info
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"Tu es {agent.name}, un expert: {agent.role}. Backstory: {agent.backstory}"},
                {"role": "user", "content": question}
            ],
            max_tokens=1000
        )

        return {
            "status": "success",
            "agent_id": agent_id,
            "question": question,
            "answer": response.choices[0].message.content,
            "timestamp": str(uuid.uuid4())
        }
    except Exception as e:
        return {
            "status": "error",
            "agent_id": agent_id,
            "error": str(e),
            "timestamp": str(uuid.uuid4())
        }


@router.delete("/deployments/{deployment_id}")
def delete_deployment(deployment_id: str, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    """Delete an agent deployment"""
    deployment = db.query(AgentDeployment).filter(AgentDeployment.id == deployment_id).first()
    if not deployment:
        raise HTTPException(status_code=404, detail="Déploiement non trouvé")
    
    db.delete(deployment)
    db.commit()
    return {"message": "Déploiement supprimé avec succès"}
    return {"message": "Run supprimé avec succès"}