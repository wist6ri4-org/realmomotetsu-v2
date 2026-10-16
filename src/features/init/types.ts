import { Documents, EventTypes, Stations, Teams } from "@/generated/prisma";
import { EventWithRelations } from "@/repositories/events/EventsRepository";
import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";
import { UsersWithRelations } from "@/repositories/users/UsersRepository";

/**
 * 初期化のリクエスト
 * @property { string } eventCode - イベントコード
 * @property { string } uuid - ユーザーのUUID
 */
export type InitRequest = {
    eventCode: string;
    uuid: string;
};

/**
 * 初期化のレスポンス
 * @property {EventTypes} eventType - イベント種別
 * @property {Teams[]} teams - チームの配列
 * @property {Stations[]} stations - 駅の配列
 * @property {NearbyStationsWithRelations[]} [nearbyStations] - 近隣駅の配列
 * @property {Documents[]} documents - ドキュメントの配列
 * @property {UsersWithRelations} user - ユーザー情報
 * @property {EventWithRelations} event - イベント情報
 * @property {Member[]} members - 参加者の配列
 */
export type InitResponse = {
    eventType: EventTypes | null;
    teams: Teams[];
    stations: Stations[];
    nearbyStations: NearbyStationsWithRelations[];
    documents: Documents[];
    user: UsersWithRelations;
    event: EventWithRelations;
    members: Member[];
};

/**
 * 参加者
 * @property {string} id - 参加情報ID
 * @property {string | null} nickname - ニックネーム
 * @property {string | null} iconUrl - アイコンURL
 * @property {string} teamCode - チームコード
 */
export type Member = {
    id: number;
    nickname: string | null;
    iconUrl: string | null;
    teamCode: string;
};
