import React, { useEffect, useState } from "react";
import TrainSymbolSVG from "../base/symbol/TrainSymbolSVG";
import BombiiSymbolSVG from "../base/symbol/BombiiSymbolSVG";
import StationSymbolSVG from "../base/symbol/StationSymbolSVG";
import { TeamData } from "@/types/TeamData";
import { GoalStationsWithRelations } from "@/repositories/goalStations/GoalStationsRepository";
import { Stations, Teams } from "@/generated/prisma";
import RouteListSymbolSVG from "../base/symbol/RouteListSymbolSVG";
import styles from "../../styles/Routemap.module.css";

/**
 * Routemapのプロパティ
 * @param {TeamData[]} teamData - チームデータの配列
 * @param {GoalStationsWithRelations | null} nextGoalStation - 次の目的駅データ
 * @param {Teams | null} bombiiTeam - Bombiiチームデータ
 * @param {Stations[]} stationsFromDB - データベースから取得した駅データの配列
 * @param {string[]} visibleTeams - 表示するチームコードの配列
 */
interface RoutemapProps {
    teamData: TeamData[];
    nextGoalStation: GoalStationsWithRelations | null;
    bombiiTeam: Teams | null;
    stationsFromDB: Stations[];
    configFileName?: string;
    visibleTeams?: string[];
    handleAspectRatio: (a: number, b: number) => void;
}

/**
 * config（線路）のプロパティ型定義
 * @param {string} d - パスのデータ
 * @param {string} stroke - 線の色
 * @param {string} strokeWidth - 線の太さ
 */
interface PathData {
    d: string;
    stroke: string;
    strokeWidth: string;
}

/**
 * config（路線）のプロパティ型定義
 * @param {string} name - 路線名
 * @param {string} visibility - 路線の表示状態
 * @param {PathData[]} paths - 路線を構成するパスの配列
 */
interface Route {
    name: string;
    visibility: string;
    paths: PathData[];
}

/**
 * config（駅マス）のプロパティ型定義
 * @param {string} x - x座標
 * @param {string} y - y座標
 * @param {string} width - 幅
 * @param {string} height - 高さ
 */
interface StationBox {
    x: string;
    y: string;
    width: string;
    height: string;
}

/**
 * config（駅名）のプロパティ型定義
 * @param {string} x - x座標
 * @param {string} y - y座標
 * @param {string} fontSize - フォントサイズ
 * @param {string} fontWeight - フォントの太さ
 * @param {string} fill - 文字の塗りつぶし色
 * @param {string} stroke - 文字の縁取り色
 * @param {string} [transform] - 変形（オプション）
 * @param {boolean} [multiline] - 複数行表示（オプション）
 */
interface StationText {
    x: string;
    y: string;
    fontSize: string;
    fontWeight: string;
    fill: string;
    stroke: string;
    transform?: string;
    multiline?: boolean;
}

/**
 * config（駅）のプロパティ型定義
 * @param {string} name - 駅名
 * @param {string} code - 駅コード
 * @param {StationBox} box - 駅マスのプロパティ
 * @param {StationText} text - 駅名のプロパティ
 */
interface Station {
    name: string;
    code: string;
    box: StationBox;
    text: StationText;
}

/**
 * RoutemapData型定義
 * @param {object} svgOverall - SVG全体のプロパティ
 * @param {string} svgOverall.viewBox - SVGのviewBox属性
 * @param {string} svgOverall.transform - SVGの変形属性
 * @param {object} stationBoxStyle - 駅マスのスタイルプロパティ
 * @param {string} stationBoxStyle.stroke - 駅マスの枠線の色
 * @param {string} stationBoxStyle.fill - 駅マスの塗りつぶし色
 * @param {string} stationBoxStyle.strokeWidth - 駅マスの枠線の太さ
 * @param {string} stationBoxStyle.strokeLineJoin - 駅マスの枠線の結合方法
 * @param {Route[]} routes - 路線データの配列
 * @param {Station[]} stations - 駅データの配列
 */
interface RoutemapConfig {
    svgOverall: {
        viewBox: string;
        transform: string;
    };
    stationBoxStyle: {
        stroke: string;
        fill: string;
        strokeWidth: string;
        strokeLineJoin: string;
    };
    routes: Route[];
    stations: Station[];
}

// ミッション設定駅マスの色
const MISSION_SET_COLOR = "orange";

