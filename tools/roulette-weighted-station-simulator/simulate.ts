/**
 * 目的駅ルーレットシミュレーター
 *
 * RouletteUtilsの目的駅ルーレットを、指定した駅を起点に「N回×Mセット」実行し、
 * 選ばれた駅の駅数・所要時間の分布をCSVに出力する。
 * ゲームバランス調整のための検証ツールであり、テストではない（実行のたびに結果が変わる）。
 *
 * 使い方:
 *   npx dotenv -e .env.local -- npx tsx tools/roulette-weighted-station-simulator/simulate.ts
 *
 * 設定:
 *   EVENT_TYPE_CODE: イベント種別コード
 *   START_STATION_CODE: 開始駅コード
 *   VERSION: ルーレットロジックのバージョン選択（v2: 旧ロジック, v3: 新ロジック）
 *   ELIMINATION_TIME_RANGE_MINUTES: 除外する時間範囲（分）。この値以下の駅は候補から除外（v2のみ）
 *   SET_COUNT / RUNS_PER_SET: セット数と各セットの実行回数
 */

import * as fs from "fs";
import * as path from "path";
import {
    PrismaClient,
    Stations,
    LatestTransitStations,
    StationType,
} from "../../src/generated/prisma/index.js";
import { NearbyStationsWithRelations } from "../../src/repositories/nearbyStations/NearbyStationsRepository.js";
import DijkstraUtils, { DistancesMap, StationsGraph } from "../../src/utils/dijkstraUtils.js";
import { RouletteUtils } from "../../src/utils/rouletteUtils.js";

// ========== 設定 ==========
const EVENT_TYPE_CODE = "METRO_V1"; // イベント種別コード
const START_STATION_CODE = "METRO_V1_OTEMACHI"; // 開始駅コード
const VERSION: "v2" | "v3" = "v3"; // ルーレットロジックのバージョン選択（v2: 旧ロジック, v3: 新ロジック）
const ELIMINATION_TIME_RANGE_MINUTES = 10; // 除外する時間範囲（分）。この値以下の駅は候補から除外
const SET_COUNT = 20; // セット数
const RUNS_PER_SET = 15; // 各セットの実行回数
// ==========================

/** 1回のルーレット結果 */
interface RouletteResult {
    destinationStationCode: string;
    destinationStationName: string;
    stationsNumber: number;
    timeMinutes: number;
}

/** CSV出力用の行データ */
interface CsvRowData {
    setNumber: number;
    runNumber: number;
    stationName: string;
    stationsFromPrevious: number;
    timeFromPrevious: number;
}

/** 統計情報 */
interface Statistics {
    averageStations: number;
    averageTime: number;
    maxStations: number;
    maxTime: number;
    minStations: number;
    minTime: number;
}

/**
 * 駅間の距離と時間を計算する
 * @param nearbyStations - 近隣駅の接続情報
 * @param startStationCode - 開始駅のコード
 * @param destinationStationCode - 目的駅のコード
 * @returns {{ stationsNumber: number; timeMinutes: number }} 駅数と所要時間
 */
function calculateRouteInfo(
    nearbyStations: NearbyStationsWithRelations[],
    startStationCode: string,
    destinationStationCode: string,
): { stationsNumber: number; timeMinutes: number } {
    const graph: StationsGraph = DijkstraUtils.convertNearbyStationsToStationGraph(nearbyStations);
    const distances: DistancesMap = DijkstraUtils.calculateRequiredTimeAndStations(graph, startStationCode);

    const result = distances.get(destinationStationCode);
    if (result) {
        return {
            stationsNumber: result.stationsNumber,
            timeMinutes: result.timeMinutes,
        };
    }

    return { stationsNumber: 0, timeMinutes: 0 };
}

/**
 * 統計情報を計算する
 * @param results - ルーレット結果の配列
 * @returns {Statistics} 統計情報
 */
function calculateStatistics(results: RouletteResult[]): Statistics {
    if (results.length === 0) {
        return {
            averageStations: 0,
            averageTime: 0,
            maxStations: 0,
            maxTime: 0,
            minStations: 0,
            minTime: 0,
        };
    }

    const stationsNumbers = results.map((r) => r.stationsNumber);
    const timeMinutes = results.map((r) => r.timeMinutes);

    return {
        averageStations: stationsNumbers.reduce((a, b) => a + b, 0) / stationsNumbers.length,
        averageTime: timeMinutes.reduce((a, b) => a + b, 0) / timeMinutes.length,
        maxStations: Math.max(...stationsNumbers),
        maxTime: Math.max(...timeMinutes),
        minStations: Math.min(...stationsNumbers),
        minTime: Math.min(...timeMinutes),
    };
}

/**
 * CSV出力用のデータを生成する
 * @param setResults - セット別のルーレット結果
 * @returns {CsvRowData[]} CSV出力用の行データ
 */
function generateCsvData(setResults: RouletteResult[][]): CsvRowData[] {
    const csvData: CsvRowData[] = [];

    for (let setIndex = 0; setIndex < setResults.length; setIndex++) {
        const setResult = setResults[setIndex];
        for (let runIndex = 0; runIndex < setResult.length; runIndex++) {
            const result = setResult[runIndex];
            csvData.push({
                setNumber: setIndex + 1,
                runNumber: runIndex + 1,
                stationName: result.destinationStationName,
                stationsFromPrevious: result.stationsNumber,
                timeFromPrevious: result.timeMinutes,
            });
        }
    }

    return csvData;
}

