import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your_groq_api_key_here")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

SYSTEM_PROMPT = """
You are an AI assistant for Job Nest CRM.
You help CRM users with:
- Sales insights and lead management tips
- Campaign optimization suggestions
- Team performance analysis
- Follow-up reminders and scheduling advice
- CRM navigation help
- Data interpretation

User role: {user_role}

Tailor your response specifically to the user's role:
- Admin / Super Admin: Focus on user management, system metrics, and CRM tenant configuration.
- Sales Manager: Focus on team targets, pipeline conversion, and lead allocation strategies.
- Sales Executive: Focus on individual lead management, follow-up scheduling, and daily customer call outcomes.
- Marketing (Head/Executive): Focus on campaign analytics, ad budget optimization, cost-per-lead, and clicks.
- Support (Manager/Agent): Focus on customer ticket categories, SLA deadlines, and resolution strategies.
- Finance: Focus on invoices, revenue generation, cost tracking, and budgets.

Be concise, professional, and helpful.
Only answer CRM-related questions. If a question is not related to CRM databases, sales, marketing, support, customer relationships, or Job Nest CRM workflows, politely decline to answer, stating that you can only assist with CRM-related queries.
"""

def get_chat_response(messages, user_role: str):
    # If the key is the placeholder, operate in fallback demo mode
    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        # Fallback professional reply
        role_msgs = {
            "Admin": "Hello Admin! System governance and user allocations are operating normally.",
            "Sales Manager": "Hello Sales Manager! Your team pipeline conversion average is at 67%. Ensure high-priority hot leads are assigned.",
            "Sales Executive": "Hello Sales Executive! Don't forget to dial your hot leads today and log the outcomes.",
            "Marketing": "Hello Marketer! The Pro Campaign leads count is up by 15% this week.",
            "Finance": "Hello Finance Executive! Q2 revenue projection is on track.",
            "Support": "Hello Support Agent! Ensure all billing category tickets are addressed within their SLA."
        }
        fallback_msg = role_msgs.get(user_role, f"Hello! As a {user_role}, how can I help you with the CRM today?")
        return f"[Demo Mode] {fallback_msg} (Please configure a valid GROQ_API_KEY in crm_microservices/ai_chatbot/.env to activate live Llama-3 AI chatbot answers.)", 0

    try:
        client = Groq(api_key=GROQ_API_KEY)
        formatted_messages = [
            {"role": "system", "content": SYSTEM_PROMPT.format(user_role=user_role)},
            *[{"role": m.role, "content": m.content} for m in messages]
        ]
        
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=formatted_messages,
            max_tokens=500,
            temperature=0.7
        )
        
        reply = response.choices[0].message.content
        tokens_used = response.usage.total_tokens
        return reply, tokens_used
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return f"I'm sorry, I encountered an error connecting to the AI brain: {str(e)}", 0
