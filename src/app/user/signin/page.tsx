"use client";

import { useState, useEffect } from "react";
import { signIn } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { Box, Typography, Alert, Card, CardContent, Link, Stack, CircularProgress } from "@mui/material";
import { Email, Lock } from "@mui/icons-material";
import { CustomTextField } from "@/components/base/CustomTextField";
import CustomButton from "@/components/base/CustomButton";
import { GetUsersByUuidResponse } from "@/features/users/[uuid]/types";
import { Messages } from "@/constants/messages";

/**
 * サインインページコンポーネント
 * @returns {React.JSX.Element} - サインインページのコンポーネント
 */
const SignInPage: React.FC = (): React.JSX.Element => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    /**
     * 初期表示
     */
    useEffect(() => {
        setIsMounted(true);
    }, []);

    /**
     * ログイン処理を実行するハンドラー
     * @param {React.FormEvent} e - フォームの送信イベント
     * @return {Promise<void>} - ログイン処理の完了を示すPromise
     */
    const handleLogin = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { user, error } = await signIn(email, password);
            if (error) {
                setError(Messages.MSG_LOGIN_FAILED);
            } else {
                fetchEventCode(user as User).then((eventCode) => {
                    if (eventCode) {
                        router.push(`/events/${eventCode}/home`);
                    } else {
                        setError(Messages.MSG_ATTENDANCES_NOT_REGISTERED);
                    }
                });
            }
        } catch {
            setError(Messages.MSG_UNEXPECTED_ERROR);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 参加している最新のイベントコードを取得する
     * @param {User} sbUser - Supabaseのユーザーオブジェクト
     * @return {Promise<string>} - 参加しているイベントコード
     */
    const fetchEventCode = async (sbUser: User): Promise<string> => {
        try {
            setError(null);

            const uuid = sbUser.id;
            const response = await fetch(`/api/users/${uuid}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
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
            console.error("Error fetching event code:", error);
            setError(error instanceof Error ? error.message : "Unknown error");
            return "";
        }
    };

    // コンポーネントがマウントされるまでローディング表示
    if (!isMounted) {
        return (
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "50vh",
                }}
            >
                <CircularProgress size={40} color="primary" />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                py: 4,
                opacity: isMounted ? 1 : 0,
                transition: "opacity 0.3s ease-in-out",
            }}
        >
            <Card sx={{ width: "100%", maxWidth: 400 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom textAlign="center" color="primary">
                        ログイン
                    </Typography>

                    <Box component="form" onSubmit={handleLogin} sx={{ mt: 3 }}>
                        <Stack spacing={3}>
                            <CustomTextField
                                type="email"
                                label="メールアドレス"
                                placeholder="realmomotetsu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                fullWidth
                                variant="outlined"
                                disabled={isLoading}
                                startAdornment={<Email sx={{ fontSize: "2.4rem" }} />}
                            />

                            <CustomTextField
                                type="password"
                                label="パスワード"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                fullWidth
                                variant="outlined"
                                disabled={isLoading}
                                showPasswordToggle
                                startAdornment={<Lock sx={{ fontSize: "2.4rem" }} />}
                            />

                            {error && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <CustomButton
                                color="primary"
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={isLoading}
                                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                                sx={{ mt: 3, py: 1.5 }}
                            >
                                ログイン
                            </CustomButton>
                        </Stack>
                    </Box>

                    <Box sx={{ mt: 3, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                            アカウントをお持ちでない方は <Link href="/user/signup">登録</Link>
                        </Typography>
                    </Box>
                    <Box sx={{ mt: 3, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                            パスワードを忘れた方は <Link href="/user/reset-password/email">パスワードリセット</Link>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default SignInPage;
