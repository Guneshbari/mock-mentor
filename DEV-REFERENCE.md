# Mock Mentor - Developer Reference Card

Quick reference for common tasks and configurations.

---

## 🚀 Quick Commands

### Development
```bash
# Start backend (development mode with hot reload)
cd backend && npm run dev

# Start frontend (development mode)
cd frontend && npm run dev

# Install all dependencies
cd backend && npm install && cd ../frontend && npm install
```

### Production
```bash
# Start backend (production)
cd backend && npm start

# Build frontend
cd frontend && npm run build

# Start frontend (production)
cd frontend && npm start
```

---

## 🔧 Environment Variables

### Backend (`.env`)
```env
# Required
PORT=8000
GEMINI_API_KEY=your_key_here          # Primary AI provider

# Optional
GROQ_API_KEY=your_groq_key            # Alternative AI provider
QUESTION_MODEL=gemini-2.0-flash-exp   # Override default
EVALUATION_MODEL=gemini-2.0-flash-exp # Override default
REPORT_MODEL=gemini-2.0-flash-exp     # Override default
NODE_ENV=development                  # development | production
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📡 API Endpoints

### POST `/api/start`
Start a new interview
```json
{
  "role": "Frontend Developer",
  "experienceLevel": "mid",
  "interviewType": "technical"
}
```

### POST `/api/next`
Submit answer and get next question
```json
{
  "answer": "Your answer here",
  "context": { /* context from previous response */ }
}
```

### GET `/health`
Health check
```json
{ "status": "ok" }
```

---

## 🎯 Configuration Values

### Roles
```
Frontend Developer
Backend Developer
Full Stack Developer
DevOps Engineer
Data Scientist
Machine Learning Engineer
Mobile Developer
QA Engineer
Product Manager
UI/UX Designer
Software Architect
Cloud Engineer
Security Engineer
Database Administrator
```

### Experience Levels
```
fresh  - Entry level / Junior
mid    - Mid-level (2-5 years)
senior - Senior level (5+ years)
```

### Interview Types
```
technical  - Technical/coding questions
hr         - HR/culture fit questions
behavioral - STAR method questions
```

---

## 🏗️ Project Structure

```
mock-mentor/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── blocks/              # AI Logic Blocks
│   │   │   ├── GeminiService.js     # Gemini integration
│   │   │   ├── GroqService.js       # Groq integration
│   │   │   ├── ai.service.js        # AI orchestration
│   │   │   └── interview.service.js # Interview logic
│   │   ├── controllers/             # Route handlers
│   │   ├── routes/                  # API routes
│   │   └── server.js                # Entry point
│   └── package.json
└── frontend/
    ├── app/                         # Next.js pages
    ├── components/                  # React components
    └── lib/                         # Utilities
```

---

## 🔍 Important Files

### Backend
- `src/services/blocks/RoleStrategies.js` - Role configurations
- `src/services/GeminiService.js` - Gemini AI wrapper
- `src/services/ai.service.js` - Main AI orchestration
- `src/server.js` - Server entry point

### Frontend
- `app/page.tsx` - Home page
- `app/interview/page.tsx` - Interview page
- `components/interview-session.tsx` - Interview UI

---

## 🐛 Debugging

### Backend Logs
```bash
# View server logs
cd backend && npm run dev
# Logs appear in terminal
```

### Frontend Logs
- Open browser console (F12)
- Network tab for API calls
- React DevTools for component debugging

### Common Issues
```bash
# Port already in use
lsof -ti:8000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :8000   # Windows

# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Check API connectivity
curl http://localhost:8000/health
```

---

## 📦 Dependencies

### Backend Key Dependencies
```json
{
  "@google/generative-ai": "^0.24.1",
  "express": "^4.21.2",
  "cors": "^2.8.5",
  "dotenv": "^17.2.3",
  "groq-sdk": "*"
}
```

### Frontend Key Dependencies
```json
{
  "next": "^15.1.3",
  "react": "^19.0.0",
  "typescript": "^5",
  "tailwindcss": "^4.1.9"
}
```

---

## 🎨 Customization

### Add New Role
Edit `backend/src/services/blocks/RoleStrategies.js`:
```javascript
MASTER_ROADMAPS["New Role"] = {
  fresh: {
    technical: ["Topic 1", "Topic 2", ...],
    hr: ["Question 1", "Question 2", ...],
    behavioral: ["Scenario 1", "Scenario 2", ...]
  },
  // ... mid and senior
};
```

### Change AI Model
In `backend/.env`:
```env
QUESTION_MODEL=gemini-1.5-pro      # Use Pro instead of Flash
EVALUATION_MODEL=gemini-1.5-pro
```

---

## 🚀 Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Add production API keys
- [ ] Update `ALLOWED_ORIGINS` (backend)
- [ ] Set `NEXT_PUBLIC_BACKEND_URL` (frontend)
- [ ] Build frontend: `npm run build`
- [ ] Test health endpoint
- [ ] Verify CORS configuration

---

## 📚 Documentation Links

- [Main README](README.md)
- [Quick Start](QUICKSTART.md)
- [API Documentation](API.md)
- [Interview Roadmaps](ROADMAPS.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

---

## 💡 Tips

1. **Use `npm run dev`** for development (auto-restart)
2. **Check `.env` first** when debugging API issues
3. **Clear browser cache** if frontend doesn't update
4. **Use React DevTools** for component debugging
5. **Check Network tab** for API call errors
6. **Read ROADMAPS.md** to understand question flow

---

**Version:** 1.1.0 | **Last Updated:** 2026-01-28
