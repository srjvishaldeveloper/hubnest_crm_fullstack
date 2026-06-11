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
- **Node.js Main Backend & WebSocket Server (Chat)**: Port `5000`
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

## Method B: Running Everything with a Single Script (Windows)

I've added a convenience script that automatically starts the frontend, backend, and **all** microservices at the same time in separate command windows.

1. Navigate to the root directory of the project.
2. Double-click the `start_all.bat` file or run it from the command line:
   ```cmd
   .\start_all.bat
   ```
This script will open a separate terminal window for the Node.js server, the Next.js client, and each individual microservice inside the `crm_microservices/` directory.

---

## Method C: Running Locally (Without Docker)

If you prefer to run the services natively on your machine, you must start each one individually. Ensure you have **Node.js (v18+)** and **Python (3.10+)** installed.

### 1. PostgreSQL Database & Redis
Ensure you have local instances of PostgreSQL and Redis running on their default ports:
- **Postgres**: Host: `localhost`, Port: `5433` (or `5432`), DB Name: `crm_db`
- **Redis**: Host: `localhost`, Port: `6379`

### 2. Start the Node.js Main Backend & WebSocket Server
Navigate to the `server/` directory, install dependencies, and run:
```bash
cd server
npm install
npm run dev
```
The backend API and WebSocket Server for real-time internal chat will both listen on port **`5000`**.

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
- **WebSocket Chat Server**: connects via `ws://localhost:5000/chat`
- **Reports Microservice**: `http://localhost:8002/api/health`
- **Chatbot Microservice**: `http://localhost:8003/docs` (Swagger UI)


---

## Database Documentation (DBDOCS)

To view and host the interactive database documentation, we use dbdocs.

### Start / View the DB Docs
Run the following commands in the root directory to build and publish the docs:
``bash
npm install -g dbdocs
dbdocs build docs/schema.dbml
``

This will ask you to log in to dbdocs (via email or github) and then give you a URL (e.g. dbdocs.io/your-username/hubnest_crm) where you can visually inspect all your tables and relationships!
