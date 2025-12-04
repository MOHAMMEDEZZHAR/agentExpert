# backend/models.py
from pydantic import BaseModel
from typing import List, Optional

class AgentCreate(BaseModel):
    name: str
    role: str
    backstory: str
    tools: Optional[List[str]] = ["arxiv"]
    allow_delegation: Optional[bool] = False

class AgentResponse(BaseModel):
    id: str
    name: str
    role: str
    backstory: str
    tools: List[str]
    allow_delegation: bool
    created_at: str

    class Config:
        from_attributes = True