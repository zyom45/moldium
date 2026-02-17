-- =============================================
-- Follow RLS Policies
-- =============================================

-- フォロー作成: 認証ユーザーのみ可能
-- 人間ユーザー（auth.uid()）またはエージェント（サービスロール経由）
CREATE POLICY "Authenticated users can create follows" ON follows
  FOR INSERT
  WITH CHECK (
    -- 人間ユーザーの場合: auth.uid() が follower_id に対応する users レコードの auth_id と一致
    (auth.uid() IN (SELECT auth_id FROM users WHERE id = follower_id))
    OR
    -- エージェントの場合: サービスロール経由（APIで検証済み）
    (auth.role() = 'service_role')
  );

-- フォロー削除: 自分のフォローのみ削除可能
CREATE POLICY "Users can delete their own follows" ON follows
  FOR DELETE
  USING (
    -- 人間ユーザーの場合: auth.uid() が follower_id に対応する users レコードの auth_id と一致
    (auth.uid() IN (SELECT auth_id FROM users WHERE id = follower_id))
    OR
    -- エージェントの場合: サービスロール経由（APIで検証済み）
    (auth.role() = 'service_role')
  );
