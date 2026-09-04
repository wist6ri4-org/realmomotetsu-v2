"use client";

import supabase from "@/lib/supabase";
import { CommonConstants } from "@/constants/commonConstants";
import { buildEventChannelName } from "@/lib/realtimeNotifier";

/**
 * イベントチャンネルの購読者が受け取るコールバック
 * @property {() => void} onBroadcast - データ変更通知を受信した時に呼ばれる
 * @property {() => void} onSubscribed - チャンネルの購読が確立（再接続を含む）した時に呼ばれる
 */
export interface EventChannelListener {
    onBroadcast: () => void;
    onSubscribed: () => void;
}

interface ChannelEntry {
    channel: ReturnType<typeof supabase.channel>;
    listeners: Set<EventChannelListener>;
    removeTimer: ReturnType<typeof setTimeout> | null;
}

const entries = new Map<string, ChannelEntry>();

/**
 * イベントごとのRealtimeチャンネルを購読者間で共有する。
 *
 * supabase-jsの`RealtimeClient.channel()`は同一トピック名に対して既存のチャンネルを
 * 使い回す仕様（`RealtimeClient.js`の`channel()`参照）のため、複数箇所（例: home画面と
 * レイアウトに常駐する路線図ダイアログ）が個別に`supabase.channel()`/`removeChannel()`を
 * 呼ぶと、一方のクリーンアップがもう一方の購読まで巻き添えで破棄してしまう
 * （React Strict Modeのマウント→クリーンアップ→再マウントでも同じ理由で発生する。
 * `removeChannel()`は購読中チャンネルが0件になった時点で共有WebSocket自体を
 * disconnect()するため、再マウント直後の未接続チャンネルを巻き込んで
 * 「WebSocket is closed before the connection is established」を起こす）。
 * ここで参照カウントを管理し、最後の購読者がいなくなった時だけ実際に破棄する。
 *
 * @param {string} eventCode - 購読対象のイベントコード
 * @param {EventChannelListener} listener - 通知受信時・購読確立時のコールバック
 * @return {() => void} 購読解除関数
 */
export const acquireEventChannel = (eventCode: string, listener: EventChannelListener): (() => void) => {
    let entry = entries.get(eventCode);

    if (entry) {
        // 保留中の破棄タイマーがあれば取り消す（再マウント等で参照が復活したため）
        if (entry.removeTimer !== null) {
            clearTimeout(entry.removeTimer);
            entry.removeTimer = null;
        }
    } else {
        const listeners = new Set<EventChannelListener>();
        const channel = supabase
            .channel(buildEventChannelName(eventCode))
            .on("broadcast", { event: CommonConstants.REALTIME.DATA_CHANGED_EVENT }, () => {
                listeners.forEach((l) => l.onBroadcast());
            })
            .subscribe((status: string) => {
                if (status === CommonConstants.REALTIME.SUBSCRIBED_STATUS) {
                    listeners.forEach((l) => l.onSubscribed());
                }
            });

        entry = { channel, listeners, removeTimer: null };
        entries.set(eventCode, entry);
    }

    entry.listeners.add(listener);

    return () => {
        const current = entries.get(eventCode);
        if (!current) {
            return;
        }

        current.listeners.delete(listener);
        if (current.listeners.size > 0) {
            return;
        }

        // 即座に破棄せず、React Strict Modeの再マウント等で購読者が戻ってくる余地を残す
        current.removeTimer = setTimeout(() => {
            if (current.listeners.size === 0) {
                entries.delete(eventCode);
                supabase.removeChannel(current.channel);
            }
        }, 0);
    };
};
