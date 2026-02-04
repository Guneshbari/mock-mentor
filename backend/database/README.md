# Database Setup Files

This directory contains database migration scripts and setup guides for MockMentor.

## 📁 Files

- **[SETUP.md](./SETUP.md)** - 🚀 **START HERE!** Quick setup guide with step-by-step instructions
- **[STORAGE_SETUP.md](./STORAGE_SETUP.md)** - Detailed guide for Supabase Storage configuration
- **[migrations/](./migrations/)** - SQL migration files
  - `create_notification_preferences.sql` - Creates notification preferences table
  - `README.md` - Migration running instructions

## 🎯 Quick Setup (10 minutes)

1. **Create Database Table**
   - Open [Supabase SQL Editor](https://app.supabase.com)
   - Run [`migrations/create_notification_preferences.sql`](./migrations/create_notification_preferences.sql)

2. **Create Storage Bucket**
   - Go to Supabase Storage
   - Create `user-uploads` bucket (make it public)
   - Set up storage policies

3. **Test**
   - Update profile in the UI
   - Upload an avatar
   - Toggle notification preferences

## 📖 Documentation

For detailed instructions, see [SETUP.md](./SETUP.md)