/**
 * Routemapコンポーネント
 * @param {RoutemapProps} props - Routemapのプロパティ
 * @return {React.JSX.Element} - Routemapコンポーネント
 */
const Routemap: React.FC<RoutemapProps> = ({
    teamData,
    nextGoalStation,
    bombiiTeam,
    stationsFromDB,
    configFileName = "routemap-config",
    visibleTeams = [],
    handleAspectRatio,
}: RoutemapProps): React.JSX.Element => {
    const [config, setConfig] = useState<RoutemapConfig | null>(null);
    const [goalStationMapping, setGoalStationMapping] = useState<Station | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * 初期表示
     */
    useEffect(() => {
        /**
         * 路線図設定ファイルの読み込み
         */
        const loadRoutemapConfig = async () => {
            setIsLoading(true);
            try {
                const config = await import(`../../data/routemap/${configFileName}.json`);
                setConfig(config.default as RoutemapConfig);
                setGoalStationMapping(
                    config.default.stations.find((station: Station) => station.code === nextGoalStation?.stationCode) ||
                        null
                );
                handleAspectRatio(
                    config.default.svgOverall.viewBox.split(" ")[2],
                    config.default.svgOverall.viewBox.split(" ")[3]
                );
            } catch (error) {
                console.error(`Error loading routemap config: ${configFileName}.json`, error);
                try {
                    const fallbackModule = await import(`../../data/routemap/routemap-config.json`);
                    setConfig(fallbackModule.default as RoutemapConfig);
                } catch (fallbackError) {
                    console.error("Error loading fallback routemap config:", fallbackError);
                    setConfig(null);
                }
            }
            setIsLoading(false);
        };

        loadRoutemapConfig();
    }, [configFileName, nextGoalStation]);

    /**
     * 路線を描画
     * @param {Route} route - 路線データ
     * @param {number} index - 路線のインデックス
     * @return {React.JSX.Element} - 路線のSVG要素
     */
    const renderRoute = (route: Route, index: number): React.JSX.Element => (
        <g
            key={`${route.name}-${index}`}
            className="u"
            data-layer={route.name}
            style={{ visibility: route.visibility as "visible" | "hidden" }}
        >
            {route.paths.map((pathData, pathIndex) => (
                <path
                    key={`${route.name}-${pathIndex}`}
                    d={pathData.d}
                    stroke={pathData.stroke}
                    style={{
                        fill: "rgba(0, 0, 0, 0)",
                        strokeWidth: pathData.strokeWidth,
                        strokeLinejoin: "miter",
                    }}
                    data-mut=""
                />
            ))}
        </g>
    );

    return (
        <>
            {!isLoading && config && (
                <>
                    <svg
                        id="routemap"
                        className={styles.routemap}
                        viewBox={config.svgOverall.viewBox}
                        width="100%"
                        height="100%"
                        preserveAspectRatio="xMidYMid meet"
                        style={{
                            display: "block",
                            maxWidth: "100%",
                            maxHeight: "100%",
                        }}
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                    >
                        <defs className="ic"></defs>
                        <defs>
                            <marker
                                id="arrowhead"
                                viewBox="0 0 15 15"
                                refX="5"
                                refY="5"
                                markerWidth="5"
                                markerHeight="5"
                                orient="auto-start-reverse"
                            >
                                <path stroke="context-stroke" fill="context-stroke" d="M 0 0 L 10 5 L 0 10 z"></path>
                            </marker>
                            <TrainSymbolSVG />
                            <StationSymbolSVG />
                            <BombiiSymbolSVG />
                            <RouteListSymbolSVG />
                        </defs>
                        <g transform={config.svgOverall.transform}>
                            {/* 路線を描画 */}
                            {config.routes.map((route, index) => renderRoute(route, index))}

                            {/* 駅マスを描画 */}
                            <g className="u" data-layer="station-box" style={{ visibility: "visible" }}>
                                {config.stations.map((station, index) => {
                                    const stationFromDB = stationsFromDB.find((s) => s.stationCode === station.code);
                                    return (
                                        <rect
                                            key={`box-${index}`}
                                            id={`box-${station.code}`}
                                            x={station.box.x}
                                            y={station.box.y}
                                            width={station.box.width}
                                            height={station.box.height}
                                            style={{
                                                stroke: config.stationBoxStyle.stroke,
                                                fill: stationFromDB?.isMissionSet
                                                    ? MISSION_SET_COLOR
                                                    : config.stationBoxStyle.fill,
                                                strokeWidth: config.stationBoxStyle.strokeWidth,
                                                strokeLinejoin: config.stationBoxStyle.strokeLineJoin as "round",
                                            }}
                                            data-mut=""
                                        />
                                    );
                                })}
                            </g>

                            {/* 駅名を描画 */}
                            <g className="u" data-layer="station-name" style={{ visibility: "visible" }}>
                                {config.stations.map((station, index) => {
                                    // 改行が必要な長い駅名かどうかをチェック
                                    const shouldMultiline = station.text.multiline || station.name.length > 6;

                                    // 改行用に駅名を分割
                                    const getStationNameLines = (name: string) => {
                                        if (!shouldMultiline) return [name];

                                        // 特定の駅名の改行パターン
                                        if (name === "南町田グランベリーパーク") {
                                            return ["南町田", "グランベリーパーク"];
                                        }

                                        // デフォルトの改行ロジック（6文字以上で中間で分割）
                                        if (name.length > 6) {
                                            const mid = Math.ceil(name.length / 2);
                                            return [name.substring(0, mid), name.substring(mid)];
                                        }

                                        return [name];
                                    };

                                    const nameLines = getStationNameLines(station.name);
                                    const lineHeight = parseFloat(station.text.fontSize) * 0.8; // 行間調整

                                    return (
                                        <text
                                            key={`name-${index}`}
                                            x={station.text.x}
                                            y={station.text.y}
                                            fill={station.text.fill}
                                            stroke={station.text.stroke}
                                            strokeWidth={station.text.stroke === "rgba(0, 0, 0, 0)" ? 0 : 2}
                                            style={{
                                                fontFamily: "sans-serif",
                                                fontSize: station.text.fontSize,
                                                fontWeight: station.text.fontWeight,
                                                textAnchor: "start",
                                                dominantBaseline: "auto",
                                            }}
                                            transform={station.text.transform || undefined}
                                            data-mut=""
                                        >
                                            {nameLines.map((line, lineIndex) => (
                                                <tspan
                                                    key={lineIndex}
                                                    x={station.text.x}
                                                    dy={lineIndex === 0 ? "0em" : `${lineHeight}px`}
                                                >
                                                    {line}
                                                </tspan>
                                            ))}
                                        </text>
                                    );
                                })}
                            </g>

                            {/* use */}
                            <g
                                xmlns="http://www.w3.org/2000/svg"
                                className="u"
                                data-layer="team-train"
                                style={{ visibility: "visible" }}
                            >
                                {/* 目的駅 */}
                                <use
                                    id="goal-station"
                                    href="#station-symbol"
                                    x={goalStationMapping?.box.x || "0"}
                                    y={goalStationMapping?.box.y || "0"}
                                    width="150"
                                    height="150"
                                    transform="translate(-25, -45)"
                                />
                                {/* 路線 */}
                                <use id="route-on-routemap" href="#route-list-symbol" x="150" y="450" />
                                {/* チームの電車 */}
                                {teamData
                                    .filter((team) => visibleTeams.includes(team.teamCode))
                                    .map((team, index) => {
                                        const station = config.stations.find(
                                            (s) => s.code === team.transitStations.slice(0)[0].stationCode
                                        );
                                        if (!station) return null;

                                        return (
                                            <React.Fragment key={`team-${team.teamCode}`}>
                                                {/* 電車 */}
                                                <use
                                                    key={`train-${index}`}
                                                    id={`train-${team.teamCode}`}
                                                    href={"#train-symbol"}
                                                    x={station.box.x}
                                                    y={station.box.y}
                                                    width="200"
                                                    height="200"
                                                    transform="translate(-50, -50)"
                                                    fill={team.teamColor}
                                                />
                                                {/* ボンビー */}
                                                {bombiiTeam && team.teamCode === bombiiTeam?.teamCode && (
                                                    <use
                                                        id={`bombii-${team.teamCode}`}
                                                        href={"#bombii-symbol"}
                                                        x={station.box.x}
                                                        y={station.box.y}
                                                        width="400"
                                                        height="400"
                                                        transform="translate(-30, 100)"
                                                    />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                            </g>
                        </g>
                    </svg>
                </>
            )}
        </>
    );
};

export default Routemap;
