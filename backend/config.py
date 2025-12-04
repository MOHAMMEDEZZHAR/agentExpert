from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")

settings = Settings()