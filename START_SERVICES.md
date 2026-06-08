# CRM System Startup Guide

This document lists all the commands needed to spin up the database, backend, microservices, and frontend.

---

## Method A: Running with Docker (Recommended)

All services, including the PostgreSQL database, Redis, Node.js backend, and the Python microservices (AI Chatbot & Report Service) are containerized and configured to run together using Docker Compose.

### 1. Build and Start All Backend Services
Run the following command in the **root directory** of the repository:
```bash
docker-compose up -d --build
```

This will build, migrate, and start the following services:
- **PostgreSQL Database**: Port `5433` (accessible on host)
- **Redis Cache**: Port `6379`
- **Node.js Main Backend**: Port `5000`
- **AI Chatbot Microservice (FastAPI)**: Port `8003`
- **Reports & Analytics Microservice (FastAPI)**: Port `8002`

### 2. Start the Frontend Application (Next.js)
Open a new terminal, navigate to the `client/` directory, and start the development server:
```bash
cd client
npm install
npm run dev
```
The frontend website will be live at: **`http://localhost:3000`**

---

## Method B: Running Locally (Without Docker)

If you prefer to run the services natively on your machine, you must start each one individually. Ensure you have **Node.js (v18+)** and **Python (3.10+)** installed.

### 1. PostgreSQL Database & Redis
Ensure you have local instances of PostgreSQL and Redis running on their default ports:
- **Postgres**: Host: `localhost`, Port: `5433` (or `5432`), DB Name: `crm_db`
- **Redis**: Host: `localhost`, Port: `6379`

### 2. Start the Node.js Main Backend
Navigate to the `server/` directory, install dependencies, and run:
```bash
cd server
npm install
npm run dev
```
The backend API will listen on port **`5000`**.

### 3. Start the AI Chatbot Microservice (FastAPI)
Navigate to the chatbot folder, create a virtual environment, install requirements, and run:
```bash
cd crm_microservices/ai_chatbot
python -m venv .venv

# On Windows (PowerShell/CMD):
.venv\Scripts\activate

# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python main.py
```
The chatbot service will start on port **`8003`**.

### 4. Start the Reports & Analytics Microservice (FastAPI)
Navigate to the reports folder, create a virtual environment, install requirements, and run:
```bash
cd crm_microservices/report_service
python -m venv .venv

# On Windows (PowerShell/CMD):
.venv\Scripts\activate

# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python main.py
```
The reports service will start on port **`8002`**.

### 5. Start the Next.js Frontend
Navigate to the `client/` directory, install packages, and start the app:
```bash
cd client
npm install
npm run dev
```
The frontend website will be live at: **`http://localhost:3000`**

---

## Verification & Health Check Commands

To check if the microservices and backend are online, you can use these URL health endpoints:
- **Main Backend API**: `http://localhost:5000/health`
- **Reports Microservice**: `http://localhost:8002/api/health`
- **Chatbot Microservice**: `http://localhost:8003/docs` (Swagger UI)
