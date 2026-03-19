import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";

export type DistancesMap = Map<string, { timeMinutes: number; stationsNumber: number }>;
export type StationsGraph = Record<string, Array<{ stationCode: string; timeMinutes: number }>>;
export type StationsProbabilitiesMap = Map<string, number>;

export default class DijkstraUtils {
    /**
     * 近隣駅の接続情報をグラフ形式に変換
     * @param nearbyStations - 近隣駅の接続情報
     * @returns {StationsGraph} グラフ形式の駅接続情報
     */
    static convertNearbyStationsToStationGraph(nearbyStations: NearbyStationsWithRelations[]): StationsGraph {
        const graph: StationsGraph = {};

        nearbyStations.forEach((connection) => {
            if (!graph[connection.fromStationCode]) {
                graph[connection.fromStationCode] = [];
            }
            graph[connection.fromStationCode].push({
                stationCode: connection.toStationCode,
                timeMinutes: connection.timeMinutes,
            });
        });

        return graph;
    }

    /**
     * 指定された駅からの残りの駅数を計算する
     * @param graph - 駅の接続情報を表すグラフ
     * @param startStationCode - 開始駅のコード
     * @returns {number} 残りの駅数
     */
    static calculateRemainingStationsNumber(
        graph: StationsGraph,
        startStationCode: string,
        nextGoalStationCode: string,
    ): number {
        const times = this.calculateRequiredTimeAndStations(graph, startStationCode);
        const stationsNumber = times.get(nextGoalStationCode)?.stationsNumber;
        if (!stationsNumber && stationsNumber !== 0) {
            throw new Error(`Station ${startStationCode} not found in the graph`);
        }
        return stationsNumber;
    }

    /**
     * ダイクストラ関数
     * @param graph - 駅の接続情報を表すグラフ
     * @param startStationCode - 開始駅のコード
     * @returns {DistancesMap} 駅ごとの最短時間と駅数を含むマップ
     */
    static calculateRequiredTimeAndStations(graph: StationsGraph, startStationCode: string): DistancesMap {
        // 各駅の最短時間と駅数を格納するマップを初期化（無限大に設定）
        const distances: DistancesMap = new Map<string, { timeMinutes: number; stationsNumber: number }>();
        Object.keys(graph).forEach((stationCode) => {
            distances.set(stationCode, {
                timeMinutes: Infinity,
                stationsNumber: Infinity,
            });
        });

        // 開始駅の時間と駅数を0に設定
        distances.set(startStationCode, {
            timeMinutes: 0,
            stationsNumber: 0,
        });

        // 探索キュー
        const queue = new Array<{
            stationCode: string;
            timeMinutes: number;
            stationsNumber: number;
        }>();
        queue.push({
            stationCode: startStationCode,
            timeMinutes: 0,
            stationsNumber: 0,
        });

        while (queue.length > 0) {
            // マス数の少ない順にソート
            queue.sort((a, b) => a.stationsNumber - b.stationsNumber);
            // マス数が最短の駅をshift
            const { stationCode, timeMinutes, stationsNumber } = queue.shift()!;

            // 隣接駅それぞれへの時間と駅数を取得
            graph[stationCode].forEach((neighbor: { stationCode: string; timeMinutes: number }) => {
                const newTimeMinutes = timeMinutes + neighbor.timeMinutes;
                const newStationsNumber = stationsNumber + 1;

                // 新しいマス数が既存のマス数より短ければ更新
                if (newStationsNumber <= distances.get(neighbor.stationCode)!.stationsNumber) {
                    distances.get(neighbor.stationCode)!.stationsNumber = newStationsNumber;

                    // 時間も比較して更新
                    const timeMinutesToSet =
                        newTimeMinutes < distances.get(neighbor.stationCode)!.timeMinutes
                            ? newTimeMinutes
                            : distances.get(neighbor.stationCode)!.timeMinutes;
                    distances.get(neighbor.stationCode)!.timeMinutes = timeMinutesToSet;

                    queue.push({
                        stationCode: neighbor.stationCode,
                        timeMinutes: timeMinutesToSet,
                        stationsNumber: newStationsNumber,
                    });
                }
            });
        }
        return distances;
    }

    /**
     * 重み付きルーレットの確率計算
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
}
