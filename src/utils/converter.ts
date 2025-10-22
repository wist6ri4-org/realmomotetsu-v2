export class Converter {
    /**
     * ポイントを兆、億、万単位でフォーマットする
     * @param {number} point - ポイント値
     * @return {string} フォーマットされたポイント文字列
     */
    static convertPointsToYen(point: number): string {
        const absPoint = Math.abs(point * 100000);

        const trillion = Math.floor((absPoint % 100000000000000) / 100000000000); // 兆
        const oneHundredMillion = Math.floor((absPoint % 100000000000) / 100000000); // 億
        const tenThousand = Math.floor((absPoint % 100000000) / 10000); // 万

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
}
