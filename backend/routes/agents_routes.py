# backend/routes/agents_routes.py  ← VERSION 100% FONCTIONNELLE
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import database
from schemas import Agent
from models import AgentCreate, AgentResponse
from auth import verify_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uuid

router = APIRouter()
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    username = verify_token(credentials.credentials)
    if not username:
        raise HTTPException(status_code=401, detail="Token invalide")
    return username

@router.post("/agents", response_model=AgentResponse)
def create_agent(agent: AgentCreate, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    db_agent = Agent(
        id=str(uuid.uuid4()),
        name=agent.name,
        role=agent.role,
        backstory=agent.backstory,
        tools=agent.tools or ["arxiv"],
        allow_delegation=agent.allow_delegation or False
    )
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    
    # Conversion manuelle (car from_orm n'existe plus)
    return AgentResponse(
        id=db_agent.id,
        name=db_agent.name,
        role=db_agent.role,
        backstory=db_agent.backstory,
        tools=db_agent.tools,
        allow_delegation=db_agent.allow_delegation,
        created_at=db_agent.created_at.isoformat() if db_agent.created_at else None
    )

@router.get("/agents")
def list_agents(db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    agents = db.query(Agent).all()
    return [
        AgentResponse(
            id=a.id,
            name=a.name,
            role=a.role,
            backstory=a.backstory,
            tools=a.tools,
            allow_delegation=a.allow_delegation,
            created_at=a.created_at.isoformat() if a.created_at else None
        )
        for a in agents
    ]


@router.delete("/agents/{agent_id}")
def delete_agent(agent_id: str, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent non trouvé")
    db.delete(agent)
    db.commit()
    return {"message": "Agent supprimé avec succès"}