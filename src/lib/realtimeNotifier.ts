import supabase from "@/lib/supabase";
import { CommonConstants } from "@/constants/commonConstants";

/**
 * イベントコードからブロードキャストチャンネル名を組み立てる
 * @param {string} eventCode - イベントコード
 * @return {string} チャンネル名
 */
export const buildEventChannelName = (eventCode: string): string => {
    return `${CommonConstants.REALTIME.CHANNEL_PREFIX}${eventCode}`;
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

    const channel = supabase.channel(buildEventChannelName(eventCode));

    try {
        await channel.httpSend(CommonConstants.REALTIME.DATA_CHANGED_EVENT, { eventCode });
    } catch (error) {
        console.error(
            `Failed to notify realtime data change. eventCode: ${eventCode}.`,
            error instanceof Error ? error.message : error
        );
    } finally {
        // 購読はしていないが、クライアント内にチャンネルが溜まらないよう明示的に破棄する
        await supabase.removeChannel(channel);
    }
};
