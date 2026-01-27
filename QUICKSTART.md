# Quick Start Guide

Get Mock Mentor up and running in 5 minutes!

## Prerequisites

Before you begin, make sure you have:
- ✅ **Node.js 18+** installed ([Download](https://nodejs.org/))
- ✅ **Git** installed ([Download](https://git-scm.com/))
- ✅ **Google Gemini API Key** ([Get Free Key](https://aistudio.google.com/))

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/mock-mentor.git
cd mock-mentor
```

---

## Step 2: Setup Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Now edit `.env` and add your API key:

```env
PORT=8000
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Get your Gemini API Key:**
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API Key"
3. Create a new API key
4. Copy and paste it into your `.env` file

---

## Step 3: Setup Frontend

```bash
# Navigate to frontend folder (from project root)
cd ../frontend

# Install dependencies
npm install
```

---

## Step 4: Start the Application

Open **two terminal windows**:

### Terminal 1 - Start Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
✅ Mock Mentor API running on http://localhost:8000
```

### Terminal 2 - Start Frontend

```bash
cd frontend
npm run dev
```

You should see:
```
✅ Ready on http://localhost:3000
```

---

## Step 5: Try Your First Interview!

1. Open your browser and go to **http://localhost:3000**
2. Select your:
   - **Job Role** (e.g., Frontend Developer)
   - **Experience Level** (Fresh, Mid, or Senior)
   - **Interview Type** (Technical, HR, or Behavioral)
3. Click **Start Interview**
4. Answer 5 questions
5. Get your comprehensive feedback report!

---

## 🎉 You're All Set!

### What's Next?

- **Try Different Roles**: Test interviews for all 14 supported roles
- **Explore the Roadmaps**: Check out [ROADMAPS.md](ROADMAPS.md) for all question topics
- **Check the API**: See [API.md](API.md) for integration details
- **Customize**: Modify role strategies in `backend/src/services/blocks/RoleStrategies.js`

---

## Common Issues

### ❌ Backend won't start

**Problem**: `Error: GEMINI_API_KEY is required`

**Solution**: Make sure you've added your API key to `backend/.env`

---

### ❌ Frontend can't connect to backend

**Problem**: Network error when starting interview

**Solution**: 
1. Check backend is running on port 8000
2. Make sure no other service is using port 8000
3. Check console for CORS errors

---

### ❌ API Key Invalid

**Problem**: `Error: Invalid API key`

**Solution**:
1. Verify your Gemini API key at [Google AI Studio](https://aistudio.google.com/)
2. Ensure there are no extra spaces in your `.env` file
3. Try generating a fresh API key

---

## Alternative: Using Groq Instead

If you prefer to use Groq instead of Gemini:

1. Get a Groq API key from [console.groq.com](https://console.groq.com/)
2. In `backend/.env`, use:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   # Comment out or remove GEMINI_API_KEY
   ```
3. Restart the backend server

---

## Development Tips

### Hot Reload
Both frontend and backend support hot reload:
- **Backend**: Uses `nodemon` - changes auto-restart the server
- **Frontend**: Next.js Fast Refresh - changes appear instantly

### Debugging
- Backend logs appear in the terminal running `npm run dev`
- Frontend errors appear in browser console (F12)
- Check Network tab for API call failures

### Making Changes
- **Add new roles**: Edit `backend/src/services/blocks/RoleStrategies.js`
- **Modify UI**: Edit files in `frontend/components/`
- **Change API logic**: Edit files in `backend/src/services/`

---

## Next Steps

1. ✅ Read the [README.md](README.md) for full documentation
2. ✅ Check [DEPLOYMENT.md](DEPLOYMENT.md) to deploy to production
3. ✅ Review [CONTRIBUTING.md](CONTRIBUTING.md) to contribute

---

## Need Help?

- 📚 Check the [API Documentation](API.md)
- 🗺️ View [Interview Roadmaps](ROADMAPS.md)
- 🐛 Report issues on [GitHub Issues](https://github.com/yourusername/mock-mentor/issues)

---

**Happy interviewing! 🚀**
