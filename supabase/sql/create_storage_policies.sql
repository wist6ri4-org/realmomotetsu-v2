-- ============================================
-- Supabaseストレージポリシー設定用SQL
-- ============================================
-- 
-- 注意: このスクリプトはSupabaseダッシュボードの 
-- SQL Editor で実行してください
-- 
-- Storage > Policies での手動設定が推奨されますが、
-- このSQLでも設定可能です
-- ============================================

-- ストレージポリシーの作成（Supabaseダッシュボードで実行）

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Users can upload own icons" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own icons" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view user icons" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own icons" ON storage.objects;

-- 一時的な緩いポリシー（テスト用）
CREATE POLICY "Temp upload policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-assets');

CREATE POLICY "Temp update policy" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'user-assets');

CREATE POLICY "Temp select policy" ON storage.objects
FOR SELECT TO authenticated, anon
USING (bucket_id = 'user-assets');

CREATE POLICY "Temp delete policy" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'user-assets');
);

-- storage.objectsテーブルのRLS状態を確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- もしRLSが無効になっている場合は有効化
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ポリシー作成結果を確認
SELECT 
    tablename, 
    policyname, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%icon%';
