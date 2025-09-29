"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import { Box, CircularProgress } from "@mui/material";
import { GetUsersByUuidResponse } from "@/features/users/[uuid]/types";
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ApplicationErrorHandler } from "@/error/errorHandler";

/**
 * ルートページコンポーネント
 * @returns {React.JSX.Element} - ルートページのコンポーネント
 */
const RootPage: React.FC = (): React.JSX.Element => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const handleInitialRoute = async () => {
            try {
                // ログイン状態をチェック
                const {
                    data: { user },
                    error,
                } = await supabase.auth.getUser();

                if (error || !user) {
                    // 未ログインの場合はサインインページへ
                    router.replace("/user/signin");
                    return;
                }

                // ログイン済みの場合、eventCodeを取得
                const eventCode = await fetchEventCode(user.id);

                if (eventCode) {
                    router.replace(`/events/${eventCode}/home`);
                } else {
                    // eventCodeが取得できない場合はサインインページへ
                    // （参加しているイベントがない状態）
                    router.replace("/user/signin");
                }
            } catch {
                router.replace("/user/signin");
            } finally {
                setIsLoading(false);
            }
        };

        handleInitialRoute();
    }, [router]);

    /**
     * 参加している最新のイベントコードを取得する（サインインページと同じロジック）
     * @param {string} userId - ユーザーのUUID
     * @return {Promise<string>} - 参加しているイベントコード
     */
    const fetchEventCode = async (userId: string): Promise<string> => {
        try {
            const response = await fetch(`/api/users/${userId}`);
            if (!response.ok) {
                throw ApplicationErrorFactory.createFromResponse(response);
            }

            const data: GetUsersByUuidResponse = (await response.json()).data as GetUsersByUuidResponse;

            const user = data.user || {};
            const attendances = user.attendances || [];

            // 参加しているイベントを開催日降順またはid降順でソート
            attendances.sort((a, b) => {
                if (a.event.startDate && b.event.startDate) {
                    return new Date(b.event.startDate).getTime() - new Date(a.event.startDate).getTime();
                } else {
                    if (!a.event.startDate && !b.event.startDate) {
                        return b.event.id - a.event.id;
                    } else if (!a.event.startDate) {
                        return 1;
                    } else if (!b.event.startDate) {
                        return -1;
                    }
                    return 0;
                }
            });

            return attendances.shift()?.eventCode || "";
        } catch (error) {
            const appError = ApplicationErrorFactory.normalize(error);
            ApplicationErrorHandler.logError(appError, "WARN");
            return "";
        }
    };

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                }}
            >
                <CircularProgress size={40} color="primary" />
            </Box>
        );
    }

    // リダイレクト処理中は何も表示しない
    return <></>;
};

export default RootPage;
