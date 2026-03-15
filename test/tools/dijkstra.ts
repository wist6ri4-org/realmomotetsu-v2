/**
 * ダイクストラ最短経路探索ツール
 *
 * DB上の近隣駅データを使って、指定した開始駅から全駅への最短マス数・所要時間を算出する。
 *
 * 使い方:
 *   npx dotenv -e .env.local -- npx tsx test/tools/dijkstra.ts
 *
 * 設定:
 *   START_STATION_CODE: 開始駅コード
 *   EVENT_TYPE_CODE: イベント種別コード
 *   TARGET_STATION_CODE: 特定の駅だけ表示したい場合に指定（省略時は全駅表示）
 */

import { PrismaClient } from "../../src/generated/prisma/index.js";
import DijkstraUtils from "../../src/utils/dijkstraUtils.js";

// ========== 設定 ==========
const EVENT_TYPE_CODE = "METRO_V1"; // イベント種別コード
const START_STATION_CODE = "METRO_V1_OTEMACHI"; // 開始駅コード
const TARGET_STATION_CODE = ""; // 特定の駅のみ表示する場合に指定（空文字なら全駅）
// ==========================

const prisma = new PrismaClient();

type StationInfo = {
    stationCode: string;
    name: string;
};

async function main() {
    console.log("=".repeat(70));
    console.log(" ダイクストラ最短経路探索ツール");
    console.log("=".repeat(70));
    console.log(`  イベント種別: ${EVENT_TYPE_CODE}`);
    console.log(`  開始駅:       ${START_STATION_CODE}`);
    if (TARGET_STATION_CODE) {
        console.log(`  対象駅:       ${TARGET_STATION_CODE}`);
    }
    console.log("=".repeat(70));

    // 1. 駅マスタを取得（駅名表示用）
    const stations = await prisma.stations.findMany({
        where: { eventTypeCode: EVENT_TYPE_CODE },
        orderBy: { kana: "asc" },
    });

    const stationMap = new Map<string, StationInfo>();
    stations.forEach((s) => {
        stationMap.set(s.stationCode, { stationCode: s.stationCode, name: s.name });
    });

    // 開始駅の存在チェック
    if (!stationMap.has(START_STATION_CODE)) {
        console.error(`\n❌ 開始駅 "${START_STATION_CODE}" が見つかりません`);
        console.log("\n利用可能な駅コード一覧:");
        stations.forEach((s) => console.log(`  ${s.stationCode} (${s.name})`));
        return;
    }

    // 2. 近隣駅データを取得
    const nearbyStations = await prisma.nearbyStations.findMany({
        where: { eventTypeCode: EVENT_TYPE_CODE },
        include: {
            fromStation: true,
            toStation: true,
        },
    });

    console.log(`\n📊 データ: ${stations.length}駅, ${nearbyStations.length}接続\n`);

    // 3. グラフ構築（DijkstraUtils使用）
    const graph = DijkstraUtils.convertToStationGraph(nearbyStations);

    // 4. ダイクストラ実行（DijkstraUtils使用）
    const results = DijkstraUtils.calculateRequiredTimeAndStations(graph, START_STATION_CODE);

    // 5. 結果表示
    const startName = stationMap.get(START_STATION_CODE)?.name ?? START_STATION_CODE;

    // テーブルヘッダー
    const header = `${"駅コード".padEnd(20)}${"駅名".padEnd(12)}${"マス数".padStart(8)}${"所要時間(分)".padStart(14)}`;
    const separator = "-".repeat(70);

    console.log(`🚉 ${startName}（${START_STATION_CODE}）からの最短経路:\n`);
    console.log(header);
    console.log(separator);

    // ソートして表示（マス数 → 所要時間の順）
    const sortedResults = Array.from(results.entries())
        .filter(([code]) => {
            if (code === START_STATION_CODE) return false;
            if (TARGET_STATION_CODE) return code === TARGET_STATION_CODE;
            return true;
        })
        .sort((a, b) => {
            if (a[1].stationsNumber !== b[1].stationsNumber) {
                return a[1].stationsNumber - b[1].stationsNumber;
            }
            return a[1].timeMinutes - b[1].timeMinutes;
        });

    let reachableCount = 0;
    let unreachableCount = 0;

    sortedResults.forEach(([code, result]) => {
        const name = stationMap.get(code)?.name ?? "???";
        if (result.timeMinutes === Infinity) {
            unreachableCount++;
            console.log(`${code.padEnd(20)}${name.padEnd(12)}${"到達不可".padStart(8)}${"---".padStart(14)}`);
        } else {
            reachableCount++;
            console.log(
                `${code.padEnd(20)}${name.padEnd(12)}${String(result.stationsNumber).padStart(8)}${String(result.timeMinutes).padStart(14)}`,
            );
        }
    });

    console.log(separator);
    console.log(`\n📈 集計: 到達可能 ${reachableCount}駅 / 到達不可 ${unreachableCount}駅`);

    // 統計情報
    const reachableResults = sortedResults.filter(([, r]) => r.timeMinutes < Infinity);
    if (reachableResults.length > 0) {
        const maxTime = Math.max(...reachableResults.map(([, r]) => r.timeMinutes));
        const maxStations = Math.max(...reachableResults.map(([, r]) => r.stationsNumber));
        const avgTime = reachableResults.reduce((sum, [, r]) => sum + r.timeMinutes, 0) / reachableResults.length;
        const avgStations =
            reachableResults.reduce((sum, [, r]) => sum + r.stationsNumber, 0) / reachableResults.length;

        const farthestByTime = reachableResults.reduce((prev, curr) =>
            curr[1].timeMinutes > prev[1].timeMinutes ? curr : prev,
        );
        const farthestByStations = reachableResults.reduce((prev, curr) =>
            curr[1].stationsNumber > prev[1].stationsNumber ? curr : prev,
        );

        console.log("\n📊 統計情報:");
        console.log(
            `  最大所要時間: ${maxTime}分 → ${stationMap.get(farthestByTime[0])?.name}（${farthestByTime[0]}）`,
        );
        console.log(
            `  最大マス数:   ${maxStations}マス → ${stationMap.get(farthestByStations[0])?.name}（${farthestByStations[0]}）`,
        );
        console.log(`  平均所要時間: ${avgTime.toFixed(1)}分`);
        console.log(`  平均マス数:   ${avgStations.toFixed(1)}マス`);
    }
}

main()
    .catch((e) => {
        console.error("エラーが発生しました:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
