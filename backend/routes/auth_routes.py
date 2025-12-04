# backend/routes/auth_routes.py  ← VERSION CORRIGÉE POUR JSON
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import database
from auth import authenticate_user, create_access_token, get_or_create_admin

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(database.get_db)):
    get_or_create_admin(db)
    user = authenticate_user(db, request.username, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}