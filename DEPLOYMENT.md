# CoAct.AI - Fresh Server Deployment Guide

This guide will walk you through deploying CoAct.AI on a fresh server from scratch.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- [ ] A Linux server (Ubuntu 20.04+ recommended) with root/sudo access
- [ ] Domain name pointed to your server IP (e.g., `coact-ai.com`)
- [ ] Azure OpenAI API access with deployments configured
- [ ] Supabase project created
- [ ] Azure Blob Storage (optional, for file storage)

---

## 🚀 Part 1: Database Setup (Supabase)

### Step 1: Access Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Database Schema

Copy the **entire contents** of `supabase_schema.sql` from this repository and paste it into the SQL Editor.

```sql
-- The schema creates these tables:
-- 1. practice_history - Main sessions table
-- 2. coaching_reports - Coaching scenario reports
-- 3. sales_reports - Sales scenario reports
-- 4. mentorship_reports - Mentorship scenario reports (NEW!)
-- 5. learning_plans - Learning and reflection reports
-- 6. user_profiles - User profile information
```

Click **Run** to execute the schema.

### Step 3: Verify Tables Created

In the Supabase dashboard, go to **Table Editor** and verify these tables exist:
- ✅ practice_history
- ✅ coaching_reports
- ✅ sales_reports
- ✅ mentorship_reports
- ✅ learning_plans
- ✅ user_profiles

### Step 4: Configure Authentication

1. Go to **Authentication** → **Settings**
2. Enable **Email** provider
3. (Optional) Configure OAuth providers (Google, GitHub, etc.)
4. Go to **Security** → Enable **Leaked password protection**

### Step 5: Get Database Credentials

Go to **Settings** → **Database** and copy:
- Connection string (replace `[YOUR-PASSWORD]` with actual password)

Go to **Settings** → **API** and copy:
- Project URL
- `anon/public` key
- `service_role` key (keep this secret!)

---

## 🖥️ Part 2: Server Setup

### Step 1: Connect to Your Server

```bash
ssh root@your-server-ip
# or
ssh your-username@your-server-ip
```

### Step 2: Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Install Git
sudo apt install git -y

# Install Certbot (for SSL)
sudo apt install certbot -y
```

### Step 3: Clone the Repository

```bash
cd /opt
sudo git clone https://github.com/suyashB45/COACTAI.git
cd COACTAI
```

---

## ⚙️ Part 3: Configuration

### Step 1: Create Environment File

```bash
# Copy example environment file
cp .env.example .env
```

### Step 2: Configure Root `.env`

Edit the root `.env` file:

```bash
sudo nano .env
```

Update these values:

```env
# Self-Hosted LLM (Ollama)
MODEL_NAME=qwen3.5:0.8b
OLLAMA_API_URL=http://host.docker.internal:11434

# Supabase (optional)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Vite Frontend
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_KEY=your-anon-key
VITE_API_URL=https://coact-ai.com

# Piper TTS Models
PIPER_MODEL_PATH=/app/models/en_US-lessac-medium.onnx
PIPER_MODEL_PATH_BOY=/app/models/en_US-lessac-medium.onnx
PIPER_MODEL_PATH_GIRL=/app/models/en_US-lessac-medium.onnx

# Auth & Security
JWT_SECRET=your-secure-jwt-secret
CORS_ORIGINS=https://coact-ai.com,https://www.coact-ai.com

# Domain
DOMAIN=coact-ai.com
```

**Save**: Press `Ctrl+X`, then `Y`, then `Enter`

### Step 3: Install Ollama & Pull Model

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull your LLM model
ollama pull qwen3.5:0.8b

# Verify Ollama is running
curl http://localhost:11434/api/version
```

### Step 4: Setup Piper TTS Models

```bash
# Create models directory
mkdir -p piper_models

# Download a Piper voice model (example: en_US-lessac-medium)
curl -L https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-lessac-medium.tar.gz \
  -o /tmp/piper-voice.tar.gz
tar -xzf /tmp/piper-voice.tar.gz -C piper_models/
```

---

## 🔐 Part 4: SSL Certificate Setup

### Step 1: Obtain SSL Certificate

Run the SSL initialization script:

```bash
sudo chmod +x init-letsencrypt.sh
sudo ./init-letsencrypt.sh
```

This will:
- Request SSL certificates from Let's Encrypt
- Configure automatic renewal
- Set up HTTPS for your domain

> **Note**: Make sure your domain's DNS A record points to your server IP before running this!

---

## 🐳 Part 5: Deploy with Docker

### Step 1: Build and Start Containers

```bash
sudo docker-compose up -d --build
```

This will build and start:
- **Frontend** (React/Vite + Nginx reverse proxy with SSL)
- **Backend** (Go/Fiber with bundled Whisper & Piper)

