from fastapi import FastAPI, HTTPException
from typing import Optional, List
from pydantic import BaseModel, Field
import asyncio

app = FastAPI(title="NLEx", version="1.0.0")

@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "NLEx"}
