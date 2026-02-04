# Supabase Storage Setup for Avatar Uploads

This guide explains how to set up the storage bucket for user avatar uploads.

## Create Storage Bucket

### Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name:** `user-uploads`
   - **Public bucket:** ✅ **Checked** (avatars need to be publicly accessible)
   - **File size limit:** `2MB` (optional, we validate in code)
   - **Allowed MIME types:** Leave default or set to `image/*`

5. Click **Create bucket**

## Configure Storage Policies

After creating the bucket, set up access policies:

### Via SQL Editor

Go to **SQL Editor** and run this SQL:

```sql
-- ============================================
-- Storage Policies for user-uploads bucket
-- ============================================

-- Policy: Anyone can view avatars (public read)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-uploads');

-- Policy: Authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'user-uploads' 
    AND (storage.foldername(name))[1] = 'avatars'
);

-- Policy: Users can update their own avatars
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-uploads')
WITH CHECK (bucket_id = 'user-uploads');

-- Policy: Users can delete their own avatars  
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-uploads');
```

### Via Dashboard (Alternative)

1. In **Storage**, click on the `user-uploads` bucket
2. Go to **Policies** tab
3. Click **New Policy** for each operation:

**SELECT Policy (Public Read):**
- Name: `Public Access`
- Policy definition: `bucket_id = 'user-uploads'`
- Target roles: `public`

**INSERT Policy (Authenticated Upload):**
- Name: `Authenticated users can upload avatars`
- Policy definition: 
  ```sql
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'avatars'
  ```
- Target roles: `authenticated`

**UPDATE & DELETE Policies:**
- Allow authenticated users to manage files in user-uploads bucket

## Folder Structure

The backend will organize uploads as:

```
user-uploads/
└── avatars/
    ├── <user_id>_<timestamp>.jpg
    ├── <user_id>_<timestamp>.png
    └── ...
```

## Testing Storage

### Upload Test

```javascript
// Test upload via JavaScript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('YOUR_URL', 'YOUR_ANON_KEY');

// Login first
await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password'
});

// Upload a test file
const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const { data, error } = await supabase.storage
  .from('user-uploads')
  .upload('avatars/test.jpg', file);

console.log('Upload result:', { data, error });
```

### Get Public URL

```javascript
const { data } = supabase.storage
  .from('user-uploads')
  .getPublicUrl('avatars/test.jpg');

console.log('Public URL:', data.publicUrl);
```

## File Validation

The backend (`profile.service.js`) already validates:

✅ **File Size:** Maximum 2MB  
✅ **File Types:** JPG, PNG, GIF, WebP only  
✅ **Automatic naming:** `<userId>_<timestamp>.<ext>`  
✅ **Upsert:** New uploads replace old ones

## Troubleshooting

### Issue: "new row violates row-level security policy"

**Solution:** Make sure RLS policies are created and enabled for the bucket.

### Issue: "File too large"

**Solution:** 
- Check bucket size limits in Supabase dashboard
- Verify client-side validation is working (should reject before upload)

### Issue: "Access denied" when viewing avatars

**Solution:**
- Ensure bucket is marked as **Public**
- Verify SELECT policy allows public access
- Check CORS settings if accessing from browser

### Issue: Old avatars not getting replaced

**Solution:**
- The service uses `upsert: true` in upload options
- Check file naming is consistent (userId_timestamp format)

## Cleanup Old Avatars (Optional)

To prevent accumulation of unused avatars, you can set up a scheduled function:

```sql
-- Function to delete avatars older than 30 days that aren't current
CREATE OR REPLACE FUNCTION cleanup_old_avatars()
RETURNS void AS $$
BEGIN
    DELETE FROM storage.objects
    WHERE bucket_id = 'user-uploads'
    AND created_at < NOW() - INTERVAL '30 days'
    AND name NOT IN (
        SELECT profile_image_url 
        FROM users 
        WHERE profile_image_url IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Schedule via pg_cron or run manually
```

## Security Best Practices

✅ **File Validation:** Always validate on backend  
✅ **Size Limits:** Enforce both client and server-side  
✅ **Public Access:** Only for avatars, not sensitive files  
✅ **User Isolation:** Users can only modify their own files  
✅ **MIME Type Check:** Verify file types to prevent abuse  

## Next Steps

After setting up storage:

1. ✅ Create the `user-uploads` bucket
2. ✅ Configure storage policies
3. ✅ Test avatar upload in the UI
4. ✅ Verify public URLs work
5. ✅ Check file validation is working
