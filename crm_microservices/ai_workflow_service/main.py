import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import json

app = FastAPI(title="AI Workflow Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WorkflowPromptRequest(BaseModel):
    prompt: str

@app.post("/generate-workflow")
async def generate_workflow(req: WorkflowPromptRequest):
    prompt = req.prompt.lower()
    
    # Check trigger types in prompt
    trigger_type = "form_submitted"
    trigger_label = "Form Submitted"
    
    if "call" in prompt:
        trigger_type = "call_missed"
        trigger_label = "Call Missed Twice"
    elif "lead created" in prompt or "new lead" in prompt:
        trigger_type = "lead_created"
        trigger_label = "Lead Created"
    elif "deal won" in prompt:
        trigger_type = "deal_won"
        trigger_label = "Deal Won"

    # Actions list based on prompt
    nodes = []
    edges = []
    
    # 1. Trigger Node
    nodes.append({
        "id": "node-trigger",
        "type": "trigger",
        "position": {"x": 250, "y": 50},
        "data": {"label": trigger_label, "trigger_type": trigger_type}
    })
    
    current_y = 170
    parent_id = "node-trigger"
    node_counter = 1

    # Heuristic parsing for conditions, assignments, messages, and delays
    if "assign" in prompt:
        assign_node_id = f"node-action-{node_counter}"
        team = "Sales Team B" if "team b" in prompt else "Default Team"
        nodes.append({
            "id": assign_node_id,
            "type": "action",
            "position": {"x": 250, "y": current_y},
            "data": {"label": f"Assign to {team}", "action_type": "assign_lead", "config": {"team": team}}
        })
        edges.append({"id": f"edge-{node_counter}", "source": parent_id, "target": assign_node_id})
        parent_id = assign_node_id
        current_y += 120
        node_counter += 1

    if "whatsapp" in prompt or "message" in prompt:
        msg_node_id = f"node-action-{node_counter}"
        nodes.append({
            "id": msg_node_id,
            "type": "action",
            "position": {"x": 250, "y": current_y},
            "data": {"label": "Send WhatsApp Followup", "action_type": "send_whatsapp", "config": {"template": "call_back_reminder"}}
        })
        edges.append({"id": f"edge-{node_counter}", "source": parent_id, "target": msg_node_id})
        parent_id = msg_node_id
        current_y += 120
        node_counter += 1

    if "delay" in prompt or "wait" in prompt or "hours" in prompt or "hour" in prompt:
        delay_node_id = f"node-delay-{node_counter}"
        nodes.append({
            "id": delay_node_id,
            "type": "delay",
            "position": {"x": 250, "y": current_y},
            "data": {"label": "Wait 24 Hours", "duration": 24, "unit": "hours"}
        })
        edges.append({"id": f"edge-{node_counter}", "source": parent_id, "target": delay_node_id})
        parent_id = delay_node_id
        current_y += 120
        node_counter += 1

    if "task" in prompt or "follow-up" in prompt:
        task_node_id = f"node-action-{node_counter}"
        nodes.append({
            "id": task_node_id,
            "type": "action",
            "position": {"x": 250, "y": current_y},
            "data": {"label": "Create Follow-up Task", "action_type": "create_task", "config": {"title": "Call client back", "priority": "High"}}
        })
        edges.append({"id": f"edge-{node_counter}", "source": parent_id, "target": task_node_id})
        parent_id = task_node_id
        current_y += 120
        node_counter += 1

    # If prompt didn't match the specific heuristics, add default nodes
    if node_counter == 1:
        # Default Email Followup
        email_node_id = "node-action-1"
        nodes.append({
            "id": email_node_id,
            "type": "action",
            "position": {"x": 250, "y": 170},
            "data": {"label": "Send Welcome Email", "action_type": "send_email", "config": {"template": "welcome"}}
        })
        edges.append({"id": "edge-1", "source": "node-trigger", "target": email_node_id})

    return {
        "success": True,
        "prompt": req.prompt,
        "workflow": {
            "nodes": nodes,
            "edges": edges
        }
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8005))
    uvicorn.run(app, host="0.0.0.0", port=port)
