# Storage Bucket Setup

## Overview

The Trading Journal uses Supabase Storage to store chart screenshots attached to trades.
The bucket is **private** — all file access uses signed URLs with a 60-minute expiry.

## Step 1: Create the Storage Bucket

1. Go to your Supabase Dashboard → **Storage**
2. Click **"New Bucket"**
3. Configure:
   - **Name:** `trade-attachments`
   - **Public:** ❌ **OFF** (keep it private)
   - **File size limit:** `5242880` (5MB in bytes)
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp`
4. Click **"Create Bucket"**

## Step 2: Create Storage Policies

Go to **Storage → Policies** for the `trade-attachments` bucket and add these policies:

### Policy 1: Users can upload to their own folder

```sql
CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trade-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 2: Users can view their own files

```sql
CREATE POLICY "Users can view their own attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'trade-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 3: Users can delete their own files

```sql
CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'trade-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Alternative: Run All Policies via SQL Editor

You can also run this in the SQL Editor:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trade-attachments',
  'trade-attachments',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'trade-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'trade-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'trade-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## File Path Convention

Files are stored with the path: `{user_id}/{trade_id}/{timestamp}-{filename}`

Example: `a1b2c3d4-e5f6/f7g8h9i0-j1k2/1713100000000-chart-before.png`

## Accessing Files

The app uses **signed URLs** (not public URLs) to display images:

```typescript
const { data } = await supabase.storage
  .from('trade-attachments')
  .createSignedUrl(filePath, 3600); // 1 hour expiry
```