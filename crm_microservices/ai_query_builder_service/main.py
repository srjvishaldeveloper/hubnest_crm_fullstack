import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="AI Query Builder Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryPromptRequest(BaseModel):
    prompt: str

@app.post("/build-query")
async def build_query(req: QueryPromptRequest):
    prompt = req.prompt.lower()
    
    where_clauses = []
    
    if "lead" in prompt:
        if "hot" in prompt:
            where_clauses.append("priority = 'Hot'")
        elif "cold" in prompt:
            where_clauses.append("priority = 'Cold'")
            
    if "revenue" in prompt or "cost" in prompt:
        if "high" in prompt:
            where_clauses.append("revenue > 50000")
            
    if "email" in prompt:
        if "open" in prompt:
            where_clauses.append("status = 'Contacted'")
            
    sql_where = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    return {
        "success": True,
        "prompt": req.prompt,
        "query": {
            "sql_where": sql_where,
            "params": [],
            "suggested_index": "CREATE INDEX ON leads_marketing(priority)"
        }
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8011))
    uvicorn.run(app, host="0.0.0.0", port=port)
