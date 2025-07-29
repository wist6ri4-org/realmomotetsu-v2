import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";

export default class DijkstraUtils {
    /**
     * 近隣駅の接続情報をグラフ形式に変換
     * @param nearbyStations - 近隣駅の接続情報
     * @returns {Record<string, Array<{ stationCode: string; timeMinutes: number; stationNumber: number }>>} グラフ形式の駅接続情報
     */
    static convertToStationGraph(
        nearbyStations: NearbyStationsWithRelations[]
    ): Record<string, Array<{ stationCode: string; timeMinutes: number }>> {
        const graph: Record<string, Array<{ stationCode: string; timeMinutes: number }>> = {};

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
     * ダイクストラアルゴリズムを使用して、指定された駅からの最短経路を計算し、次の駅を選択する
     * @param graph - 駅の接続情報を表すグラフ
     * @param startStationCode - 開始駅のコード
     * @returns {string} 次に選択する駅のコード
     */
    static calculate(
        graph: Record<string, Array<{ stationCode: string; timeMinutes: number }>>,
        startStationCode: string
    ): string {
        const times = this.calculateRequiredTimeAndStations(graph, startStationCode);
        const probabilities = this.calculateProbabilities(times);
        return this.selectNextStationCode(probabilities);
    }

    /**
     * 指定された駅からの残りの駅数を計算する
     * @param graph - 駅の接続情報を表すグラフ
     * @param startStationCode - 開始駅のコード
     * @returns {number} 残りの駅数
     */
    static calculateRemainingStationsNumber(
        graph: Record<string, Array<{ stationCode: string; timeMinutes: number }>>,
        startStationCode: string,
        nextGoalStationCode: string
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
     * @returns {Map<string, { timeMinutes: number; stationsNumber: number }>} 駅ごとの最短時間と駅数を含むマップ
     */
    static calculateRequiredTimeAndStations(
        graph: Record<string, Array<{ stationCode: string; timeMinutes: number }>>,
        startStationCode: string
    ): Map<string, { timeMinutes: number; stationsNumber: number }> {
        // 各駅の最短時間と駅数を格納するマップを初期化（無限大に設定）
        const times = new Map<string, { timeMinutes: number; stationsNumber: number }>();
        Object.keys(graph).forEach((stationCode) => {
            times.set(stationCode, {
                timeMinutes: Infinity,
                stationsNumber: Infinity,
            });
        });

        // 開始駅の時間と駅数を0に設定
        times.set(startStationCode, {
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
            // 所要時間順にソート
            queue.sort((a, b) => a.timeMinutes - b.timeMinutes);
            // 所要時間が最短の駅をshift
            const { stationCode, timeMinutes, stationsNumber } = queue.shift()!;

            // 隣接駅それぞれへの時間と駅数を取得
            graph[stationCode].forEach((neighbor: { stationCode: string; timeMinutes: number }) => {
                const newTimeMinutes = timeMinutes + neighbor.timeMinutes;
                const newStationsNumber = stationsNumber + 1;

                // 新しい所要時間が既存の所要時間より短ければ更新
                if (newTimeMinutes < times.get(neighbor.stationCode)!.timeMinutes) {
                    times.get(neighbor.stationCode)!.timeMinutes = newTimeMinutes;
                    times.get(neighbor.stationCode)!.stationsNumber = newStationsNumber;
                    queue.push({
                        stationCode: neighbor.stationCode,
                        timeMinutes: newTimeMinutes,
                        stationsNumber: newStationsNumber,
                    });
                }
            });
        }
        return times;
    }

    /**
     * 重み付きルーレットの確率計算
     * @param times - 駅ごとの最短時間と駅数を含
     * @returns {Map<string, number>} 駅ごとの確率を含むマップ
     */
    static calculateProbabilities(
        times: Map<string, { timeMinutes: number; stationsNumber: number }>
    ): Map<string, number> {
        // 確率を格納するマップを初期化
        const probabilities = new Map<string, number>();
        // 所要時間の合計を計算
        const totalTime = Array.from(times.values()).reduce(
            (sum, value) => sum + value.timeMinutes,
            0
        );

        // 各駅への所要時間の逆数で重みを計算
        times.forEach((value, stationCode) => {
            if (value.timeMinutes < Infinity) {
                probabilities.set(stationCode, value.timeMinutes / totalTime);
            } else {
                probabilities.set(stationCode, 0);
            }
        });
        return probabilities;
    }

    /**
     * 重み付きルーレットを使用して次の駅を選択
     * @param probabilities - 駅ごとの確率を含むマップ
     * @returns {string} 選択された駅のコード
     */
    static selectNextStationCode(probabilities: Map<string, number>): string {
        // ランダムな値を生成
        const randomValue = Math.random();
        // 確率の累積値を計算
        let cumulative = 0;

        // 累積確率から駅をランダムに選択
        for (const [stationCode, probability] of probabilities) {
            cumulative += probability;
            if (randomValue < cumulative) {
                return stationCode;
            }
        }

        // 確率の合計が1を超える場合、最後の駅を返す
        const lastStationCode = Array.from(probabilities.keys()).pop();
        if (lastStationCode) {
            return lastStationCode;
        } else {
            throw new Error("No stations available for selection");
        }
    }
}
