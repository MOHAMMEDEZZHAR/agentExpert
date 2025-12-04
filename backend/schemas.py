# backend/schemas.py
from sqlalchemy import Column, String, Text, Boolean, DateTime, JSON, Enum
from sqlalchemy.sql import func
from database import Base
import uuid

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    api_token = Column(String(64), unique=True, nullable=True)

class Agent(Base):
    __tablename__ = "agents"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    role = Column(Text, nullable=False)
    backstory = Column(Text, nullable=False)
    tools = Column(JSON, default=list)
    allow_delegation = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

class CrewRun(Base):
    __tablename__ = "crew_runs"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic = Column(Text, nullable=False)
    agent_ids = Column(JSON, nullable=False)
    status = Column(String(20), default="running")
    result_long = Column(Text)
    created_at = Column(DateTime, server_default=func.now())