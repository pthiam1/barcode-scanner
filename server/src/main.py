from fastapi import FastAPI
from src.core import create_app

app: FastAPI = create_app()

# message = "Papa thiam ton api marche"
@app.get("/")
def read_root():
    return {"message": "Papa thiam ton api marche"}
