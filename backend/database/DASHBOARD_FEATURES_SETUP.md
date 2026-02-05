# Dashboard Backend Features - Setup Guide

This guide explains how to set up and use the new dashboard backend features for goals performance trend, achievements, and pro tips.

## 🚀 Quick Setup (5 minutes)

### Step 1: Run Database Migrations

The new features require three database tables. Run these migrations in your Supabase SQL Editor:

1. **Open Supabase SQL Editor**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your Mock Mentor project
   - Click **SQL Editor** in the sidebar

2. **Run each migration file** (in order):
   
   **First: Achievements Table**
   - Open `backend/database/migrations/001_create_achievements_table.sql`
   - Copy all content
   - Paste in SQL Editor and click **Run**
   
   **Second: Pro Tips Table**
   - Open `backend/database/migrations/002_create_pro_tips_table.sql`
   - Copy all content
   - Paste in SQL Editor and click **Run**
   - This will also seed 30 professional interview tips!
   
   **Third: Goals Tracking Table**
   - Open `backend/database/migrations/003_create_goals_tracking_table.sql`
   - Copy all content
   - Paste in SQL Editor and click **Run**

3. **Verify Tables Were Created**
   
   Run this query to check:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('user_achievements', 'pro_tips', 'user_goals')
   ORDER BY table_name;
   ```
   
   You should see all three tables listed.

4. **Check Pro Tips Were Seeded**
   
   Run this query:
   ```sql
   SELECT category, count(*) 
   FROM pro_tips 
   GROUP BY category;
   ```
   
   You should see counts for technical, behavioral, hr, and general categories.

### Step 2: Restart Backend Server

The backend server should auto-restart if you're using `npm run dev`, but if not:

```powershell
# Navigate to backend directory
cd d:\mock-mentor\backend

# Restart the server
npm run dev
```

### Step 3: Test the New Endpoints

Once the backend is running, the new endpoints are available:

```powershell
# Pro tips (no auth needed)
   curl http://localhost:8000/api/dashboard/pro-tips
   
   # Achievements (needs auth)
   curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/dashboard/achievements
   
   # Goals performance (needs auth)
   curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/dashboard/goals/performance
```

## 📊 API Reference

### GET /api/dashboard/pro-tips

Get random professional interview tips.

**Query Parameters:**
- `count` (optional, default: 3) - Number of tips to return
- `category` (optional) - Filter by category: `technical`, `behavioral`, `hr`, `general`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tip_text": "Use the STAR method...",
      "category": "behavioral"
    }
  ]
}
```

---

### GET /api/dashboard/achievements

Get user's recent achievements. Also checks and auto-awards new achievements.

**Query Parameters:**
- `limit` (optional, default: 5) - Number of achievements to return

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "achievement_type": "first_session",
      "title": "🎉 First Step",
      "description": "Completed your first mock interview!",
      "icon": "🎉",
      "earned_at": "2026-02-05T14:00:00Z"
    }
  ]
}
```

**Achievement Types:**
- `first_session` - Complete 1 interview
- `sessions_5` - Complete 5 interviews
- `sessions_10` - Complete 10 interviews
- `sessions_25` - Complete 25 interviews
- `sessions_50` - Complete 50 interviews
- `high_score` - Score 80+ in an interview
- `perfect_score` - Score 100 in an interview

---

### GET /api/dashboard/goals/performance

Get user's goals and performance trend over the last 30 days.

**Response:**
```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "id": "uuid",
        "goal_type": "land_first_job",
        "goal_name": "Land First Job",
        "target_value": 20,
        "current_value": 5,
        "progress_percentage": 25,
        "status": "active"
      }
    ],
    "onboardingGoals": ["Land First Job", "Improve Confidence"],
    "performanceTrend": [
      {
        "week": "2026-01-27",
        "averageScore": 75,
        "sessionCount": 3
      }
    ]
  }
}
```

## 🎯 Features

### Auto-Award Achievements

Achievements are automatically checked and awarded when you call the `/api/dashboard/achievements` endpoint. The system checks your statistics and awards any achievements you've earned.

### Rotating Pro Tips

Pro tips rotate randomly on each request. Tips are categorized and you can filter by category. Perfect for showing different tips on app refresh!

### Performance Tracking

The goals performance trend endpoint provides:
- Active user goals with auto-calculated progress percentages
- Onboarding goals from user preferences
- Weekly performance trend over last 30 days with average scores and session counts

## 🔧 Troubleshooting

**Issue: "Table does not exist" error**
- Solution: Run the database migrations in Supabase SQL Editor

**Issue: Pro tips returning empty array**
- Solution: Make sure migration 002 was run successfully to seed the tips

**Issue: Achievements not auto-awarding**
- Solution: Complete at least one mock interview session first

**Issue: 401 Unauthorized**
- Solution: Make sure you're passing a valid authentication token in the request headers

## 💡 Integration Tips

### Frontend Integration

```javascript
// Get pro tips on app load/refresh
const response = await fetch('/api/dashboard/pro-tips?count=3');
const { data: tips } = await response.json();

// Get achievements
const achievementsRes = await fetch('/api/dashboard/achievements', {
  headers: { Authorization: `Bearer ${token}` }
});
const { data: achievements } = await achievementsRes.json();

// Get goals performance
const goalsRes = await fetch('/api/dashboard/goals/performance', {
  headers: { Authorization: `Bearer ${token}` }
});
const { data: performance } = await goalsRes.json();
```

### Calling from Interview Completion

Add achievement checking after completing an interview:

```javascript
// After session completion
await fetch('/api/dashboard/achievements', {
  headers: { Authorization: `Bearer ${token}` }
});
// This will auto-check and award new achievements
```

## 📖 Next Steps

1. ✅ Run database migrations
2. ✅ Test endpoints
3. 🔄 Integrate with frontend dashboard
4. 🎨 Design UI components for displaying achievements and tips
5. 📊 Create charts for performance trend visualization

## 🆘 Need Help?

Check the detailed migration documentation at `backend/database/migrations/README.md`
