# backend/main.py  ← VERSION CORRIGÉE QUI MARCHE À 100%
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import database  # <-- import absolu
import schemas   # <-- import absolu

# Création des tables
database.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="AI Expert Agents Studio")

app.add_middleware(
    CORSMiddleware,
    # Restrict origins in development to localhost frontend.
    # In production, replace with your real frontend origin(s).
    allow_origins=["http://localhost:3000"],
    # For security, avoid allowing credentials for all origins.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# On importe les routes APRÈS la création de l'app
from routes import auth_routes, agents_routes, crew_routes

app.include_router(auth_routes.router, prefix="/auth")
app.include_router(agents_routes.router, prefix="/api")
app.include_router(crew_routes.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "AI Expert Agents Studio - Backend ON - Prêt à l'emploi !"}