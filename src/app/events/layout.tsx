"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { CircularProgress, Box, Typography } from "@mui/material";
import ApplicationBar from "@/components/composite/ApplicationBar";
import Header from "@/components/composite/Header";
import { NavigationBar } from "@/components/composite/NavigationBar";
import Footer from "@/components/composite/Footer";
import RoutemapDialog from "@/components/composite/RoutemapDialog";
import { useParams } from "next/navigation";
import { InitResponse } from "@/features/init/types";
import { Documents, Stations, Teams } from "@/generated/prisma";
import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";
import { UsersWithRelations } from "@/repositories/users/UsersRepository";
import { EventWithRelations } from "@/repositories/events/EventsRepository";
import { CommonConstants } from "@/constants/commonConstants";

/**
 * Contextの型定義
 * @property {Teams[]} teams - チームの配列
 * @property {Stations[]} stations - 駅の配列
 * @property {NearbyStationsWithRelations[]} nearbyStations - 近隣駅の配列
 * @property {boolean} isInitDataLoading - 初期データのロード状態
 * @property {string | null} contextError - コンテキストのエラー情報
 * @property {InitResponse | null} rawInitData - 元の初期化データ（必要に応じて）
 */
interface EventContextType {
    // 個別データ
    teams: Teams[];
    stations: Stations[];
    nearbyStations: NearbyStationsWithRelations[];
    documents: Documents[];
    user: UsersWithRelations | null;
    event: EventWithRelations | null;

    // 状態管理
    isInitDataLoading: boolean;
    contextError: string | null;

    // 元データも保持（必要に応じて）
    rawInitData: InitResponse | null;
}

// Context作成
const EventContext = createContext<EventContextType | undefined>(undefined);

// カスタムhook
export const useEventContext = () => {
    const context = useContext(EventContext);
    if (context === undefined) {
        throw new Error("useEventContext must be used within EventsLayout");
    }
    return context;
};

/**
 * EventContextのプロバイダープロパティ
 * @property {React.ReactNode} children - 子コンポーネント
 */
interface EventsLayoutProps {
    children: React.ReactNode;
}

/**
 * イベント関連のレイアウトコンポーネント
 * @param {React.ReactNode} children - 子コンポーネント
 * @returns {React.JSX.Element | null} レイアウトコンポーネント
 */
const EventsLayout: React.FC<EventsLayoutProps> = ({ children }: EventsLayoutProps): React.JSX.Element | null => {
    const { sbUser, isLoading: isAuthLoading } = useAuthGuard();
    const { eventCode } = useParams();

    // 個別データの state
    const [teams, setTeams] = useState<Teams[]>([]);
    const [stations, setStations] = useState<Stations[]>([]);
    const [nearbyStations, setNearbyStations] = useState<NearbyStationsWithRelations[]>([]);
    const [documents, setDocuments] = useState<Documents[]>([]);
    const [user, setUser] = useState<UsersWithRelations | null>(null);
    const [event, setEvent] = useState<EventWithRelations | null>(null);
    const [rawInitData, setRawInitData] = useState<InitResponse | null>(null);
    const [isInitDataLoading, setIsInitDataLoading] = useState(true);
    const [contextError, setContextError] = useState<string | null>(null);

    // 初期データ取得
    useEffect(() => {
        const fetchInitData = async () => {
            if (!eventCode || !sbUser) return;

            try {
                setIsInitDataLoading(true);
                setContextError(null);

                const response = await fetch(`/api/init?eventCode=${eventCode}&uuid=${sbUser.id}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const initData: InitResponse = data.data;

                // データを分けて設定
                setTeams(initData.teams || []);
                setStations(initData.stations || []);
                setNearbyStations(initData.nearbyStations || []);
                setDocuments(initData.documents || []);
                setUser(initData.user || null);
                setEvent(initData.event || null);

                setRawInitData(initData);
            } catch (err) {
                console.error("Error fetching init data:", err);
                setContextError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setIsInitDataLoading(false);
            }
        };

        fetchInitData();
    }, [eventCode, sbUser]);

    // 認証中の表示
    if (isAuthLoading) {
        return (
            <Box sx={{ textAlign: "center", margin: 4 }}>
                <CircularProgress size={40} color="primary" />
                <Typography variant="body1" sx={{ marginTop: 2 }}>
                    認証中...
                </Typography>
            </Box>
        );
    }

    // 未認証の場合
    if (!sbUser) {
        return null;
    }

    // Context値
    const contextValue: EventContextType = {
        teams,
        stations,
        nearbyStations,
        documents,
        user,
        event,
        rawInitData,
        isInitDataLoading,
        contextError,
    };

    return (
        <EventContext.Provider value={contextValue}>
            <ApplicationBar sbUser={sbUser} />
            <Box
                sx={{
                    flex: 1,
                    paddingTop: `calc(var(${CommonConstants.CSS.VARIABLES.APPLICATION_BAR_HEIGHT}, 64px))`,
                    paddingBottom: `calc(var(${CommonConstants.CSS.VARIABLES.NAVIGATION_BAR_HEIGHT}, 56px))`,
                    minHeight: "100vh",
                    boxSizing: "border-box",
                }}
            >
                <Header />
                <Box sx={{ flex: 1, padding: 1 }}>
                    {isInitDataLoading ? (
                        <Box sx={{ textAlign: "center", margin: 4 }}>
                            <CircularProgress size={40} color="primary" />
                        </Box>
                    ) : contextError ? (
                        <Box sx={{ textAlign: "center", margin: 4 }}>
                            <Typography variant="body1" color="error">
                                エラーが発生しました: {contextError}
                            </Typography>
                        </Box>
                    ) : (
                        children
                    )}
                </Box>
                <Footer />
            </Box>
            <RoutemapDialog />
            <NavigationBar />
        </EventContext.Provider>
    );
};

export default EventsLayout;
