import { Documents, Stations, Teams } from "@/generated/prisma";
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
 * @property {Teams[]} teams - チームの配列
 * @property {Stations[]} stations - 駅の配列
 * @property {NearbyStationsWithRelations[]} [nearbyStations] - 近隣駅の配列
 * @property {Documents[]} documents - ドキュメントの配列
 * @property {UsersWithRelations} user - ユーザー情報
 * @property {EventWithRelations} event - イベント情報
 */
export type InitResponse = {
    teams: Teams[];
    stations: Stations[];
    nearbyStations: NearbyStationsWithRelations[];
    documents: Documents[];
    user: UsersWithRelations;
    event: EventWithRelations;
};
