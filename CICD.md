# HubNest CRM — Jenkins CI/CD Setup Guide

## Architecture Overview

```
GitHub Push → Jenkins Webhook
                ↓
         Jenkins Pipeline
         ┌────────────────┐
         │ 1. Checkout    │
         │ 2. Install     │  (parallel: client + server)
         │ 3. Build       │  (parallel: Next.js + 4 Docker images)
         │ 4. Push Images │  → DockerHub Registry
         │ 5. Deploy      │  → SSH to production server
         │ 6. Health Check│  → Verify all 6 services up
         └────────────────┘
                ↓
         Production Server
         ┌─────────────────────────────────┐
         │  nginx (80/443)                 │
         │   ├─ / → frontend:3000          │
         │   ├─ /api/ → backend:5000       │
         │   └─ /socket.io/ → backend:5000 │
         │  postgres:5432 (internal)       │
         │  redis:6379   (internal)        │
         │  chatbot:8003 (internal)        │
         │  reports:8002 (internal)        │
         └─────────────────────────────────┘
```

---

## Step 1 — Jenkins Server Prerequisites

### Required Plugins (Manage Jenkins → Plugins → Available)
| Plugin | Purpose |
|--------|---------|
| Pipeline | Core pipeline support |
| Git | Source checkout |
| Docker Pipeline | `docker.build()`, `docker.push()` |
| SSH Agent | `sshagent {}` block for deploy |
| Credentials Binding | `withCredentials {}` block |
| AnsiColor | Coloured console output |
| Slack Notification | (optional) deploy alerts |

### Tools on Jenkins agent
```bash
# The Jenkins agent (or master if same machine) needs:
docker --version     # Docker 24+
node --version       # Node.js 20+
npm --version        # npm 10+
git --version
ssh
scp
curl
```

---

## Step 2 — Jenkins Credentials

Go to **Manage Jenkins → Credentials → System → Global → Add Credential**

| ID (exact) | Kind | Value |
|------------|------|-------|
| `DOCKER_REGISTRY_CREDS` | Username with password | DockerHub username + password/token |
| `SERVER_SSH_KEY` | SSH Username with private key | Private key Jenkins uses to SSH into deploy server |
| `SERVER_USER` | Secret text | SSH username on deploy server (e.g. `hubnest`) |
| `SERVER_HOST` | Secret text | Server IP or hostname (e.g. `65.0.12.34`) |
| `ENV_SERVER_FILE` | Secret file | Your production `server/.env` |
| `ENV_CLIENT_FILE` | Secret file | Your production `client/.env.local` |

### Production `server/.env` (upload as `ENV_SERVER_FILE`)
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:STRONG_PASS@postgres:5432/crm_db
REDIS_URL=redis://redis:6379
JWT_SECRET=<openssl rand -base64 64>
JWT_REFRESH_SECRET=<openssl rand -base64 64>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
FRONTEND_URL=https://hubnest.in
CHATBOT_URL=http://chatbot:8003
REPORT_SERVICE_URL=http://reports:8002
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
META_APP_ID=xxx
META_APP_SECRET=xxx
PAYMENT_ENCRYPTION_KEY=<64 hex chars>
HUBNEST_RAZORPAY_KEY_ID=rzp_live_xxx
HUBNEST_RAZORPAY_KEY_SECRET=xxx
```

### Production `client/.env.local` (upload as `ENV_CLIENT_FILE`)
```bash
NEXT_PUBLIC_API_URL=https://hubnest.in/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

## Step 3 — Prepare the Deployment Server

Run once as root on a fresh Ubuntu 22.04/24.04 VPS:

```bash
bash deploy/setup-server.sh
```

Then add the Jenkins agent's SSH public key:
```bash
# On Jenkins master: cat ~/.ssh/id_rsa.pub
# Paste into server:
mkdir -p /home/hubnest/.ssh
echo "ssh-rsa AAAA... jenkins@your-jenkins" >> /home/hubnest/.ssh/authorized_keys
chmod 700 /home/hubnest/.ssh
chmod 600 /home/hubnest/.ssh/authorized_keys
chown -R hubnest:hubnest /home/hubnest/.ssh
```

