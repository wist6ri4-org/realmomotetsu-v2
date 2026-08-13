/**
 * ルーレット出現確率分析ツール
 *
 * DB上の近隣駅データを使って、ルーレットで各駅が選ばれる確率を算出する。
 * rouletteUtilsと同じロジック（時間範囲外排除 + 所要時間逆数の重み付け）で計算。
 *
 * 使い方:
 *   npx dotenv -e .env.local -- npx tsx tools/roulette-probability-analyzer/probabilities.ts
 *
 * モード:
 *  "single" - ①指定した駅を起点にした際の各候補駅の出現確率
 *  "all"    - ②全駅を起点にしたときの各駅の出現確率（平均）
 *
 * バージョン:
 *  "v2" - 旧ルーレットロジック（経由駅と既出目的駅を考慮して候補駅を絞り込む）
 *  "v3" - 新ルーレットロジック（経由駅と既出目的駅を考慮せず、開始駅からの距離のみで候補駅を絞り込む）
 */

import { Stations } from "@/generated/zod/index.js";
import { PrismaClient } from "../../src/generated/prisma/index.js";
import DijkstraUtils, { StationsGraph, StationsProbabilitiesMap } from "../../src/utils/dijkstraUtils.js";
import { RouletteUtils } from "../../src/utils/rouletteUtils.js";

// ========== 設定 ==========
const EVENT_TYPE_CODE = "METRO_V1"; // イベント種別コード
const START_STATION_CODE = "METRO_V1_OTEMACHI"; // 開始駅コード（singleモード時に使用）
const MODE: "single" | "all" = "all"; // "single": ①単一駅起点, "all": ②全駅起点
const VERSION: "v2" | "v3" = "v3"; // ルーレットロジックのバージョン選択（v2: 旧ロジック, v3: 新ロジック）
const ELIMINATION_TIME_RANGE_MINUTES = 10; // 除外する時間範囲（分）。この値以下の駅は候補から除外
// ==========================

const prisma = new PrismaClient();

type StationInfo = {
    stationCode: string;
    name: string;
};

/**
 * RouletteUtilsの共通メソッドを使って、指定駅からの候補駅確率を計算する
 */
function calculateProbabilitiesFromStation(graph: StationsGraph, startStationCode: string): StationsProbabilitiesMap {
    RouletteUtils.getCandidateStationDistances(graph, startStationCode, [], [], ELIMINATION_TIME_RANGE_MINUTES);
    return RouletteUtils.calculateProbabilities(
        RouletteUtils.getCandidateStationDistances(graph, startStationCode, [], [], ELIMINATION_TIME_RANGE_MINUTES),
    );
}

function calculateProbabilitiesFromStationV3(
    stations: Stations[],
    graph: StationsGraph,
    startStationCode: string,
): StationsProbabilitiesMap {
    return RouletteUtils.calculateProbabilitiesV3(
        RouletteUtils.getCandidateStationDistancesV3(stations, graph, startStationCode, [], []),
    );
}

/**
 * ① 単一駅起点モード: 指定駅からの各候補駅の出現確率を表示
 */
function runSingleMode(
    stations: Stations[],
    graph: StationsGraph,
    startStationCode: string,
    stationMap: Map<string, StationInfo>,
) {
    const startName = stationMap.get(startStationCode)?.name ?? startStationCode;
    const probabilities =
        VERSION === "v3"
            ? calculateProbabilitiesFromStationV3(stations, graph, startStationCode)
            : calculateProbabilitiesFromStation(graph, startStationCode);
    const distances = DijkstraUtils.calculateRequiredTimeAndStations(graph, startStationCode);

    console.log(`\n🎯 ${startName}（${startStationCode}）からの出現確率:\n`);

    const header =
        `${"駅コード".padEnd(30)}` +
        `${"駅名".padEnd(14)}` +
        `${"確率(%)".padStart(10)}` +
        `${"マス数".padStart(8)}` +
        `${"時間(分)".padStart(10)}`;
    const separator = "-".repeat(80);

    console.log(header);
    console.log(separator);

    const sorted = Array.from(probabilities.entries())
        .filter(([, prob]) => prob > 0)
        .sort((a, b) => b[1] - a[1]);

    sorted.forEach(([code, prob]) => {
        const name = stationMap.get(code)?.name ?? "???";
        const distance = distances.get(code);
        console.log(
            `${code.padEnd(30)}` +
                `${name.padEnd(14)}` +
                `${(prob * 100).toFixed(2).padStart(10)}` +
                `${String(distance?.stationsNumber ?? "-").padStart(8)}` +
                `${String(distance?.timeMinutes ?? "-").padStart(10)}`,
        );
    });

    console.log(separator);
    console.log(`\n📈 候補駅数: ${sorted.length}駅`);

    // 上位・下位の表示
    if (sorted.length > 0) {
        const top5 = sorted.slice(0, 5);
        const bottom5 = sorted.slice(-5).reverse();

        console.log("\n🔝 出現確率 TOP 5:");
        top5.forEach(([code, prob], i) => {
            const name = stationMap.get(code)?.name ?? "???";
            console.log(`  ${i + 1}. ${name}（${code}）: ${(prob * 100).toFixed(2)}%`);
        });

        console.log("\n🔻 出現確率 BOTTOM 5:");
        bottom5.forEach(([code, prob], i) => {
            const name = stationMap.get(code)?.name ?? "???";
            console.log(`  ${i + 1}. ${name}（${code}）: ${(prob * 100).toFixed(2)}%`);
        });
    }
}

