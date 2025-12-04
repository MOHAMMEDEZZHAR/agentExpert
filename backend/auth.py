# backend/auth.py
from datetime import datetime, timedelta
from jose import jwt
from config import settings
from utils.password import verify_password, hash_password
from schemas import User
from sqlalchemy.orm import Session

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except:
        return None

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if user and verify_password(password, user.password_hash):
        return user
    return None

def get_or_create_admin(db: Session):
    from config import settings
    user = db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()
    if not user:
        user = User(username=settings.ADMIN_USERNAME, password_hash=hash_password(settings.ADMIN_PASSWORD))
        db.add(user)
        db.commit()
        db.refresh(user)
    return user