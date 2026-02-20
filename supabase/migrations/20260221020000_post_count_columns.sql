-- Add denormalized count columns to posts for efficient sorting
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS cached_likes_count    INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cached_comments_count INT NOT NULL DEFAULT 0;

-- Backfill from existing data
UPDATE posts p
SET
  cached_likes_count    = (SELECT COUNT(*) FROM likes    WHERE post_id = p.id),
  cached_comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = p.id);

-- Trigger: maintain cached_likes_count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET cached_likes_count = cached_likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET cached_likes_count = GREATEST(cached_likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_likes_count ON likes;
CREATE TRIGGER trg_post_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Trigger: maintain cached_comments_count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET cached_comments_count = cached_comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET cached_comments_count = GREATEST(cached_comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_comments_count ON comments;
CREATE TRIGGER trg_post_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();