/**
 * ② 全駅起点モード: 全駅から計算したときの各駅の平均出現確率を表示
 */
function runAllMode(stations: Stations[], graph: StationsGraph, stationMap: Map<string, StationInfo>) {
    const allStationCodes = Array.from(stationMap.keys());
    // 各駅の出現確率の合計と出現回数
    const totalProb = new Map<string, number>();
    const appearCount = new Map<string, number>();

    allStationCodes.forEach((code) => {
        totalProb.set(code, 0);
        appearCount.set(code, 0);
    });

    let processedCount = 0;

    // 全駅を起点に計算
    allStationCodes.forEach((startCode) => {
        // グラフに存在しない駅はスキップ
        if (!graph[startCode]) return;

        const probabilities =
            VERSION === "v3"
                ? calculateProbabilitiesFromStationV3(stations, graph, startCode)
                : calculateProbabilitiesFromStation(graph, startCode);

        probabilities.forEach((prob, destCode) => {
            if (prob > 0) {
                totalProb.set(destCode, (totalProb.get(destCode) ?? 0) + prob);
                appearCount.set(destCode, (appearCount.get(destCode) ?? 0) + 1);
            }
        });

        processedCount++;
    });

    console.log(`\n🌐 全${processedCount}駅を起点にした場合の各駅の出現確率:\n`);

    const header =
        `${"駅コード".padEnd(30)}` +
        `${"駅名".padEnd(14)}` +
        `${"平均確率(%)".padStart(12)}` +
        `${"候補回数".padStart(10)}` +
        `${"合計確率(%)".padStart(12)}`;
    const separator = "-".repeat(86);

    console.log(header);
    console.log(separator);

    // 平均確率で降順ソート
    const sorted = allStationCodes
        .map((code) => {
            const count = appearCount.get(code) ?? 0;
            const total = totalProb.get(code) ?? 0;
            const avg = count > 0 ? total / processedCount : 0;
            return { code, avg, count, total };
        })
        .filter((r) => r.count > 0)
        .sort((a, b) => b.avg - a.avg);

    sorted.forEach((r) => {
        const name = stationMap.get(r.code)?.name ?? "???";
        console.log(
            `${r.code.padEnd(30)}` +
                `${name.padEnd(14)}` +
                `${(r.avg * 100).toFixed(4).padStart(12)}` +
                `${String(r.count).padStart(10)}` +
                `${(r.total * 100).toFixed(4).padStart(12)}`,
        );
    });

    console.log(separator);

    const neverAppear = allStationCodes.filter((code) => (appearCount.get(code) ?? 0) === 0);

    console.log(`\n📈 集計:`);
    console.log(`  候補に出現する駅: ${sorted.length}駅`);
    console.log(`  候補に出現しない駅: ${neverAppear.length}駅`);

    if (sorted.length > 0) {
        const top5 = sorted.slice(0, 5);
        const bottom5 = sorted.slice(-5).reverse();

        console.log("\n🔝 平均出現確率 TOP 5:");
        top5.forEach((r, i) => {
            const name = stationMap.get(r.code)?.name ?? "???";
            console.log(`  ${i + 1}. ${name}（${r.code}）: ${(r.avg * 100).toFixed(4)}%`);
        });

        console.log("\n🔻 平均出現確率 BOTTOM 5:");
        bottom5.forEach((r, i) => {
            const name = stationMap.get(r.code)?.name ?? "???";
            console.log(`  ${i + 1}. ${name}（${r.code}）: ${(r.avg * 100).toFixed(4)}%`);
        });
    }

    if (neverAppear.length > 0) {
        console.log("\n⚠️ 候補に一度も出現しない駅:");
        neverAppear.forEach((code) => {
            const name = stationMap.get(code)?.name ?? "???";
            console.log(`  ${name}（${code}）`);
        });
    }
}

async function main() {
    console.log("=".repeat(86));
    console.log(" ルーレット出現確率分析ツール");
    console.log("=".repeat(86));
    console.log(`  イベント種別:     ${EVENT_TYPE_CODE}`);
    console.log(`  モード:           ${MODE === "single" ? "① 単一駅起点" : "② 全駅起点"}`);
    if (MODE === "single") {
        console.log(`  開始駅:           ${START_STATION_CODE}`);
    }
    console.log(`  除外時間範囲:     ${ELIMINATION_TIME_RANGE_MINUTES}分以下`);
    console.log("=".repeat(86));

    // 1. 駅マスタを取得
    const stations =
        VERSION === "v3"
            ? await prisma.stations.findMany({
                  where: { eventTypeCode: EVENT_TYPE_CODE },
                  orderBy: { kana: "asc" },
              })
            : await prisma.stations.findMany({
                  where: { eventTypeCode: EVENT_TYPE_CODE, stationType: "mission" },
                  orderBy: { kana: "asc" },
              });

    const stationMap = new Map<string, StationInfo>();
    stations.forEach((s) => {
        stationMap.set(s.stationCode, { stationCode: s.stationCode, name: s.name });
    });

    // singleモード時の開始駅存在チェック
    if (MODE === "single" && !stationMap.has(START_STATION_CODE)) {
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

    console.log(`\n📊 データ: ${stations.length}駅, ${nearbyStations.length}接続`);

    // 3. グラフ構築
    const graph = DijkstraUtils.convertNearbyStationsToStationGraph(nearbyStations);

    // 4. モードに応じて実行
    if (MODE === "single") {
        runSingleMode(stations, graph, START_STATION_CODE, stationMap);
    } else {
        runAllMode(stations, graph, stationMap);
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
