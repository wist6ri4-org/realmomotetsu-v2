/**
 * @jest-environment node
 */

import LocationUtils from "@/utils/locationUtils";
import { buildStation } from "../helpers/factories";

/** 東京駅の座標 */
const TOKYO = { latitude: 35.681236, longitude: 139.767125 };
/** 品川駅の座標（東京駅から約6.4km） */
const SHINAGAWA = { latitude: 35.628471, longitude: 139.73876 };
/** 新宿駅の座標（東京駅から約6.4km） */
const SHINJUKU = { latitude: 35.689607, longitude: 139.700571 };

describe("LocationUtils", () => {
    describe("calculateDistance", () => {
        it("同じ座標同士の距離は0になる", () => {
            expect(
                LocationUtils.calculateDistance(
                    TOKYO.latitude,
                    TOKYO.longitude,
                    TOKYO.latitude,
                    TOKYO.longitude,
                ),
            ).toBe(0);
        });

        it("実在する駅間の距離を概算できる", () => {
            const distance = LocationUtils.calculateDistance(
                TOKYO.latitude,
                TOKYO.longitude,
                SHINAGAWA.latitude,
                SHINAGAWA.longitude,
            );

            // 東京駅〜品川駅の直線距離は約6.4km
            expect(distance).toBeGreaterThan(6);
            expect(distance).toBeLessThan(7);
        });

        it("距離の計算は2点の順序に依存しない", () => {
            const forward = LocationUtils.calculateDistance(
                TOKYO.latitude,
                TOKYO.longitude,
                SHINJUKU.latitude,
                SHINJUKU.longitude,
            );
            const backward = LocationUtils.calculateDistance(
                SHINJUKU.latitude,
                SHINJUKU.longitude,
                TOKYO.latitude,
                TOKYO.longitude,
            );

            expect(forward).toBeCloseTo(backward, 10);
        });
    });

    describe("convertToLocationGraph", () => {
        it("駅コードをキーにした座標のマップへ変換する", () => {
            const graph = LocationUtils.convertToLocationGraph([
                buildStation({ stationCode: "TOKYO", ...TOKYO }),
                buildStation({ stationCode: "SHINAGAWA", ...SHINAGAWA }),
            ]);

            expect(graph.size).toBe(2);
            expect(graph.get("TOKYO")).toEqual(TOKYO);
        });

        it("緯度または経度が未設定の駅は除外される", () => {
            const graph = LocationUtils.convertToLocationGraph([
                buildStation({ stationCode: "TOKYO", ...TOKYO }),
                buildStation({ stationCode: "NO_LATITUDE", latitude: null, longitude: 139.0 }),
                buildStation({ stationCode: "NO_LONGITUDE", latitude: 35.0, longitude: null }),
            ]);

            expect([...graph.keys()]).toEqual(["TOKYO"]);
        });
    });

    describe("findNearbyStations", () => {
        const graph = LocationUtils.convertToLocationGraph([
            buildStation({ stationCode: "TOKYO", ...TOKYO }),
            buildStation({ stationCode: "SHINAGAWA", ...SHINAGAWA }),
            buildStation({ stationCode: "SHINJUKU", ...SHINJUKU }),
        ]);

        it("距離の近い順にソートして指定件数だけ返す", () => {
            const result = LocationUtils.findNearbyStations(graph, TOKYO.latitude, TOKYO.longitude, 2);

            expect(result).toHaveLength(2);
            expect(result[0].stationCode).toBe("TOKYO");
            expect(result[0].distance).toBe(0);
            expect(result[0].distance).toBeLessThanOrEqual(result[1].distance);
        });

        it("駅数より多い件数を要求しても存在する分だけ返す", () => {
            const result = LocationUtils.findNearbyStations(graph, TOKYO.latitude, TOKYO.longitude, 100);

            expect(result).toHaveLength(3);
        });

        it("駅が1つもない場合は空配列を返す", () => {
            const result = LocationUtils.findNearbyStations(new Map(), TOKYO.latitude, TOKYO.longitude, 1);

            expect(result).toEqual([]);
        });
    });

    describe("calculate", () => {
        it("最も近い駅を1件だけ返す", () => {
            const result = LocationUtils.calculate(
                [
                    buildStation({ stationCode: "TOKYO", ...TOKYO }),
                    buildStation({ stationCode: "SHINAGAWA", ...SHINAGAWA }),
                    buildStation({ stationCode: "SHINJUKU", ...SHINJUKU }),
                ],
                SHINJUKU.latitude,
                SHINJUKU.longitude,
            );

            expect(result).toHaveLength(LocationUtils.NUMBER_OF_STATIONS);
            expect(result[0].stationCode).toBe("SHINJUKU");
        });

        it("座標が未設定の駅しかない場合は空配列を返す", () => {
            const result = LocationUtils.calculate(
                [buildStation({ stationCode: "NO_LOCATION", latitude: null, longitude: null })],
                TOKYO.latitude,
                TOKYO.longitude,
            );

            expect(result).toEqual([]);
        });
    });
});
