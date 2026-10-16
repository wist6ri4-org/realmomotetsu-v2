import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { CommonConstants } from "@/constants/commonConstants";
import { buildEventChannelName } from "@/lib/realtimeTopics";

export { buildEventChannelName };

/**
 * サーバー専用のRealtime送信クライアント（遅延生成・シングルトン）。
 *
 * Realtimeのチャンネルを private 化した（`src/lib/realtimeChannelManager.ts`）ため、
 * ブラウザが使う publishable key では broadcast の送信（INSERT相当）が
 * `realtime.messages` の RLS ポリシーにより拒否される
 * （`supabase/sql/create_realtime_policies.sql` は SELECT のみ許可している）。
 * サーバー側は secret key で接続し、RLS を迂回して送信する。
 *
 * このファイルは `src/features` 配下の `service.ts` などサーバー側からのみ import すること。
 * `SUPABASE_SECRET_KEY` は `NEXT_PUBLIC_` を付けていないためクライアントバンドルには
 * 展開されず、ブラウザから import すると `createClient` が壊れる
 * （購読側は `buildEventChannelName` のみを `src/lib/realtimeTopics.ts` から
 * 直接importし、このファイルには依存していない）。
 *
 * モジュール読み込み時ではなく初回呼び出し時にクライアントを生成する。
 * 本通知機能はあくまで補助（失敗しても書き込み処理自体は成功させる）のため、
 * 環境変数が未設定の環境（テスト実行時など）でモジュールの import 自体が
 * 失敗しないようにする。
 */
let supabaseAdmin: SupabaseClient | null = null;

/**
 * サーバー専用Supabaseクライアントを取得する。環境変数が未設定の場合はnullを返す。
 * @return {SupabaseClient | null} クライアント、または未設定の場合はnull
 */
const getSupabaseAdmin = (): SupabaseClient | null => {
    if (supabaseAdmin) {
        return supabaseAdmin;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !secretKey) {
        return null;
    }

    supabaseAdmin = createClient(supabaseUrl, secretKey);
    return supabaseAdmin;
};

/**
 * イベントのデータが更新されたことを購読中のクライアントへ通知する。
 *
 * ペイロードにデータ本体は載せず「変更があった」ことだけを伝える。
 * 受信側は既存の取得APIを叩き直すため、集計ロジックをフロントで再現する必要がない。
 *
 * WebSocketを張らずREST経由（httpSend）で送信するため、サーバーレス環境でも接続を保持しない。
 * 通知の失敗は書き込み処理自体の失敗にはしない（ログに留めて握り潰す）。
 *
 * @param {string} eventCode - イベントコード
 * @return {Promise<void>}
 */
export const notifyEventDataChanged = async (eventCode: string): Promise<void> => {
    if (!eventCode) {
        return;
    }

    const client = getSupabaseAdmin();
    if (!client) {
        console.error(
            "SUPABASE_SECRET_KEY もしくは NEXT_PUBLIC_SUPABASE_URL が未設定のため、realtime通知をスキップしました。"
        );
        return;
    }

    // private: true を付けないと、httpSend が送るメッセージの private フラグが false になり、
    // private channel で購読しているクライアント（src/lib/realtimeChannelManager.ts）に届かない。
    const channel = client.channel(buildEventChannelName(eventCode), { config: { private: true } });

    try {
        await channel.httpSend(CommonConstants.REALTIME.DATA_CHANGED_EVENT, { eventCode });
    } catch (error) {
        console.error(
            `Failed to notify realtime data change. eventCode: ${eventCode}.`,
            error instanceof Error ? error.message : error
        );
    } finally {
        // 購読はしていないが、クライアント内にチャンネルが溜まらないよう明示的に破棄する
        await client.removeChannel(channel);
    }
};
