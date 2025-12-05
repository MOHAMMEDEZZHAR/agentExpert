# backend/main.py  ← VERSION CORRIGÉE QUI MARCHE À 100%
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import database  # <-- import absolu
import schemas   # <-- import absolu
import traceback
import json

# Création des tables
database.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="AI Expert Agents Studio")

# Middleware bas niveau pour logger toutes les requêtes entrantes
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print("=== INCOMING REQUEST ===")
    print(f"URL: {request.url}")
    print(f"Method: {request.method}")
    print(f"Headers: {dict(request.headers)}")
    
    # Read and potentially fix the body
    body = await request.body()
    print(f"Body raw: {body}")
    
    # Try to decode with UTF-8, fallback to latin-1 if needed
    try:
        body_decoded = body.decode()
    except UnicodeDecodeError:
        body_decoded = body.decode('latin-1')
        # Re-encode as UTF-8 for FastAPI
        body = body_decoded.encode('utf-8')
    print(f"Body decoded: {body_decoded}")
    
    # Parse and re-serialize JSON to normalize it
    try:
        parsed = json.loads(body_decoded)
        normalized = json.dumps(parsed, separators=(',', ':'))
        body = normalized.encode('utf-8')
        print(f"Body normalized: {normalized}")
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
    
    print("Passing to next handler...")
    
    # Create a new request with the fixed body
    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}
    
    new_request = Request(
        scope=request.scope,
        receive=receive
    )
    
    response = await call_next(new_request)
    print(f"Response status: {response.status_code}")
    print("=== END REQUEST ===")
    return response

@app.get("/test")
def test():
    print("=== TEST GET ENDPOINT CALLED ===")
    return {"message": "test"}

@app.post("/test")
def test_post():
    print("=== TEST POST ENDPOINT CALLED ===")
    return {"message": "test post"}

@app.post("/test-json")
async def test_json(request: Request):
    print("=== TEST JSON ENDPOINT CALLED ===")
    try:
        body = await request.body()
        print(f"Raw body: {body}")
        body_str = body.decode('utf-8')
        print(f"Body string: {body_str}")
        parsed = json.loads(body_str)
        print(f"Parsed JSON: {parsed}")
        return {"received": parsed}
    except Exception as e:
        print(f"Error in test-json: {e}")
        return {"error": str(e)}

# Global exception handler to catch parsing errors before they reach the endpoint
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("=== GLOBAL EXCEPTION ===")
    print(f"URL: {request.url}")
    print(f"Method: {request.method}")
    print(f"Headers: {dict(request.headers)}")
    try:
        body = await request.body()
        print(f"Body: {body.decode()}")
    except Exception as e:
        print(f"Could not read body: {e}")
    print("Exception:")
    print(traceback.format_exc())
    return JSONResponse(
        status_code=400,
        content={"detail": f"Invalid request body: {str(exc)}"}
    )

# Add specific handler for Pydantic validation errors
from fastapi.exceptions import RequestValidationError
from fastapi.responses import PlainTextResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("=== PYDANTIC VALIDATION ERROR ===")
    print(f"URL: {request.url}")
    print(f"Method: {request.method}")
    print(f"Validation errors: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body}
    )

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