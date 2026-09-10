"use client";

import React, { useEffect, useState } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Alert, CircularProgress, Box, Typography } from "@mui/material";
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
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ApplicationErrorHandler } from "@/error/errorHandler";
import { GameConstants } from "@/constants/gameConstants";
import { Converter } from "@/utils/converter";
import { EventContext, EventContextType } from "@/app/events/EventContext";

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
    const [event, setEvent] = useState<EventWithRelations>({} as EventWithRelations);
    const [versionPath, setVersionPath] = useState<string>(GameConstants.VERSION.V02.path);
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
                    throw ApplicationErrorFactory.createFromResponse(response);
                }

                const data = await response.json();
                const initData: InitResponse = data.data;

                // データを分けて設定
                setTeams(initData.teams || []);
                setStations(initData.stations || []);
                setNearbyStations(initData.nearbyStations || []);
                setDocuments(initData.documents || []);
                setUser(initData.user || null);
                setEvent(initData.event);
                setVersionPath(Converter.convertEventVersionToVersionPath(initData.event?.eventType?.version || GameConstants.VERSION.V02.number));

                setRawInitData(initData);
            } catch (err) {
                const appError = ApplicationErrorFactory.normalize(err);
                ApplicationErrorHandler.logError(appError);

                setContextError(appError.message);
            } finally {
                setIsInitDataLoading(false);
            }
        };

        fetchInitData();
    }, [eventCode, sbUser]);

    // 初期データを一度でも取得できたか。
    // 取得済みの場合は再取得中・再取得失敗でも children をアンマウントしない。
    // これによりページ側の state と購読（今後追加する Supabase Realtime の subscription を含む）が維持される。
    const hasInitDataLoaded = rawInitData !== null;

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
        versionPath,
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
                    // iOS PWA対応
                    position: "relative",
                    isolation: "isolate",
                }}
            >
                <Header />
                <Box sx={{ flex: 1, padding: 1 }}>
                    {!hasInitDataLoaded ? (
                        // 初回ロード中・初回ロード失敗時のみ children の代わりに全体表示を出す
                        isInitDataLoading ? (
                            <Box sx={{ textAlign: "center", margin: 4 }}>
                                <CircularProgress size={40} color="primary" />
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: "center", margin: 4 }}>
                                <Typography variant="body1" color="error">
                                    エラーが発生しました: {contextError}
                                </Typography>
                            </Box>
                        )
                    ) : (
                        // 取得済みデータがある場合は children を維持し、エラーは上部に併記するだけに留める
                        <>
                            {contextError && (
                                <Alert severity="error" sx={{ marginBottom: 2 }}>
                                    エラーが発生しました: {contextError}
                                </Alert>
                            )}
                            {children}
                        </>
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
