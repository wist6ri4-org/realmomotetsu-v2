import { createContext, useContext } from "react";
import { InitResponse } from "@/features/init/types";
import { Documents, Stations, Teams } from "@/generated/prisma";
import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";
import { UsersWithRelations } from "@/repositories/users/UsersRepository";
import { EventWithRelations } from "@/repositories/events/EventsRepository";

/**
 * Contextの型定義
 * @property {Teams[]} teams - チームの配列
 * @property {Stations[]} stations - 駅の配列
 * @property {NearbyStationsWithRelations[]} nearbyStations - 近隣駅の配列
 * @property {Documents[]} documents - ドキュメントの配列
 * @property {UsersWithRelations | null} user - ユーザー情報
 * @property {EventWithRelations} event - イベント情報
 * @property {string} versionPath - イベントのバージョンに対応するパス
 * @property {boolean} isInitDataLoading - 初期データのロード状態
 * @property {string | null} contextError - コンテキストのエラー情報
 * @property {InitResponse | null} rawInitData - 元の初期化データ（必要に応じて）
 */
export interface EventContextType {
    // 個別データ
    teams: Teams[];
    stations: Stations[];
    nearbyStations: NearbyStationsWithRelations[];
    documents: Documents[];
    user: UsersWithRelations | null;
    event: EventWithRelations;

    versionPath: string;

    // 状態管理
    isInitDataLoading: boolean;
    contextError: string | null;

    // 元データも保持（必要に応じて）
    rawInitData: InitResponse | null;
}

// Context作成
// NOTE: `layout.tsx`はNext.jsの特殊ファイルのためdefault export以外を許可しないので、このcontextは別ファイルに切り出している。
export const EventContext = createContext<EventContextType | undefined>(undefined);

// カスタムhook
export const useEventContext = () => {
    const context = useContext(EventContext);
    if (context === undefined) {
        throw new Error("useEventContext must be used within EventsLayout");
    }
    return context;
};