### SSL Certificate
```bash
# Stop anything on port 80 first, then:
certbot certonly --standalone -d hubnest.in -d www.hubnest.in

# Copy certs into deploy directory
cp /etc/letsencrypt/live/hubnest.in/fullchain.pem /opt/hubnest/ssl/
cp /etc/letsencrypt/live/hubnest.in/privkey.pem   /opt/hubnest/ssl/
chown -R hubnest:hubnest /opt/hubnest/ssl

# Auto-renew (add to root crontab)
0 3 * * * certbot renew --quiet && \
  cp /etc/letsencrypt/live/hubnest.in/fullchain.pem /opt/hubnest/ssl/ && \
  cp /etc/letsencrypt/live/hubnest.in/privkey.pem   /opt/hubnest/ssl/ && \
  docker exec hubnest_nginx_1 nginx -s reload
```

---

## Step 4 — Jenkins Pipeline Job

1. **New Item** → name it `hubnest-crm` → select **Multibranch Pipeline**
2. **Branch Sources** → Git → enter your repo URL
3. **Credentials** → add your GitHub token if private repo
4. **Build Configuration** → Mode: `Jenkinsfile` → Script Path: `Jenkinsfile`
5. **Scan Repository** → click **Scan Now**

Jenkins will auto-discover `main`, `develop`, `staging` branches.

### Update `Jenkinsfile` line 11
```groovy
DOCKER_REGISTRY = 'your-dockerhub-username'   // ← put your DockerHub username
```

---

## Step 5 — Update `docker-compose.prod.yml`

```yaml
# In deploy/docker-compose.prod.yml, set your real postgres password:
environment:
  POSTGRES_PASSWORD: STRONG_RANDOM_PASSWORD_HERE
```

---

## Step 6 — First Deploy Checklist

```
□ Jenkins plugins installed
□ All 6 credentials added (IDs match exactly)
□ deploy/setup-server.sh run on VPS
□ Jenkins SSH public key in /home/hubnest/.ssh/authorized_keys
□ SSL certificates in /opt/hubnest/ssl/
□ DOCKER_REGISTRY updated in Jenkinsfile
□ ENV_SERVER_FILE uploaded (production server/.env)
□ ENV_CLIENT_FILE uploaded (production client/.env.local)
□ Push to main branch → watch pipeline in Jenkins Blue Ocean
□ Visit https://hubnest.in to verify
```

---

## Branch Strategy

| Branch | Deploys To | Docker Tag |
|--------|-----------|------------|
| `main` | Production (`hubnest.in`) | `main-<sha>` |
| `staging` | Staging (`staging.hubnest.in`) | `staging-<sha>` |
| `develop` | Images pushed only, no deploy | `develop-<sha>` |
| `feature/*` | Lint + build only, no push | local only |

---

## Rollback

```bash
# SSH into server
ssh hubnest@YOUR_SERVER_IP
cd /opt/hubnest

# List available image tags
docker images | grep hubnest

# Roll back backend to a previous tag
IMAGE_TAG=main-abc1234 \
IMAGE_BACKEND=youruser/hubnest-backend \
IMAGE_FRONTEND=youruser/hubnest-frontend \
IMAGE_CHATBOT=youruser/hubnest-chatbot \
IMAGE_REPORTS=youruser/hubnest-reports \
docker compose up -d backend
```

---

## Monitoring

```bash
# Service health
docker compose ps

# Live logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx

# Resource usage
docker stats

# Backend health endpoint
curl https://hubnest.in/health
```

---

## Common Issues

| Issue | Fix |
|-------|-----|
| `permission denied` on SSH | Check `SERVER_SSH_KEY` credential and `authorized_keys` |
| `docker: command not found` | Install Docker on Jenkins agent |
| `Connection refused` on health check | Increase `sleep 15` in health check stage |
| Next.js build fails with missing env | Check `ENV_CLIENT_FILE` is uploaded and has correct vars |
| `ssl_certificate` not found | Run certbot and copy certs to `/opt/hubnest/ssl/` |
| Pipeline blocked by lint | Fix ESLint errors or temporarily use `--max-warnings=99` |
