"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import { Box, CircularProgress } from "@mui/material";
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ApplicationErrorHandler } from "@/error/errorHandler";
import { UserUtils } from "@/utils/userUtils";

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
            return await UserUtils.fetchEventCode(userId);
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
