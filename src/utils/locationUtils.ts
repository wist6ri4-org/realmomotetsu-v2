import { Stations } from "@/generated/prisma";

export default class LocationUtils {
    static readonly R = 6371; // 地球の半径 (km)
    static readonly NUMBER_OF_STATIONS = 1; // 取得する駅の数

    /**
     * 指定された位置から近い駅を計算する
     * @param {Stations[]} stations - 駅情報の配列
     * @param {number} latitude - 検索する位置の緯度
     * @param {number} longitude - 検索する位置の経度
     * @return {Array<{ stationCode: string; distance: number }>} 近い駅の配列
     */
    static calculate(
        stations: Stations[],
        latitude: number,
        longitude: number
    ): Array<{ stationCode: string; distance: number }> {
        // 駅情報を位置情報グラフに変換
        const locationGraph = this.convertToLocationGraph(stations);

        // 指定された位置から近い駅を検索
        return this.findNearbyStations(locationGraph, latitude, longitude, this.NUMBER_OF_STATIONS);
    }

    /**
     * 駅情報の配列を位置情報グラフに変換する
     * @param {Stations[]} stations - 駅情報の配列
     * @return {Map<string, { latitude: number; longitude: number }>} 位置情報グラフ
     */
    static convertToLocationGraph(
        stations: Stations[]
    ): Map<string, { latitude: number; longitude: number }> {
        const graph: Map<string, { latitude: number; longitude: number }> = new Map();

        stations.forEach((station) => {
            if (station.latitude && station.longitude) {
                graph.set(station.stationCode, {
                    latitude: station.latitude,
                    longitude: station.longitude,
                });
            }
        });

        return graph;
    }

    /**
     * 指定された位置から近い駅を検索する
     * @param {Map<string, { latitude: number; longitude: number }>} locationGraph - 位置情報グラフ
     * @param {number} latitude - 検索する位置の緯度
     * @param {number} longitude - 検索する位置の経度
     * @param {number} numberOfStations - 取得する駅の数
     * @return {Array<{ stationCode: string; distance: number }>} 近い駅の配列
     */
    static findNearbyStations(
        locationGraph: Map<string, { latitude: number; longitude: number }>,
        latitude: number,
        longitude: number,
        numberOfStations: number
    ): Array<{ stationCode: string; distance: number }> {
        const distances: Array<{ stationCode: string; distance: number }> = [];

        for (const [stationCode, location] of locationGraph.entries()) {
            const distance = this.calculateDistance(
                latitude,
                longitude,
                location.latitude,
                location.longitude
            );
            distances.push({
                stationCode: stationCode,
                distance: distance,
            });
            distances.sort((a, b) => a.distance - b.distance);
        }

        // 距離でソートして、近い順に並べる
        distances.sort((a, b) => a.distance - b.distance);

        // 指定された数の駅を返す
        return distances.slice(0, numberOfStations);
    }

    /**
     * 2点間の距離を計算する
     * @param {number} lat1 - 1点目の緯度
     * @param {number} lon1 - 1点目の経度
     * @param {number} lat2 - 2点目の緯度
     * @param {number} lon2 - 2点目の経度
     * @return {number} 2点間の距離 (km)
     */
    static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) *
                Math.cos(this.deg2rad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return this.R * c; // 距離をkmで返す
    }

    /**
     * 度数からラジアンに変換する
     * @param {number} deg - 度数
     * @returns {number} ラジアン
     */
    private static deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}
