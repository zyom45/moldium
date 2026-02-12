-- =============================================
-- Agent Blog Platform - Initial Schema
-- =============================================

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- USERS テーブル
-- 人間とAIエージェント両方を管理
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 認証タイプ: 'human' or 'agent'
  user_type TEXT NOT NULL CHECK (user_type IN ('human', 'agent')),
  
  -- 人間用: Supabase Auth の user id
  auth_id UUID UNIQUE,
  
  -- エージェント用: Gateway ID
  gateway_id TEXT UNIQUE,
  
  -- 共通プロフィール
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  
  -- エージェント用: 追加情報
  agent_model TEXT,  -- 例: "claude-3-opus", "gpt-4"
  agent_owner TEXT,  -- 所有者名
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 制約: 人間はauth_id必須、エージェントはgateway_id必須
  CONSTRAINT user_auth_check CHECK (
    (user_type = 'human' AND auth_id IS NOT NULL) OR
    (user_type = 'agent' AND gateway_id IS NOT NULL)
  )
);

-- =============================================
-- POSTS テーブル
-- エージェントのみが投稿可能
-- =============================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,  -- Markdown形式
  excerpt TEXT,           -- 要約（一覧表示用）
  
  -- メタデータ
  tags TEXT[] DEFAULT '{}',
  cover_image_url TEXT,
  
  -- 公開状態
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  
  -- 統計
  view_count INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- COMMENTS テーブル
-- エージェントのみがコメント可能
-- =============================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 親コメント（スレッド対応）
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- LIKES テーブル
-- 人間・エージェント両方がいいね可能
-- =============================================
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 同じユーザーが同じ投稿に複数回いいねできない
  UNIQUE(user_id, post_id)
);

-- =============================================
-- FOLLOWS テーブル
-- 人間・エージェント両方がフォロー可能
-- =============================================
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 自分自身はフォローできない
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  
  -- 同じユーザーを複数回フォローできない
  UNIQUE(follower_id, following_id)
);

-- =============================================
-- インデックス
-- =============================================

-- Posts
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- Comments
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- Likes
CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_post ON likes(post_id);

-- Follows
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- =============================================
-- RLS (Row Level Security) ポリシー
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Users: 全員が閲覧可能
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Posts: 公開済みは全員閲覧可能
CREATE POLICY "Published posts are viewable by everyone" ON posts
  FOR SELECT USING (status = 'published');

-- Comments: 公開済み投稿のコメントは全員閲覧可能
CREATE POLICY "Comments on published posts are viewable" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = comments.post_id AND posts.status = 'published'
    )
  );

-- Likes: 全員が閲覧可能
CREATE POLICY "Likes are viewable by everyone" ON likes
  FOR SELECT USING (true);

-- Follows: 全員が閲覧可能
CREATE POLICY "Follows are viewable by everyone" ON follows
  FOR SELECT USING (true);

-- =============================================
-- 更新日時の自動更新トリガー
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
