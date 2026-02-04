
# Profile Backend Setup - Quick Start Guide

Follow these steps to complete the profile backend setup.

## Step 1: Create Database Table ✅

### Via Supabase Dashboard (Easiest)

1. Open your [Supabase Dashboard](https://app.supabase.com)
2. Select your Mock Mentor project
3. Go to **SQL Editor** (in left sidebar)
4. Click **New Query**
5. Open this file: [`migrations/create_notification_preferences.sql`](./migrations/create_notification_preferences.sql)
6. Copy all the SQL content
7. Paste into the Supabase SQL editor
8. Click **Run** (or press `Ctrl+Enter`)

You should see: ✅ "Success. No rows returned"

### Verify Table Creation

Run this in SQL Editor to verify:

```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'notification_preferences';
```

Expected output: 7 columns (id, user_id, email_notifications, session_reminders, weekly_report, created_at, updated_at)

---

## Step 2: Create Storage Bucket ✅

### Via Supabase Dashboard

1. In Supabase Dashboard, go to **Storage** (in left sidebar)
2. Click **New bucket**
3. Fill in:
   - **Name:** `user-uploads`
   - **Public bucket:** ✅ **CHECK THIS BOX** (important!)
4. Click **Create bucket**

### Set Up Storage Policies

1. Click on the `user-uploads` bucket
2. Go to **Policies** tab
3. Click **New Policy**
4. Select **For full customization, create a policy from scratch**
5. Create this policy:

**Policy for Public Read:**
```
Policy name: Public Access
Allowed operation: SELECT
Policy definition: bucket_id = 'user-uploads'
WITH CHECK: (leave empty)
Target roles: public (check the box)
```

6. Click **Review** then **Save policy**

7. Create another policy for authenticated uploads:

**Policy for User Uploads:**
```
Policy name: Authenticated users can upload
Allowed operation: INSERT
Policy definition: bucket_id = 'user-uploads'
WITH CHECK: bucket_id = 'user-uploads'
Target roles: authenticated (check the box)
```

8. Repeat for UPDATE and DELETE operations (similar to INSERT)

---

## Step 3: Test the Implementation 🧪

### Backend Test

Your backend server should already be running (`npm run dev` in d:\mock-mentor\backend). Check console for:

```
✅ Server running on port 8000
✅ No errors on startup
```

Visit: http://localhost:8000/

You should see all the new profile endpoints listed.

### Frontend Test

1. Navigate to the Profile/Settings page in your app
2. Try updating your profile information
3. Test avatar upload (should accept JPG, PNG, GIF, WebP under 2MB)
4. Toggle notification preferences
5. Try exporting your data

---

## Verification Checklist

- [ ] `notification_preferences` table created in Supabase
- [ ] `user-uploads` storage bucket created
- [ ] Storage bucket is marked as **Public**
- [ ] Storage policies are configured (at minimum: public SELECT, authenticated INSERT)
- [ ] Backend server running without errors
- [ ] Frontend can update profile information
- [ ] Avatar upload works and shows preview
- [ ] Notification preferences load and save
- [ ] Data export downloads JSON file

---

## Quick Reference

### Database Migration File
📄 [`backend/database/migrations/create_notification_preferences.sql`](./migrations/create_notification_preferences.sql)

### Storage Setup Guide
📄 [`backend/database/STORAGE_SETUP.md`](./STORAGE_SETUP.md)

### Migration Instructions
📄 [`backend/database/migrations/README.md`](./migrations/README.md)

---

## Troubleshooting

### "User profile not found" error
- **Cause:** User doesn't exist in `users` table
- **Fix:** Make sure you're logged in and user record exists

### "Access denied" on avatar upload
- **Cause:** Storage policies not configured or bucket not public
- **Fix:** Follow Step 2 again, ensure bucket is public and policies are set

### Notification preferences don't save
- **Cause:** Table doesn't exist or RLS policies blocking access
- **Fix:** Run the migration SQL again, check RLS policies

### Avatar doesn't display after upload
- **Cause:** Bucket not public or incorrect URL
- **Fix:** Ensure bucket is public, check URL format in response

---

## Environment Variables

Make sure your backend `.env` has:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## What's Already Done ✅

- ✅ Backend services implemented
- ✅ API routes configured  
- ✅ Frontend API client created
- ✅ Profile UI component updated
- ✅ File upload validation (client + server)
- ✅ Loading states and error handling
- ✅ Toast notifications for feedback
- ✅ Multer installed for file uploads

## What You Need to Do 🔧

1. Run SQL migration (2 minutes)
2. Create storage bucket (2 minutes)
3. Test in UI (5 minutes)

**Total setup time: ~10 minutes**

---

## Need Help?

If you encounter issues:

1. Check backend console for error messages
2. Check browser console for frontend errors
3. Verify Supabase credentials in `.env`
4. Ensure you're logged in with a valid user
5. Check Supabase dashboard for table/bucket existence

---

Happy coding! 🚀
