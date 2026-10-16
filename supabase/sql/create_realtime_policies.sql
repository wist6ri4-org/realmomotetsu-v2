-- ============================================
-- Realtime private channel 認可ポリシー (TSK-67)
-- ============================================
--
-- 注意: このスクリプトはSupabaseダッシュボードの SQL Editor で実行してください
-- （`realtime.messages` は Supabase 管理スキーマ（所有者 supabase_realtime_admin）
-- のため、Prisma migration には含めない）。
--
-- 前提: `public.is_event_attendee(p_event_code)` 関数が必要
-- （prisma/migrations/20260916221221_tsk_67_rls_lockdown で作成済み）。
--
-- 背景:
--   チャンネル名は "event-{eventCode}"（src/constants/commonConstants.ts の
--   CHANNEL_PREFIX）。従来 broadcast channel が private 化されていなかったため、
--   anon キーを持つ誰でも任意イベントのチャンネルを購読・送信できた。
--   クライアント側を private channel 化する（src/lib/realtimeChannelManager.ts）のに
--   合わせて、ここで realtime.messages への RLS ポリシーを設定する。
--
-- 方針:
--   - SELECT（購読）のみ許可し、そのイベントの参加者（is_event_attendee）に限定する。
--   - INSERT（クライアントからのbroadcast送信）は許可しない
--     → ポリシーを作らないことで authenticated からの送信は拒否される。
--     サーバー側（src/lib/realtimeNotifier.ts）は SUPABASE_SECRET_KEY を使い、
--     RLSを迂回して送信する。
-- ============================================

DROP POLICY IF EXISTS "Event attendees can subscribe to their event channel" ON realtime.messages;

CREATE POLICY "Event attendees can subscribe to their event channel" ON realtime.messages
FOR SELECT TO authenticated
USING (
    public.is_event_attendee(substring(realtime.topic() from 7)) -- 7 = length('event-') + 1
);

-- realtime.messages のRLS状態を確認
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'realtime' AND tablename = 'messages';

-- ポリシー作成結果を確認
SELECT
    tablename,
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies
WHERE schemaname = 'realtime'
AND tablename = 'messages';
