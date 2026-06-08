import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn
from contextlib import asynccontextmanager

load_dotenv()

from services.db import init_db, close_db
from routers.sales import sales_router
from routers.marketing import marketing_router
from routers.support import support_router
from routers.finance import finance_router
from routers.export import export_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()

app = FastAPI(
    title="Job Nest CRM Reports & Analytics",
    description="Microservice providing sales, marketing, support and finance analytics + PDF/Excel/CSV exports",
    version="1.0.0",
    lifespan=lifespan
)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sales_router, prefix="/api")
app.include_router(marketing_router, prefix="/api")
app.include_router(support_router, prefix="/api")
app.include_router(finance_router, prefix="/api")
app.include_router(export_router, prefix="/api")

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "reports-service"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8002))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
