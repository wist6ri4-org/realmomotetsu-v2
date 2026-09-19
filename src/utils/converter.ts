import { GameConstants } from "@/constants/gameConstants";

export class Converter {
    /**
     * ポイントを兆、億、万単位でフォーマットする
     * @param {number} point - ポイント値
     * @return {string} フォーマットされたポイント文字列
     */
    static convertPointsToYen(point: number): string {
        const absPoint = Math.abs(point * 100_000);

        const trillion = Math.floor((absPoint % 10**16) / 10**12); // 兆
        const oneHundredMillion = Math.floor((absPoint % 10**12) / 10**8); // 億
        const tenThousand = Math.floor((absPoint % 10**8) / 10_000); // 万

        const formattedPoint =
            (trillion > 0 ? trillion + " 兆 " : "") +
            (oneHundredMillion > 0 ? oneHundredMillion + " 億 " : "") +
            (tenThousand > 0 ? tenThousand + " 万" : "0 万");

        return point >= 0 ? formattedPoint : "－" + formattedPoint;
    }

    /**
     * ポイントを兆、億、万単位でフォーマットする(V3)
     * @description V3ではポイントの単位は10,000円
     * @param {number} point - ポイント値
     * @return {string} フォーマットされたポイント文字列
     */
    static convertPointsToYenV3(point: number): string {
        const absPoint = Math.abs(point * 10_000);

        const trillion = Math.floor((absPoint % 10**16) / 10**12); // 兆
        const oneHundredMillion = Math.floor((absPoint % 10**12) / 10**8); // 億
        const tenThousand = Math.floor((absPoint % 10**8) / 10_000); // 万

        const formattedPoint =
            (trillion > 0 ? trillion + " 兆 " : "") +
            (oneHundredMillion > 0 ? oneHundredMillion + " 億 " : "") +
            (tenThousand > 0 ? tenThousand + " 万" : "0 万");

        return point >= 0 ? formattedPoint : "－" + formattedPoint;
    }

    /**
     * UTC時間を日本時間に変換
     * @param {string | number | Date} utc - UTC時間
     * @return {string} 日本時間の文字列
     */
    static convertUTCtoJST(utc: string | number | Date): string {
        const date = new Date(utc);
        return date.toLocaleTimeString("ja-JP");
    }

    /**
     * イベントバージョンをバージョンパスに変換する
     * @param {number} eventVersion - イベントバージョン
     * @return {string} バージョンパス
     * @description 100番代：V1、200番代：V2、300番代：V3。ただし、V1系はV2で吸収されているため、100番代もV2のパスを返す。
     */
    static convertEventVersionToVersionPath(eventVersion: number): string {
        let versionPath;
        if (eventVersion < 300) {
            // V1系はV2で吸収
            versionPath = GameConstants.VERSION.V02.path;
        } else if (eventVersion < 400) {
            versionPath = GameConstants.VERSION.V03.path;
        } else {
            versionPath = GameConstants.VERSION.V02.path;
        }
        return versionPath;
    }
}
