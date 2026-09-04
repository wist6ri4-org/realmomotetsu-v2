"use client";

import { useEffect, useRef } from "react";
import { CommonConstants } from "@/constants/commonConstants";
import { acquireEventChannel } from "@/lib/realtimeChannelManager";

/**
 * イベントのデータ更新をリアルタイムに受け取り、再取得を実行するフック。
 *
 * サーバー側の書き込みAPIが送るブロードキャスト通知（データ本体は含まない）を購読し、
 * 受信したら `onRefresh` を呼んで既存の取得APIを叩き直す。
 * チャンネル自体の共有・破棄タイミングは`acquireEventChannel`（`src/lib/realtimeChannelManager.ts`）に委譲する。
 *
 * 画面がバックグラウンドにある間は再取得せず、復帰時にまとめて1回だけ追いつく。
 * ブロードキャストは切断中のメッセージを再送しないため、この復帰時の再取得が
 * 唯一の取りこぼし回復経路になる。
 *
 * @param {string | undefined} eventCode - 購読対象のイベントコード
 * @param {() => void} onRefresh - 再取得処理（識別子が変わっても購読は張り直さない）
 */
export const useRealtimeRefresh = (eventCode: string | undefined, onRefresh: () => void): void => {
    // 最新のコールバックを保持する。
    // 依存に入れると再生成のたびに購読を張り直してしまうため、ref経由で参照する。
    const onRefreshRef = useRef(onRefresh);

    // 直近に再取得を実行した時刻。復帰時の連続再取得を抑止するために使う。
    // 初期表示時に各画面が自前で取得しているため、マウント時刻を初期値とする。
    const lastRefreshedAtRef = useRef<number>(Date.now());

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        onRefreshRef.current = onRefresh;
    }, [onRefresh]);

    useEffect(() => {
        if (!eventCode) {
            return;
        }

        /**
         * 再取得を実行する
         */
        const refresh = (): void => {
            lastRefreshedAtRef.current = Date.now();
            onRefreshRef.current();
        };

        /**
         * 保留中の再取得予約を破棄する
         */
        const clearPendingRefresh = (): void => {
            if (debounceTimerRef.current !== null) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
        };

        /**
         * 通知受信時の処理。
         * バックグラウンド中は再取得せず、復帰時の追いつき処理に任せる。
         */
        const handleNotification = (): void => {
            if (document.hidden) {
                return;
            }

            // 移動とポイント加算のように短時間で複数の通知が届く場合、再取得を1回にまとめる
            clearPendingRefresh();
            debounceTimerRef.current = setTimeout(refresh, CommonConstants.REALTIME.DEBOUNCE_MS);
        };

        /**
         * 復帰・再接続時の追いつき処理。
         * 切断中に通知を取りこぼしたかはクライアント側から判定できないため、
         * 最小間隔だけ守って無条件に1回取得する。
         */
        const catchUp = (): void => {
            if (document.hidden) {
                return;
            }

            const elapsed = Date.now() - lastRefreshedAtRef.current;
            if (elapsed < CommonConstants.REALTIME.MIN_REFETCH_INTERVAL_MS) {
                return;
            }

            clearPendingRefresh();
            refresh();
        };

        /**
         * 画面が可視状態に戻った時の処理
         */
        const handleVisibilityChange = (): void => {
            if (!document.hidden) {
                catchUp();
            }
        };

        // 通知受信時（onBroadcast）と購読確立・再接続時（onSubscribed）を購読する。
        // チャンネル自体は同一eventCodeの他の購読者（例: RoutemapDialog）と共有される。
        const releaseChannel = acquireEventChannel(eventCode, {
            onBroadcast: handleNotification,
            onSubscribed: catchUp,
        });

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("online", catchUp);

        return () => {
            clearPendingRefresh();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("online", catchUp);
            releaseChannel();
        };
    }, [eventCode]);
};
