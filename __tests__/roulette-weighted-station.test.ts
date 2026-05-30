/**
 * @jest-environment node
 */
/// <reference types="jest" />

/**
 * RouletteUtilsのgetWeightedStationCodeメソッドをテストするファイル
 * 指定した駅から10回×20セットのルーレットを実行し、結果を分析する
 *
 * 使い方:
 *   npx dotenv -e .env.local -- npx jest __tests__/roulette-weighted-station.test.ts
 *
 * 設定:
 *   EVENT_TYPE_CODE: イベント種別コード
 *   START_STATION_CODE: 開始駅コード
 *  VERSION: ルーレットロジックのバージョン選択（v2: 旧ロジック, v3: 新ロジック）
 *  ELIMINATION_TIME_RANGE_MINUTES: 除外する時間範囲（分）。この値以下の駅は候補から除外
 */

import { PrismaClient, Stations, LatestTransitStations } from "@/generated/prisma";
import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";
import DijkstraUtils, { DistancesMap, StationsGraph } from "@/utils/dijkstraUtils";
import { RouletteUtils } from "@/utils/rouletteUtils";
import * as fs from "fs";
import * as path from "path";

// ========== 設定 ==========
const EVENT_TYPE_CODE = "METRO_V1"; // イベント種別コード
const START_STATION_CODE = "METRO_V1_OTEMACHI"; // 開始駅コード
const VERSION: "v2" | "v3" = "v3"; // ルーレットロジックのバージョン選択（v2: 旧ロジック, v3: 新ロジック）
const ELIMINATION_TIME_RANGE_MINUTES = 10; // 除外する時間範囲（分）。この値以下の駅は候補から除外
// ==========================

// テスト用の型定義
interface RouletteTestResult {
    destinationStationCode: string;
    destinationStationName: string;
    stationsNumber: number;
    timeMinutes: number;
}

// CSV出力用の型定義
interface CsvRowData {
    setNumber: number;
    runNumber: number;
    stationName: string;
    stationsFromPrevious: number;
    timeFromPrevious: number;
}

interface TestSetResult {
    setNumber: number;
    results: RouletteTestResult[];
    averageStations: number;
    averageTime: number;
    maxStations: number;
    maxTime: number;
    minStations: number;
    minTime: number;
}

interface OverallStatistics {
    totalRuns: number;
    averageStations: number;
    averageTime: number;
    maxStations: number;
    maxTime: number;
    minStations: number;
    minTime: number;
    stationFrequency: Map<string, number>;
}

/**
 * 駅間の距離と時間を計算する関数
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
 * 統計情報を計算する関数
 */
function calculateStatistics(results: RouletteTestResult[]): {
    averageStations: number;
    averageTime: number;
    maxStations: number;
    maxTime: number;
    minStations: number;
    minTime: number;
} {
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
 * CSV出力用のデータを生成する関数
 */
function generateCsvData(allResults: RouletteTestResult[], setResults: RouletteTestResult[][]): CsvRowData[] {
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
 * CSVファイルに出力する関数
 */
function outputToCsv(csvData: CsvRowData[]): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5); // YYYY-MM-DDTHH-mm-ss
    const filename = `roulette-test-results_${timestamp}.csv`;
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
    const fullCsvContent = header + csvContent;
    fs.writeFileSync(outputPath, fullCsvContent, "utf8");

    return outputPath;
}

/**
 * ルーレットテストのメインテスト関数
 */
describe("RouletteUtils getWeightedStationCode テスト", () => {
    const prisma = new PrismaClient();
    let stations: Stations[] = [];
    let nearbyStations: NearbyStationsWithRelations[] = [];
    const latestTransitStations: LatestTransitStations[] = []; // 空配列でテスト
    const goalStations: [] = []; // 空配列でテスト
    let dbConnected = true;

    beforeAll(async () => {
        try {
            // DBから駅データを取得
            stations = await prisma.stations.findMany({
                where: { eventTypeCode: EVENT_TYPE_CODE },
            });

            // DBから近隣駅データを取得
            nearbyStations = (await prisma.nearbyStations.findMany({
                where: { eventTypeCode: EVENT_TYPE_CODE },
                include: {
                    fromStation: true,
                    toStation: true,
                },
            })) as NearbyStationsWithRelations[];
        } catch (error) {
            dbConnected = false;
            console.error("Database connection failed:", error);
            // DATABASE_URLが設定されていない場合は、テストをスキップ
            console.warn("Skipping test: DATABASE_URL environment variable not set. Please set it and run: npx dotenv -e .env.local -- npx jest");
        }
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    test("指定駅から10回✕20セットのルーレットテスト", () => {
        if (!dbConnected || stations.length === 0 || nearbyStations.length === 0) {
            console.warn("Test skipped: Database connection failed or no data retrieved");
            return;
        }
        const testSets: TestSetResult[] = [];
        const allResults: RouletteTestResult[] = [];
        const setResultsArray: RouletteTestResult[][] = []; // CSV出力用にセット別データを保持
        const stationFrequency = new Map<string, number>();

        // 20セットの実行
        for (let setIndex = 0; setIndex < 20; setIndex++) {
            const setResults: RouletteTestResult[] = [];
            let currentStationCode = START_STATION_CODE; // 開始駅から開始

            // 各セットで10回実行
            for (let i = 0; i < 10; i++) {
                const selectedStationCode =
                    VERSION === "v3"
                        ? RouletteUtils.getWeightedStationCodeV3(
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

                if (selectedStation) {
                    const routeInfo = calculateRouteInfo(
                        nearbyStations,
                        currentStationCode, // 現在の位置から目的地への情報を計算
                        selectedStation.stationCode,
                    );

                    const result: RouletteTestResult = {
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
                    const count = stationFrequency.get(selectedStation.stationCode) || 0;
                    stationFrequency.set(selectedStation.stationCode, count + 1);
                }
            }

            // セットの統計を計算
            const setStats = calculateStatistics(setResults);
            const testSet: TestSetResult = {
                setNumber: setIndex + 1,
                results: setResults,
                ...setStats,
            };
            testSets.push(testSet);
            setResultsArray.push([...setResults]); // CSV出力用にセット結果を保存
        }

        // 全体統計の計算
        const overallStats = calculateStatistics(allResults);
        const finalStats: OverallStatistics = {
            totalRuns: allResults.length,
            ...overallStats,
            stationFrequency,
        };

        // 結果の表示
        console.log(`総実行回数: ${finalStats.totalRuns}回`);
        console.log(`平均駅数: ${finalStats.averageStations.toFixed(2)}駅`);
        console.log(`平均時間: ${finalStats.averageTime.toFixed(2)}分`);
        console.log(`最大駅数: ${finalStats.maxStations}駅`);
        console.log(`最大時間: ${finalStats.maxTime}分`);
        console.log(`最小駅数: ${finalStats.minStations}駅`);
        console.log(`最小時間: ${finalStats.minTime}分`);

        // CSV出力
        const csvData = generateCsvData(allResults, setResultsArray);
        const csvFilePath = outputToCsv(csvData);
        console.log(`CSV出力完了: ${csvFilePath}`);

        // アサーション（テストが実行されたことを確認）
        expect(finalStats.totalRuns).toBe(200);
        expect(finalStats.stationFrequency.size).toBeGreaterThan(0);
        expect(finalStats.averageStations).toBeGreaterThan(0);
        expect(finalStats.averageTime).toBeGreaterThan(0);
    });
});
