from fastapi import FastAPI
from .db import db, connect_db, disconnect_db


app = FastAPI()

@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()
