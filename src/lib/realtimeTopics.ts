import { CommonConstants } from "@/constants/commonConstants";

/**
 * イベントコードからブロードキャストチャンネル名を組み立てる
 *
 * サーバー側（`src/lib/realtimeNotifier.ts`）・クライアント側
 * （`src/lib/realtimeChannelManager.ts`）の両方から参照する副作用の無い純粋関数のため、
 * 専用ファイルに分離している。`realtimeNotifier.ts` は secret key を使うサーバー専用
 * クライアントをモジュールスコープで生成するため、ブラウザ向けの
 * `realtimeChannelManager.ts` から import すると secret key の参照がクライアント
 * バンドルに含まれてしまう（`NEXT_PUBLIC_` を付けていないため値自体は展開されないが、
 * ビルド時に環境変数が無く `createClient` が壊れる）。
 *
 * @param {string} eventCode - イベントコード
 * @return {string} チャンネル名
 */
export const buildEventChannelName = (eventCode: string): string => {
    return `${CommonConstants.REALTIME.CHANNEL_PREFIX}${eventCode}`;
};
