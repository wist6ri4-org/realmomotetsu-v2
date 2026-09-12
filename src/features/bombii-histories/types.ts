import { BombiiHistories } from "@/generated/prisma";

/**
 * ボンビー履歴の追加リクエスト
 * @property { string } eventCode - イベントコード
 * @property { string } teamCode - チームコード
 */
export type PostBombiiHistoriesRequest = {
    eventCode: string;
    teamCode: string;
};

/**
 * ボンビー履歴の追加レスポンス
 * @property { BombiiHistories } bombiiHistory - 追加されたボンビー履歴情報
 */
export type PostBombiiHistoriesResponse = {
    bombiiHistory: BombiiHistories;
};
