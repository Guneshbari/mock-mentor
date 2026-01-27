# 🚀 Deployment Guide

This guide will help you deploy **Mock Mentor** to production. Since the app has a separate **Frontend (Next.js)** and **Backend (Node/Express)**, we recommend deploying them independently.

---

## 🏗️ Architecture Overview

- **Frontend**: Next.js App -> Deploys best on **Vercel**.
- **Backend**: Node.js API -> Deploys best on **Render**, **Railway**, or **Heroku**.
- **Communication**: Frontend calls Backend via REST API.

---

## 1️⃣ Deploy Backend (Render.com)

We recommend [Render](https://render.com) for the backend because it provides a free tier for Node.js services.

### Steps:
1. Push your code to GitHub.
2. Sign up/Login to [Render.com](https://render.com).
3. Click **New +** and select **Web Service**.
4. Connect your valid GitHub repository (`mock-mentor`).
5. Configure the service:
   - **Name**: `mock-mentor-backend`
   - **Root Directory**: `backend` (⚠️ **CRITICAL STARTUP STEP**: You MUST set this, otherwise the build will fail!)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. **Environment Variables** (Add these in the "Environment" tab):
   - `GEMINI_API_KEY`: *[Your Google Gemini API Key from https://aistudio.google.com/]* (Required if using Gemini)
   - `GROQ_API_KEY`: *[Your Groq API Key]* (Optional - if you prefer Groq instead)
   - `NODE_ENV`: `production`

7. Click **Create Web Service**.
8. **Copy the URL**: Once deployed, Render will give you a URL like `https://mock-mentor-backend.onrender.com`. **Save this!**

---

## 2️⃣ Deploy Frontend (Vercel)

We recommend [Vercel](https://vercel.com) as it's the creators of Next.js.

### Steps:
1. Sign up/Login to [Vercel.com](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Import your `mock-mentor` GitHub repository.
4. **Configure Project Settings** (Expand logic):
   - **Framework Preset**: Next.js.
   - **Root Directory**: Click "Edit" and select `frontend`. (⚠️ **CRITICAL**: Do not leave as root `./`)
5. **Environment Variables**:
   - `BACKEND_URL`: Paste your Render Backend URL (e.g., `https://mock-mentor-backend.onrender.com`)
   - `NEXT_PUBLIC_BACKEND_URL`: Paste the SAME URL again (Next.js client-side needs this).
     *Note: Do NOT add a trailing slash `/` at the end.*

6. Click **Deploy**.

---

## 3️⃣ Verification

1. Go to your new Vercel URL (e.g., `https://mock-mentor.vercel.app`).
2. Try to start an interview.
3. If it loads the questions, **Success!** 🎉
4. If it errors, check:
   - Did you set the `BACKEND_URL` variable in Vercel?
   - Is the Backend running on Render? (Check Render logs).
   - Did you use the correct API Key?

---

## 🐳 Option 2: Docker (Advanced)

If you prefer to host everything on a VPS (like DigitalOcean, AWS EC2), you can use Docker.

### Backend Dockerfile
Create `backend/Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8000
CMD ["npm", "start"]
```

### Frontend Dockerfile
Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Then use `docker-compose` to orchestrate them.
