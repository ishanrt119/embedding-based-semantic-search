# DocIntel Deployment Guide

This document outlines the deployment strategy for the DocIntel Platform.

## Architecture

* **Frontend**: Next.js App Router deployed on **Vercel**
* **Backend**: FastAPI (Python) deployed on **Railway**
* **Database**: **MongoDB Atlas**
* **LLM Engine**: **Groq API**
* **Vector Store**: **FAISS** (runs in-memory/on-disk within Railway container)

---

## Environment Variables

### Frontend (Vercel)
Set these variables in the Vercel project dashboard:
```env
# URL of your Railway backend
NEXT_PUBLIC_API_URL=https://docintel-backend-production.up.railway.app
```

### Backend (Railway)
Set these variables in the Railway project variables:
```env
# Security
SECRET_KEY=generate_a_random_secure_string

# Frontend Domain (for CORS)
FRONTEND_URL=https://your-vercel-app.vercel.app

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=docintel_prod

# LLM
GROQ_API_KEY=your_groq_api_key
```

---

## Deployment Steps

### 1. Database & AI Services
1. Create a MongoDB Atlas cluster and get the connection URI.
2. Sign up for Groq Console and generate an API Key.

### 2. Backend (Railway)
1. Link your GitHub repository to Railway.
2. Select the `backend/` folder as the root directory for the Railway service.
3. Configure the `Start Command` in Railway:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. Input all the required Environment Variables listed above.
5. Deploy. Wait for the green status.
6. Verify via `https://<your-railway-url>/health`

### 3. Frontend (Vercel)
1. Import your GitHub repository to Vercel.
2. Set the **Root Directory** to `frontend`.
3. Framework preset should auto-detect as **Next.js**.
4. Add the `NEXT_PUBLIC_API_URL` environment variable using your Railway domain.
5. Deploy.

---

## Deployment Validation Checklist

After deployment, perform a manual walkthrough to guarantee production readiness.

- [ ] **Signup**: Can you successfully create a new account?
- [ ] **Login**: Can you log out and log back in?
- [ ] **Upload Documents**: Does the dataset upload succeed?
- [ ] **Chunk Generation**: Does the status turn to "completed"?
- [ ] **Embedding Generation**: Does the vector indexing succeed?
- [ ] **FAISS Indexing**: Does the Dashboard show "Processed Documents"?
- [ ] **Semantic Search**: Try a query, verify latency and results.
- [ ] **RAG Chat**: Ask a complex question, verify streaming response and citations.
- [ ] **Intelligence Module**: Compare two documents successfully.
- [ ] **Report Generation**: Export a report to Markdown and PDF.
- [ ] **Dark/Light Mode**: Check theme toggling in the UI.
- [ ] **Logout**: Ensure session is destroyed.