/**
 * CSVファイルに出力する
 * @param csvData - CSV出力用の行データ
 * @returns {string} 出力先のファイルパス
 */
function outputToCsv(csvData: CsvRowData[]): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5); // YYYY-MM-DDTHH-mm-ss
    const filename = `roulette-simulation-results_${timestamp}.csv`;
    const outputPath = path.join(__dirname, "output", filename);

    // outputディレクトリが存在しない場合は作成
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // CSVヘッダー
    const header = "セット数,回数,駅名,前の駅からの駅数,前の駅からの所要時間(分)\n";

    // CSVデータ
    const csvContent = csvData
        .map(
            (row) =>
                `${row.setNumber},${row.runNumber},"${row.stationName}",${row.stationsFromPrevious},${row.timeFromPrevious}`,
        )
        .join("\n");

    // ファイル出力
    fs.writeFileSync(outputPath, header + csvContent, "utf8");

    return outputPath;
}

/**
 * シミュレーションを実行する
 */
async function main(): Promise<void> {
    const prisma = new PrismaClient();

    try {
        // DBから駅データを取得
        const stations: Stations[] = await prisma.stations.findMany({
            where: { eventTypeCode: EVENT_TYPE_CODE },
        });

        // DBから近隣駅データを取得
        const nearbyStations = (await prisma.nearbyStations.findMany({
            where: { eventTypeCode: EVENT_TYPE_CODE },
            include: {
                fromStation: true,
                toStation: true,
            },
        })) as NearbyStationsWithRelations[];

        if (stations.length === 0 || nearbyStations.length === 0) {
            console.error(`No data found for eventTypeCode: ${EVENT_TYPE_CODE}`);
            return;
        }

        const latestTransitStations: LatestTransitStations[] = []; // 空配列でシミュレート
        const goalStations: [] = []; // 空配列でシミュレート

        const allResults: RouletteResult[] = [];
        const setResultsArray: RouletteResult[][] = [];
        const stationFrequency = new Map<string, number>();

        // セットの実行
        for (let setIndex = 0; setIndex < SET_COUNT; setIndex++) {
            const setResults: RouletteResult[] = [];
            const selectedStationsSet = new Set<string>();
            let currentStationCode = START_STATION_CODE; // 開始駅から開始

            // 各セットで指定回数実行
            for (let i = 0; i < RUNS_PER_SET; i++) {
                const selectedStationCode =
                    VERSION === "v3"
                        ? RouletteUtils.getWeightedStationCodeV3(
                              stations.filter(
                                  (station) =>
                                      station.stationType === StationType.mission &&
                                      selectedStationsSet.has(station.stationCode) === false,
                              ),
                              nearbyStations,
                              latestTransitStations,
                              goalStations,
                              currentStationCode, // 現在の位置から次の駅を選択
                          )
                        : RouletteUtils.getWeightedStationCode(
                              nearbyStations,
                              latestTransitStations,
                              goalStations,
                              currentStationCode, // 現在の位置から次の駅を選択
                              ELIMINATION_TIME_RANGE_MINUTES, // 除外する時間範囲（分）
                          );

                // 駅コードから駅情報を取得
                const selectedStation = stations.find((station) => station.stationCode === selectedStationCode);
                if (!selectedStation) {
                    continue;
                }

                const routeInfo = calculateRouteInfo(
                    nearbyStations,
                    currentStationCode, // 現在の位置から目的地への情報を計算
                    selectedStation.stationCode,
                );

                const result: RouletteResult = {
                    destinationStationCode: selectedStation.stationCode,
                    destinationStationName: selectedStation.name,
                    stationsNumber: routeInfo.stationsNumber,
                    timeMinutes: routeInfo.timeMinutes,
                };

                setResults.push(result);
                allResults.push(result);

                // 次の回では選ばれた駅をスタート地点に設定
                currentStationCode = selectedStation.stationCode;

                // 駅の出現頻度をカウント
                stationFrequency.set(
                    selectedStation.stationCode,
                    (stationFrequency.get(selectedStation.stationCode) ?? 0) + 1,
                );
                selectedStationsSet.add(selectedStation.stationCode);
            }

            setResultsArray.push(setResults);
        }

        // 全体統計の計算と表示
        const overallStats = calculateStatistics(allResults);
        console.log(`総実行回数: ${allResults.length}回`);
        console.log(`出現駅数: ${stationFrequency.size}駅`);
        console.log(`平均駅数: ${overallStats.averageStations.toFixed(2)}駅`);
        console.log(`平均時間: ${overallStats.averageTime.toFixed(2)}分`);
        console.log(`最大駅数: ${overallStats.maxStations}駅`);
        console.log(`最大時間: ${overallStats.maxTime}分`);
        console.log(`最小駅数: ${overallStats.minStations}駅`);
        console.log(`最小時間: ${overallStats.minTime}分`);

        // CSV出力
        const csvFilePath = outputToCsv(generateCsvData(setResultsArray));
        console.log(`CSV出力完了: ${csvFilePath}`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
