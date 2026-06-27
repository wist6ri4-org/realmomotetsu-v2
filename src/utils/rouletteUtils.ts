import { GoalStations, LatestTransitStations, Stations, StationType } from "@/generated/prisma";
import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";
import DijkstraUtils, { DistancesMap } from "./dijkstraUtils";
import { StationsGraph, StationsProbabilitiesMap } from "./dijkstraUtils";
import { GameConstants } from "@/constants/gameConstants";

export class RouletteUtils {
    /**
     * ぶっとびルーレット
     * @description 指定された駅コードを除いて、ランダムに駅コードを選択する
     * @param stations - 近隣駅の接続情報
     * @param startStationCode - 開始駅のコード
     * @return {string} 次に選択する駅のコード
     */
    static getRandomStationCode(stations: Stations[], startStationCode: string): string {
        if (stations.length === 0) {
            throw new Error("No stations available to select from.");
        }
        const filteredStations = stations.filter((station) => station.stationCode !== startStationCode);
        const randomIndex = Math.floor(Math.random() * filteredStations.length);
        return filteredStations[randomIndex].stationCode;
    }

    /**
     * 目的駅ルーレット（V2）
     * @description 開始駅からの距離に基づいて、次の目的駅を重み付きルーレットで選択する
     * @param nearbyStations - 近隣駅の接続情報
     * @param latestTransitStations - 最新の経由駅情報
     * @param goalStations - 既出目的駅のリスト
     * @param startStationCode - 開始駅のコード
     * @param eliminationTimeRangeMinutes - 選択肢から除外する時間範囲（分）
     * @return {string} 次に選択する駅のコード
     */
    static getWeightedStationCode(
        nearbyStations: NearbyStationsWithRelations[],
        latestTransitStations: LatestTransitStations[] = [],
        goalStations: GoalStations[] = [],
        startStationCode: string,
        eliminationTimeRangeMinutes: number = GameConstants.ELIMINATION_TIME_RANGE_MINUTES,
    ): string {
        const graph: StationsGraph = DijkstraUtils.convertNearbyStationsToStationGraph(nearbyStations);
        const distances: DistancesMap = this.getCandidateStationDistances(
            graph,
            startStationCode,
            latestTransitStations,
            goalStations,
            eliminationTimeRangeMinutes,
        );
        const probabilities: StationsProbabilitiesMap = this.calculateProbabilities(distances);
        const selectedStationCode: string = this.selectNextStationCode(probabilities);
        return selectedStationCode;
    }

    /**
     * 候補駅を絞り込む（V2）
     * @param graph - グラフ形式の駅接続情報
     * @param startStationCode - 開始駅のコード
     * @param latestTransitStations - 最新の経由駅情報
     * @param goalStations - 既出目的駅のリスト
     * @param eliminationTimeRangeMinutes - 選択肢から除外する時間範囲（分）
     * @return {DistancesMap} 絞り込み済みの候補駅のコードとその駅までの時間と駅数を含むマップ
     */
    static getCandidateStationDistances(
        graph: StationsGraph,
        startStationCode: string,
        latestTransitStations: LatestTransitStations[] = [],
        goalStations: GoalStations[] = [],
        eliminationTimeRangeMinutes: number = GameConstants.ELIMINATION_TIME_RANGE_MINUTES,
    ): DistancesMap {
        const distances: DistancesMap = DijkstraUtils.calculateRequiredTimeAndStations(graph, startStationCode);

        // 候補駅のフィルタリング
        const filteredDistances: DistancesMap = new Map(
            [...distances].filter(([key, { timeMinutes }]) => {
                return (
                    // 開始駅と同じ駅は除外
                    key !== startStationCode &&
                    // 時間が範囲外であること
                    timeMinutes > eliminationTimeRangeMinutes &&
                    // 各チームの最新経由駅に含まれないこと（空配列の場合はすべて選択可能）
                    (latestTransitStations.length === 0 ||
                        !latestTransitStations.some((station) => station.stationCode === key)) &&
                    // 既出目的地駅に含まれないこと（空配列の場合はすべて選択可能）
                    (goalStations.length === 0 || !goalStations.some((station) => station.stationCode === key))
                );
            }),
        );
        return filteredDistances;
    }

    /**
     * 重み付きルーレットの確率計算（V2）
     * @param distances - 駅ごとの最短時間と駅数を含むマップ
     * @returns {StationsProbabilitiesMap} 駅ごとの確率を含むマップ
     */
    static calculateProbabilities(distances: DistancesMap): StationsProbabilitiesMap {
        // 確率を格納するマップを初期化
        const stationsProbabilities: StationsProbabilitiesMap = new Map<string, number>();
        // 所要時間の重みの合計を計算
        const totalWeights = Array.from(distances.values()).reduce((sum, value) => sum + 1 / value.timeMinutes, 0);

        // 各駅への所要時間の逆数で重みを計算
        distances.forEach((value, stationCode) => {
            if (value.timeMinutes < Infinity) {
                stationsProbabilities.set(stationCode, 1 / value.timeMinutes / totalWeights);
            } else {
                stationsProbabilities.set(stationCode, 0);
            }
        });
        return stationsProbabilities;
    }

