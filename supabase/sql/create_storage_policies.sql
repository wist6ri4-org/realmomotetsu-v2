-- ============================================
-- Supabaseストレージポリシー設定用SQL (TSK-67)
-- ============================================
--
-- 注意: このスクリプトはSupabaseダッシュボードの
-- SQL Editor で実行してください（`storage.objects` は Supabase 管理スキーマの
-- ため、Prisma migration には含めない。詳細は supabase/sql/setup_user_storage.md）。
--
-- 対象バケット: user-assets（public bucket）
-- ファイルパス規則: user-icons/{auth.uid()}.{拡張子}（src/utils/userUtils.ts）
--
-- 従来は「一時的な緩いポリシー（テスト用）」のままで、authenticated であれば
-- 誰でも他人のアイコンを上書き・削除できる状態だった。ここで
-- 「自分のUIDから始まるパスのみ書き込み可能」に修正する。
-- ============================================

-- 既存のポリシーをすべて削除（旧名・テスト用ポリシーの両方）
DROP POLICY IF EXISTS "Users can upload own icons" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own icons" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view user icons" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own icons" ON storage.objects;
DROP POLICY IF EXISTS "Temp upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Temp update policy" ON storage.objects;
DROP POLICY IF EXISTS "Temp select policy" ON storage.objects;
DROP POLICY IF EXISTS "Temp delete policy" ON storage.objects;

-- 自分のUIDから始まるパスへのアップロードのみ許可
CREATE POLICY "Users can upload own icons" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'user-assets'
    AND name LIKE CONCAT('user-icons/', auth.uid()::text, '%')
);

-- 自分のUIDから始まるパスの更新のみ許可
CREATE POLICY "Users can update own icons" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'user-assets'
    AND name LIKE CONCAT('user-icons/', auth.uid()::text, '%')
);

-- 閲覧（list含む）はバケット全体を許可。表示自体は公開URL経由（バケットがpublicのため）。
-- src/utils/userUtils.ts の cleanupOldIcons() がフォルダ全体を list() してから
-- 自分のUID前方一致でフィルタする実装のため、SELECT自体は絞り込まない。
CREATE POLICY "Anyone can view user icons" ON storage.objects
FOR SELECT TO authenticated, anon
USING (bucket_id = 'user-assets');

-- 自分のUIDから始まるパスの削除のみ許可
CREATE POLICY "Users can delete own icons" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'user-assets'
    AND name LIKE CONCAT('user-icons/', auth.uid()::text, '%')
);

-- storage.objectsテーブルのRLS状態を確認
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' AND tablename = 'objects';

-- もしRLSが無効になっている場合は有効化
-- 注意: storage.objects の所有者は supabase_storage_admin であり、
-- SQL Editor（postgres権限）からは基本的にRLSは既に有効なため実行不要だが、
-- 万一無効な環境向けに残す。"must be owner of table objects" で失敗しても、
-- 既にRLSが有効であれば無視してよい（上のSELECTで rowsecurity = true を確認すること）。
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
