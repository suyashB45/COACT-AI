# CoAct.AI - Fresh Server Deployment Guide

This guide will walk you through deploying CoAct.AI on a fresh server from scratch.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- [ ] A Linux server (Ubuntu 20.04+ recommended) with root/sudo access
- [ ] Domain name pointed to your server IP (e.g., `coact-ai.com`)
- [ ] API keys for Groq, OpenAI, and Sarvam AI
- [ ] Supabase project created

---

## 🚀 Part 1: Database Setup (MongoDB Atlas)

### Step 1: Create a MongoDB Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in/register.
2. Create a new cluster (the free M0 tier works fine for starting out).
3. Under **Database Access**, create a new database user and save the password securely.
4. Under **Network Access**, allow IP access (you can whitelist `0.0.0.0/0` if your server IP changes, or specify your server's exact static IP for better security).

### Step 2: Get Connection String

1. Go back to your Cluster overview.
2. Click **Connect** → **Connect your application**.
3. Copy the provided connection string.
4. Replace `<password>` with the password you created in Step 1. You will need this string for your `.env` file!

*Note: The application will automatically create the necessary collections (`practice_history`, `users`, etc.) upon first startup.*
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
# Groq, OpenAI, and Sarvam API Keys
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
SARVAM_API_KEY=your_sarvam_api_key

# MongoDB Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/coact?retryWrites=true&w=majority

# Vite Frontend
VITE_API_URL=https://coact-ai.com

# Auth & Security
JWT_SECRET=your-secure-jwt-secret
CORS_ORIGINS=https://coact-ai.com,https://www.coact-ai.com

# Domain
DOMAIN=coact-ai.com
```

**Save**: Press `Ctrl+X`, then `Y`, then `Enter`



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
- **Backend** (Python FastAPI)

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

**Problem**: Backend can't connect to MongoDB

**Solution**:
1. Verify `MONGODB_URI` is correct in your `.env` file.
2. Ensure you've replaced `<password>` with the actual MongoDB user password.
3. Verify your server's IP address is whitelisted in MongoDB Atlas under Network Access.

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

### External API Errors

**Problem**: Backend returns 500 when responding to user speech.

**Solution**:
1. Verify that `GROQ_API_KEY`, `OPENAI_API_KEY`, and `SARVAM_API_KEY` are correct in the `.env` file.
2. Check the docker logs (`sudo docker-compose logs backend`) for specific errors from the Groq or Sarvam endpoints.
3. Ensure you have available credits on these platforms.

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
- [ ] MongoDB Atlas Network Access is restricted to your server's IP
- [ ] CORS origins are configured correctly
- [ ] SSL certificates are active and auto-renewing
- [ ] Firewall rules allow only necessary ports (80, 443, 22)
- [ ] SSH key authentication is enabled (disable password auth)
- [ ] Regular backups of Supabase database are configured

---

## 📦 Backup Strategy

### Database Backup

MongoDB Atlas provides automated backups depending on your cluster tier. To manually backup:

1. Use `mongodump` to backup your cluster:
```bash
mongodump --uri="mongodb+srv://<username>:<password>@cluster0.mongodb.net/coact" --out=/path/to/backup
```

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
- **Groq API**: [Groq Docs](https://console.groq.com/docs/quickstart)
- **Sarvam AI**: [Sarvam Docs](https://sarvam.ai/docs)

---

**Deployment Date**: January 2026  
**Version**: 1.0
