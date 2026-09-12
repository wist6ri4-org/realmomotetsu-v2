"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Alert, Card, CardContent, Link, Stack, CircularProgress } from "@mui/material";
import { Email } from "@mui/icons-material";
import { CustomTextField } from "@/components/base/CustomTextField";
import CustomButton from "@/components/base/CustomButton";
import supabase from "@/lib/supabase";

/**
 * 確認メール再送信ページコンポーネント
 * @returns {React.JSX.Element} - 確認メール再送信ページのコンポーネント
 */
const ResendConfirmationPage = (): React.JSX.Element => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    /**
     * 初期表示
     */
    useEffect(() => {
        setIsMounted(true);
    }, []);

    /**
     * 確認メール再送信処理
     */
    const handleResendConfirmation = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/user/confirm-email`
                }
            });

            if (resendError) {
                console.error("Resend confirmation error:", resendError);

                // エラーメッセージの詳細化
                if (resendError.message.includes("User not found") || resendError.message.includes("already confirmed")) {
                    setError("このメールアドレスは登録されていないか、既に確認済みです。");
                } else if (resendError.message.includes("rate limit")) {
                    setError("送信回数が制限を超えています。しばらく時間をおいてから再度お試しください。");
                } else {
                    setError(resendError.message || "確認メールの再送信に失敗しました");
                }
            } else {
                setSuccess(true);
            }
        } catch (err) {
            console.error("Unexpected error during resend:", err);
            setError("予期しないエラーが発生しました");
        } finally {
            setLoading(false);
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
                <CircularProgress size={40} color="warning" />
            </Box>
        );
    }

    // 再送信成功時の表示
    if (success) {
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
                    <CardContent sx={{ p: 4, textAlign: "center" }}>
                        <Typography variant="h4" component="h1" gutterBottom color="success.main">
                            再送信完了
                        </Typography>

                        <Alert severity="success" sx={{ mt: 3, mb: 3 }}>
                            確認メールを再送信しました。
                            <br />
                            メールボックスをご確認ください。
                        </Alert>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            メール内のリンクをクリックして登録を完了してください。
                            <br />
                            メールが届かない場合は、迷惑メールフォルダもご確認ください。
                        </Typography>

                        <Stack spacing={2}>
                            <CustomButton
                                color="primary"
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={() => router.push("/user/signin")}
                            >
                                ログイン画面へ
                            </CustomButton>

                            <CustomButton
                                color="secondary"
                                variant="outlined"
                                size="large"
                                fullWidth
                                onClick={() => {
                                    setSuccess(false);
                                    setEmail("");
                                }}
                            >
                                別のメールアドレスで再送信
                            </CustomButton>
                        </Stack>

                        <Box sx={{ mt: 3, textAlign: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                                <Link href="/user/signup">新規登録</Link>
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    // メールアドレス入力フォーム
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
                    <Typography variant="h4" component="h1" gutterBottom textAlign="center" color="warning">
                        確認メール再送信
                    </Typography>

                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
                        確認メールが届かない場合や期限切れの場合は、
                        <br />
                        メールアドレスを入力して再送信してください。
                    </Typography>

                    <Box component="form" onSubmit={handleResendConfirmation} sx={{ mt: 3 }}>
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
                                disabled={loading}
                                startAdornment={<Email sx={{ fontSize: "2.4rem" }} />}
                            />

                            {error && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <Typography variant="body2" color="text.secondary">
                                確認メールの有効期限は24時間です。
                                <br />
                                期限切れの場合は、こちらから再送信してください。
                            </Typography>

                            <CustomButton
                                color="warning"
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                                sx={{ mt: 3, py: 1.5 }}
                            >
                                {loading ? "送信中..." : "確認メールを再送信"}
                            </CustomButton>
                        </Stack>
                    </Box>

                    <Box sx={{ mt: 3, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                            <Link href="/user/signin">ログイン画面に戻る</Link>
                        </Typography>
                    </Box>

                    <Box sx={{ mt: 2, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                            アカウントをお持ちでない方は <Link href="/user/signup">新規登録</Link>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ResendConfirmationPage;