    /**
     * 目的駅ルーレット（V3）
     * @description 開始駅からの距離に基づいて、次の目的駅を重み付きルーレットで選択する
     * @param stations - すべての駅情報
     * @param nearbyStations - 近隣駅の接続情報
     * @param latestTransitStations - 最新の経由駅情報
     * @param goalStations - 既出目的駅のリスト
     * @param startStationCode - 開始駅のコード
     * @return {string} 次に選択する駅のコード
     */
    static getWeightedStationCodeV3(
        stations: Stations[],
        nearbyStations: NearbyStationsWithRelations[],
        latestTransitStations: LatestTransitStations[] = [],
        goalStations: GoalStations[] = [],
        startStationCode: string,
    ): string {
        const graph: StationsGraph = DijkstraUtils.convertNearbyStationsToStationGraph(nearbyStations);
        const distances: DistancesMap = this.getCandidateStationDistancesV3(
            stations,
            graph,
            startStationCode,
            latestTransitStations,
            goalStations,
        );
        const probabilities: StationsProbabilitiesMap = this.calculateProbabilitiesV3(distances);
        const selectedStationCode: string = this.selectNextStationCode(probabilities);
        return selectedStationCode;
    }

    /**
     * 候補駅を絞り込む（V3）
     * @param stations - すべての駅情報
     * @param graph - グラフ形式の駅接続情報
     * @param startStationCode - 開始駅のコード
     * @param latestTransitStations - 最新の経由駅情報
     * @param goalStations - 既出目的駅のリスト
     * @return {DistancesMap} 絞り込み済みの候補駅のコードとその駅までの時間と駅数を含むマップ
     */
    static getCandidateStationDistancesV3(
        stations: Stations[],
        graph: StationsGraph,
        startStationCode: string,
        latestTransitStations: LatestTransitStations[] = [],
        goalStations: GoalStations[] = [],
    ): DistancesMap {
        const distances: DistancesMap = DijkstraUtils.calculateRequiredTimeAndStations(graph, startStationCode);

        // mission駅のstationCodeをSetに変換して高速検索可能にする
        const missionStationCodes = new Set(
            stations
                .filter((station) => station.stationType === StationType.mission)
                .map((station) => station.stationCode)
        );

        // 候補駅のフィルタリング
        const filteredDistances: DistancesMap = new Map(
            [...distances].filter(([key]) => {
                return (
                    // 開始駅と同じ駅は除外
                    key !== startStationCode &&
                    // 各チームの最新経由駅に含まれないこと（空配列の場合はすべて選択可能）
                    (latestTransitStations.length === 0 ||
                        !latestTransitStations.some((station) => station.stationCode === key)) &&
                    // 既出目的地駅に含まれないこと（空配列の場合はすべて選択可能）
                    (goalStations.length === 0 || !goalStations.some((station) => station.stationCode === key)) &&
                    // 駅の種類がmissionであること
                    missionStationCodes.has(key)
                );
            }),
        );
        return filteredDistances;
    }

    /**
     * 重み付きルーレットの確率計算（V3）
     * @param distances - 駅ごとの最短時間と駅数を含むマップ
     * @returns {StationsProbabilitiesMap} 駅ごとの確率を含むマップ
     */
    static calculateProbabilitiesV3(distances: DistancesMap): StationsProbabilitiesMap {
        // 確率を格納するマップを初期化
        const stationsProbabilities: StationsProbabilitiesMap = new Map<string, number>();

        let prevMax = 0;
        const selectedStations: string[] = [];
        for (const bucket of GameConstants.STATION_SELECTION_BUCKETS) {
            const candidateStations = [...distances].filter(
                ([_, { timeMinutes }]) => timeMinutes > prevMax && timeMinutes <= bucket.maxMinutes,
            );
            const selectedInBucket = candidateStations
                .sort(() => 0.5 - Math.random())
                .slice(0, bucket.count)
                .map(([stationCode]) => stationCode);
            selectedStations.push(...selectedInBucket);
            prevMax = bucket.maxMinutes;
        }

        // 候補駅の数が少ない場合、すべての駅を均等な確率で選択する
        if (selectedStations.length < 5) {
            distances.forEach((_, stationCode) => {
                stationsProbabilities.set(stationCode, 1 / distances.size);
            });
            return stationsProbabilities;
        }

        // 各駅への確率を均一にしてマップに設定
        selectedStations.forEach((stationCode) => {
            stationsProbabilities.set(stationCode, 1 / selectedStations.length);
        });
        return stationsProbabilities;
    }

    /**
     * 確率に基づいて次の駅コードを選択する
     * @param stationsProbabilities - 駅ごとの確率を含むマップ
     * @returns {string} 選択された駅のコード
     */
    static selectNextStationCode(stationsProbabilities: StationsProbabilitiesMap): string {
        // ランダムな値を生成
        const randomValue = Math.random();
        // 確率の累積値を計算
        let cumulative = 0;

        // 累積確率から駅をランダムに選択
        for (const [stationCode, probability] of stationsProbabilities) {
            cumulative += probability;
            if (randomValue < cumulative) {
                return stationCode;
            }
        }

        // 確率の合計が1を超える場合、最後の駅を返す
        const lastStationCode = Array.from(stationsProbabilities.keys()).pop();
        if (lastStationCode) {
            return lastStationCode;
        } else {
            throw new Error("No stations available for selection");
        }
    }
}
