/**
 * @jest-environment node
 */

import { GameConstants } from "@/constants/gameConstants";
import { Converter } from "@/utils/converter";

describe("Converter", () => {
    describe("convertPointsToYen", () => {
        // V2では1ポイント = 10万円
        it.each([
            [0, "0 万"],
            [1, "10 万"],
            [10, "100 万"],
            [1_000, "1 億 0 万"],
            [1_234, "1 億 2340 万"],
        ])("%iポイントは「%s」に整形される", (point, expected) => {
            expect(Converter.convertPointsToYen(point)).toBe(expected);
        });

        it("負のポイントには全角のマイナス記号が付く", () => {
            expect(Converter.convertPointsToYen(-1)).toBe("－10 万");
        });

        it("億の単位まで正しく繰り上がる", () => {
            // 999,999ポイント = 999億9990万円
            expect(Converter.convertPointsToYen(999_999)).toBe("999 億 9990 万");
        });

        it("兆の単位が繰り上がる", () => {
            // 10,000,000ポイント = 1兆円
            expect(Converter.convertPointsToYen(10_000_000)).toBe("1 兆 0 万");
        });
    });

    describe("convertPointsToYenV3", () => {
        // V3では1ポイント = 1万円
        it.each([
            [0, "0 万"],
            [1, "1 万"],
            [2_345, "2345 万"],
            [10_000, "1 億 0 万"],
            [12_345, "1 億 2345 万"],
            [123_456_789, "1 兆 2345 億 6789 万"],
        ])("%iポイントは「%s」に整形される", (point, expected) => {
            expect(Converter.convertPointsToYenV3(point)).toBe(expected);
        });

        it("負のポイントには全角のマイナス記号が付く", () => {
            expect(Converter.convertPointsToYenV3(-12_345)).toBe("－1 億 2345 万");
        });

        it("億の単位まで正しく繰り上がる", () => {
            // 9,999,999ポイント = 999億9999万円
            expect(Converter.convertPointsToYenV3(9_999_999)).toBe("999 億 9999 万");
        });

        it("兆の単位が繰り上がる", () => {
            // 100,000,000ポイント = 1兆円
            expect(Converter.convertPointsToYenV3(100_000_000)).toBe("1 兆 0 万");
        });
    });

    describe("convertEventVersionToVersionPath", () => {
        // V1系はV2で吸収されているため、100番代もV2のパスを返す
        it.each([
            [100, GameConstants.VERSION.V02.path],
            [200, GameConstants.VERSION.V02.path],
            [299, GameConstants.VERSION.V02.path],
            [300, GameConstants.VERSION.V03.path],
            [399, GameConstants.VERSION.V03.path],
        ])("バージョン%iは「%s」に変換される", (version, expected) => {
            expect(Converter.convertEventVersionToVersionPath(version)).toBe(expected);
        });

        it("未知のバージョンはV2のパスにフォールバックする", () => {
            expect(Converter.convertEventVersionToVersionPath(400)).toBe(GameConstants.VERSION.V02.path);
        });
    });

    describe("convertUTCtoJST", () => {
        // 実行環境のタイムゾーンに依存するため、時刻そのものではなく整形結果の形式を検証する
        it.each([
            ["文字列", "2026-01-01T12:34:56.000Z"],
            ["数値（エポックミリ秒）", Date.UTC(2026, 0, 1, 12, 34, 56)],
            ["Dateオブジェクト", new Date("2026-01-01T12:34:56.000Z")],
        ])("%sを受け取ってja-JP形式の時刻文字列を返す", (_label, utc) => {
            expect(Converter.convertUTCtoJST(utc as string | number | Date)).toMatch(/^\d{1,2}:\d{2}:\d{2}$/);
        });

        it("同じ時刻を表す入力はすべて同じ結果になる", () => {
            const iso = "2026-01-01T12:34:56.000Z";

            expect(Converter.convertUTCtoJST(iso)).toBe(Converter.convertUTCtoJST(new Date(iso)));
            expect(Converter.convertUTCtoJST(iso)).toBe(Converter.convertUTCtoJST(new Date(iso).getTime()));
        });
    });
});
