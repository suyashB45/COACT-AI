# Environment Setup Guide

This guide will help you configure the environment variables needed to run the CoAct.AI application.

## Quick Start

1. **Copy the example environment files**:
   ```powershell
   # Root directory
   Copy-Item .env.example .env
   
   # Backend directory
   Copy-Item inter-ai-backend\.env.example inter-ai-backend\.env
   ```

2. **Update the `.env` files** with your actual credentials (see sections below)

3. **Verify the configuration** by running the health check endpoint

## Required Services

### Groq API (LLM & STT)

You'll need a Groq API key for both the LLM reasoning (`llama-3.3-70b-versatile`) and Speech-to-Text transcription (`whisper-large-v3-turbo`).

**How to obtain credentials**:
1. Go to [Groq Console](https://console.groq.com/)
2. Navigate to **API Keys**
3. Create a new API key and copy it.

**Update in `.env`**:
```env
GROQ_API_KEY=<your-key-here>
```

### Sarvam AI (Text-to-Speech)

You'll need a Sarvam API key for the Text-to-Speech generation (`bulbul:v3`).

**How to obtain credentials**:
1. Go to [Sarvam Dashboard](https://sarvam.ai/dashboard)
2. Navigate to **API Keys**
3. Create a new key and copy it.

**Update in `.env`**:
```env
SARVAM_API_KEY=<your-key-here>
```

### OpenAI (Optional Fallback TTS)

OpenAI is used as an optional fallback for Text-to-Speech.

**Update in `.env`**:
```env
OPENAI_API_KEY=<your-key-here>
```

### MongoDB Atlas (NoSQL Database)

CoAct.AI uses MongoDB Atlas for session and practice history data persistence.

**How to obtain credentials**:
1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. Select your project and navigate to **Database** under Deployment.
3. Click on **Connect** for your cluster, choose **Drivers**, and copy the connection string.
4. Replace `<password>` with your database user password, and set your cluster host.

**Update in `.env`**:
```env
MONGODB_URI=mongodb+srv://suyashbalasubramaniam_db_user:RZmQbu4TeqBO8MLN@<cluster-address>/coact?retryWrites=true&w=majority
```

### Supabase (Auth and Storage)

CoAct.AI uses Supabase for user authentication and optionally other services.

**Update in `.env`**:
```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-role-key>
```

> **⚠️ Warning**: The `SUPABASE_SERVICE_KEY` bypasses Row Level Security. Keep it secret and only use it in backend code.

### CORS Configuration

Update the `CORS_ORIGINS` to include all domains that will access your backend:

```env
CORS_ORIGINS=http://localhost,http://localhost:3000,https://your-production-domain.com
```

## Configuration Files

### Root `.env`
Contains deployment-wide configuration. Used by Docker Compose and deployment scripts.

### Backend `.env` (`inter-ai-backend/.env`)
Contains backend-specific configuration. Used by the Flask application.

> **📝 Note**: Some variables are duplicated between root and backend `.env` files to support both Docker and local development workflows.

## Verification

### Test Backend Connection

```powershell
cd inter-ai-backend
python app.py
```

Visit `http://localhost:5001/health` (or your configured port) to verify the backend is running.

### Test Groq API Connection

```powershell
# In the backend directory
python -c "import os; from groq import Groq; client = Groq(api_key=os.getenv('GROQ_API_KEY')); print('✅ Groq connection successful')"
```

### Test Database Connection

```powershell
# Test with psql (if installed)
# Extract connection details from DATABASE_URL and connect
```

## Security Best Practices

### 🔒 Never Commit `.env` Files

The `.gitignore` is configured to exclude all `.env` files. Always verify before committing:

```powershell
git status
# Ensure .env files are not listed
```

### 🔄 Rotate Credentials Regularly

- Change API keys every 90 days
- Use secure environment variable managers in production (e.g. AWS Parameter Store, Azure Key Vault)

### 🌍 Environment-Specific Configurations

For production deployments:
- Use separate Supabase databases for dev/staging/prod
- Configure environment variables via deployment platform
- Never store production credentials in local `.env` files

### 🔍 Audit Access

Regularly review:
- Who has access to Azure Portal
- Supabase project members
- Service principal permissions

## Troubleshooting

### Authentication Error from Groq or Sarvam

**Symptom**: `401 Unauthorized` or `Invalid API Key` error from APIs.

**Solution**:
1. Verify the `GROQ_API_KEY` or `SARVAM_API_KEY` is exactly as copied from the dashboard.
2. Check that the `.env` file is loaded correctly by the FastAPI server.

### Database Connection Issues

**Symptom**: Connection timeout or DNS/Server Selection errors when connecting to MongoDB Atlas.

**Solution**:
1. Verify the `MONGODB_URI` contains the correct password and cluster domain name.
2. Check that the password does not contain special characters that require URL-encoding (or URL-encode them, e.g., `@` becomes `%40`).
3. Verify the IP Access List in the MongoDB Atlas console allows your current IP address (or set it to `0.0.0.0/0` to allow all IP addresses for development/testing).
4. Ensure you have installed the required dependencies (`pymongo[srv]`).

### CORS Errors

**Symptom**: Browser console shows CORS policy errors.

**Solution**:
1. Add frontend domain to `CORS_ORIGINS`
2. Ensure no trailing slashes in domain names
3. Include protocol (`http://` or `https://`)

## Getting Help

- **Groq API**: [Documentation](https://console.groq.com/docs/quickstart)
- **Sarvam AI**: [Documentation](https://sarvam.ai/docs)
- **Supabase**: [Documentation](https://supabase.com/docs)
- **Project Issues**: Create an issue in the repository

## Development vs Production

### Development Setup
```env
FLASK_ENV=development
CORS_ORIGINS=http://localhost,http://localhost:3000
```

### Production Setup
```env
FLASK_ENV=production
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

---

**Last Updated**: January 2026