### Step 2: Check Container Status

```bash
sudo docker-compose ps
```

All containers should show "Up" status.

### Step 3: View Logs (if needed)

```bash
# View all logs
sudo docker-compose logs -f

# View specific service logs
sudo docker-compose logs -f backend
sudo docker-compose logs -f frontend
```

---

## ✅ Part 6: Verification

### Step 1: Check Backend Health

```bash
curl https://coact-ai.com/api/health
```

Should return:
```json
{"status": "healthy"}
```

### Step 2: Test Frontend

Open your browser and visit:
- `https://coact-ai.com` - Main website
- `https://coact-ai.com/login` - Login page
- `https://coact-ai.com/signup` - Sign up page

### Step 3: Test Complete Flow

1. **Sign up** for a new account
2. **Login** with your credentials
3. Go to **Practice** page
4. Start a **scenario** (e.g., Retail Coaching)
5. Have a **conversation** with the AI
6. End the session and view the **Report**
7. Check **Session History**

---

## 🔄 Part 7: Updating the Application

When you push updates to GitHub:

```bash
# On the server
cd /opt/COACTAI

# Pull latest changes
sudo git pull origin main

# Rebuild and restart containers
sudo docker-compose up -d --build

# Clean up old images (optional)
sudo docker system prune -a
```

---

## 🔧 Troubleshooting

### Database Connection Issues

**Problem**: Backend can't connect to Supabase

**Solution**:
1. Verify `DATABASE_URL` is correct
2. Check Supabase project is not paused
3. Ensure password is URL-encoded (e.g., `@` → `%40`)
4. Verify IP allowlist in Supabase dashboard

### SSL Certificate Issues

**Problem**: SSL certificate not working

**Solution**:
```bash
# Stop containers
sudo docker-compose down

# Remove old certificates
sudo rm -rf ./certbot

# Re-run SSL setup
sudo ./init-letsencrypt.sh

# Restart containers
sudo docker-compose up -d
```

### Container Won't Start

**Problem**: Container exits immediately

**Solution**:
```bash
# Check logs
sudo docker-compose logs backend

# Common fixes:
# 1. Check .env files exist
# 2. Verify all required env vars are set
# 3. Check port conflicts (5001, 3000, 80, 443)
```

### Ollama / LLM Errors

**Problem**: Backend can't reach Ollama

**Solution**:
1. Verify Ollama is running: `curl http://localhost:11434/api/version`
2. Check `OLLAMA_API_URL` in `.env` (use `http://host.docker.internal:11434` for Docker)
3. Verify the model is pulled: `ollama list`
4. Check the model name in `MODEL_NAME` matches exactly

---

## 📊 Monitoring

### Check Application Status

```bash
# Check running containers
sudo docker-compose ps

# View resource usage
sudo docker stats

# Check Nginx access logs
sudo docker-compose logs nginx | tail -100
```

### SSL Certificate Renewal

Automatic renewal is configured via cron. To manually renew:

```bash
sudo ./renew-ssl.sh
```

---

## 🔒 Security Checklist

- [ ] `.env` files are NOT committed to git
- [ ] Supabase Row Level Security (RLS) is enabled on all tables
- [ ] `SUPABASE_SERVICE_KEY` is kept secure (backend only)
- [ ] CORS origins are configured correctly
- [ ] SSL certificates are active and auto-renewing
- [ ] Firewall rules allow only necessary ports (80, 443, 22)
- [ ] SSH key authentication is enabled (disable password auth)
- [ ] Regular backups of Supabase database are configured

---

## 📦 Backup Strategy

### Database Backup

Supabase provides automatic backups. To manually backup:

1. Go to Supabase Dashboard → **Database** → **Backups**
2. Click **Create backup**
3. Download backup file for safekeeping

### Application Backup

```bash
# Backup configuration files
sudo tar -czf coactai-backup-$(date +%Y%m%d).tar.gz \
  /opt/COACTAI/.env \
  /opt/COACTAI/inter-ai-backend/.env \
  /opt/COACTAI/docker-compose.yml

# Store backup securely
```

---

## 🎯 Performance Optimization

### Enable Docker Logging Limits

Edit `docker-compose.yml` and add:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Monitor Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker
sudo docker system prune -a --volumes
```

---

## 📞 Support

- **Documentation**: See [README.md](./README.md) and [ENV_SETUP.md](./ENV_SETUP.md)
- **Issues**: Create an issue on GitHub
- **Database**: [Supabase Docs](https://supabase.com/docs)
- **Azure OpenAI**: [Azure Docs](https://learn.microsoft.com/azure/ai-services/openai/)

---

**Deployment Date**: January 2026  
**Version**: 1.0
