/**
 * @jest-environment node
 */

import { MissionToolUtils } from "@/utils/missionToolUtils";

const { MissionSenzokuike } = MissionToolUtils;

describe("MissionToolUtils.MissionSenzokuike", () => {
    describe("round（二捨三入）", () => {
        it.each([
            [200, 200],
            [201, 200],
            [202, 200],
            [203, 205],
            [207, 205],
            [208, 210],
            [209, 210],
        ])("%iは%iに丸められる", (score, expected) => {
            expect(MissionSenzokuike.round(score)).toBe(expected);
        });
    });

    describe("calculate", () => {
        it("正解と完全に一致した場合は最大得点+基礎点+ジャストボーナスになる", () => {
            // 150（最大得点）+ 50（基礎点）+ 50（ジャストボーナス）= 250
            expect(MissionSenzokuike.calculate(MissionSenzokuike.SENZOKUIKE_AREA)).toBe(250);
        });

        it("正解から離れるほど得点が下がる", () => {
            const scores = [40_000, 42_000, 45_000, 50_000, 60_000].map((answer) =>
                MissionSenzokuike.calculate(answer),
            );

            scores.forEach((score, index) => {
                if (index > 0) {
                    expect(score).toBeLessThanOrEqual(scores[index - 1]);
                }
            });
        });

        it("正解から大きく外れても基礎点は保証される", () => {
            expect(MissionSenzokuike.calculate(0)).toBe(MissionSenzokuike.BASE_POINT);
            expect(MissionSenzokuike.calculate(1_000_000)).toBe(MissionSenzokuike.BASE_POINT);
        });

        it("正解からの差が同じであれば大小どちらにずれても同じ得点になる", () => {
            const diff = 3_000;

            expect(MissionSenzokuike.calculate(MissionSenzokuike.SENZOKUIKE_AREA + diff)).toBe(
                MissionSenzokuike.calculate(MissionSenzokuike.SENZOKUIKE_AREA - diff),
            );
        });

        it("得点は必ず5点刻みになる", () => {
            const answers = [30_000, 35_000, 38_000, 39_000, 41_000, 43_000, 48_000];

            answers.forEach((answer) => {
                expect(MissionSenzokuike.calculate(answer) % 5).toBe(0);
            });
        });

        it("ジャストボーナスは完全一致のときのみ加算される", () => {
            const just = MissionSenzokuike.calculate(MissionSenzokuike.SENZOKUIKE_AREA);
            const nearlyJust = MissionSenzokuike.calculate(MissionSenzokuike.SENZOKUIKE_AREA + 1);

            expect(just - nearlyJust).toBe(MissionSenzokuike.JUST_BONUS);
        });
    });
});
