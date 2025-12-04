# backend/routes/crew_routes.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import database
from schemas import Agent, CrewRun
from auth import verify_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uuid
import requests
from openai import OpenAI
import config

router = APIRouter()
security = HTTPBearer()
client = OpenAI(api_key=config.settings.OPENAI_API_KEY)

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

@router.post("/crew/run")
def run_crew(request: dict, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    topic = request.get("topic")
    agent_ids = request.get("agent_ids", [])
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