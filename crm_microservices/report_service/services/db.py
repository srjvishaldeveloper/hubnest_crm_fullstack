import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/crm_db")

pool = None

async def init_db():
    global pool
    if not pool:
        pool = await asyncpg.create_pool(DATABASE_URL)

async def close_db():
    global pool
    if pool:
        await pool.close()

async def fetch_all(query: str, *args, tenant_id: str = None):
    global pool
    if not pool:
        await init_db()
    async with pool.acquire() as conn:
        if tenant_id:
            # Safe parsing for tenant schema name
            safe_schema = f"tenant_{tenant_id.replace('-', '_')}"
            await conn.execute(f"SET search_path TO {safe_schema}, public")
        return await conn.fetch(query, *args)

async def fetch_one(query: str, *args, tenant_id: str = None):
    global pool
    if not pool:
        await init_db()
    async with pool.acquire() as conn:
        if tenant_id:
            safe_schema = f"tenant_{tenant_id.replace('-', '_')}"
            await conn.execute(f"SET search_path TO {safe_schema}, public")
        return await conn.fetchrow(query, *args)
