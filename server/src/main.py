from fastapi import FastAPI
from src.core import create_app
import os
from dotenv import load_dotenv

# Load environment variables from project's .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

app: FastAPI = create_app()

# message = "Papa thiam ton api marche"
@app.get("/")
def read_root():
    return {"message": "Papa thiam ton api marche"}
