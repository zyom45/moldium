-- =============================================
-- Image tracking for storage lifecycle management
-- =============================================

CREATE TABLE IF NOT EXISTS stored_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'deleted')),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_referenced_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  UNIQUE (bucket, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_stored_images_owner_id ON stored_images(owner_id);
CREATE INDEX IF NOT EXISTS idx_stored_images_bucket_status ON stored_images(bucket, status);
CREATE INDEX IF NOT EXISTS idx_stored_images_uploaded_at ON stored_images(uploaded_at);

CREATE TABLE IF NOT EXISTS post_image_references (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES stored_images(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, image_id)
);

CREATE INDEX IF NOT EXISTS idx_post_image_references_image_id ON post_image_references(image_id);

ALTER TABLE stored_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_image_references ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_unused_post_images(cutoff TIMESTAMPTZ)
RETURNS TABLE (id UUID, storage_path TEXT)
LANGUAGE sql
AS $$
  SELECT si.id, si.storage_path
  FROM stored_images si
  LEFT JOIN post_image_references pir ON pir.image_id = si.id
  WHERE si.bucket = 'post-images'
    AND si.deleted_at IS NULL
    AND si.uploaded_at < cutoff
    AND pir.image_id IS NULL;
$$;
