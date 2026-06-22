#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# HubNest CRM — Server Bootstrap
# Run this ONCE on a fresh Ubuntu 22.04 / 24.04 server as root or with sudo.
# It installs Docker, Docker Compose, creates the deploy user, and hardens SSH.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_USER="hubnest"
DEPLOY_DIR="/opt/hubnest"
DOMAIN="hubnest.in"        # ← change to your actual domain

echo "╔══════════════════════════════════════════════════════╗"
echo "║         HubNest CRM — Server Bootstrap               ║"
echo "╚══════════════════════════════════════════════════════╝"

# ── 1. System packages ────────────────────────────────────────────────────────
apt-get update -y
apt-get install -y \
  curl wget git unzip ufw fail2ban \
  ca-certificates gnupg lsb-release

# ── 2. Docker Engine ──────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "── Installing Docker ──"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  echo "✓ Docker installed: $(docker --version)"
else
  echo "✓ Docker already installed"
fi

# ── 3. Deploy user ────────────────────────────────────────────────────────────
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
  usermod -aG docker "$DEPLOY_USER"
  echo "✓ Created user: $DEPLOY_USER"
fi

# ── 4. Deploy directory ───────────────────────────────────────────────────────
mkdir -p "$DEPLOY_DIR"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"
chmod 750 "$DEPLOY_DIR"

# ── 5. SSL directory ──────────────────────────────────────────────────────────
mkdir -p "$DEPLOY_DIR/ssl"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR/ssl"

# ── 6. Firewall ───────────────────────────────────────────────────────────────
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "✓ UFW firewall configured"

# ── 7. Fail2ban ───────────────────────────────────────────────────────────────
systemctl enable fail2ban
systemctl start fail2ban

# ── 8. Let's Encrypt (Certbot) ────────────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
  apt-get install -y certbot
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Server bootstrap complete.                          ║"
echo "║                                                      ║"
echo "║  NEXT STEPS:                                         ║"
echo "║  1. Add Jenkins SSH public key to:                   ║"
echo "║     /home/$DEPLOY_USER/.ssh/authorized_keys         ║"
echo "║                                                      ║"
echo "║  2. Obtain SSL certificate:                          ║"
echo "║     certbot certonly --standalone -d $DOMAIN        ║"
echo "║     cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem  ║"
echo "║        $DEPLOY_DIR/ssl/fullchain.pem                ║"
echo "║     cp /etc/letsencrypt/live/$DOMAIN/privkey.pem    ║"
echo "║        $DEPLOY_DIR/ssl/privkey.pem                  ║"
echo "║                                                      ║"
echo "║  3. Set credentials in Jenkins (see CICD.md)        ║"
echo "║                                                      ║"
echo "║  4. Push to main branch to trigger first deploy     ║"
echo "╚══════════════════════════════════════════════════════╝"
