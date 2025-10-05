"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Typography, Alert, Card, CardContent, Link, CircularProgress } from "@mui/material";
import { CheckCircle, Error as ErrorIcon } from "@mui/icons-material";
import CustomButton from "@/components/base/CustomButton";

/**
 * メールアドレス確認ページコンポーネント
 * @returns {React.JSX.Element} - メールアドレス確認ページのコンポーネント
 */
const ConfirmEmailPage = (): React.JSX.Element => {
    const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    /**
     * 初期表示
     */
    useEffect(() => {
        setIsMounted(true);

        // URLパラメータから確認結果を判定
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (errorParam) {
            // エラーがある場合は失敗
            setIsSuccess(false);
            setError(errorDescription || "メールアドレスの確認に失敗しました");
        } else {
            // エラーがない場合は成功（Supabaseが自動的に確認処理を実行済み）
            setIsSuccess(true);
        }
    }, [searchParams]);

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

    // 確認失敗の場合
    if (!isSuccess) {
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
                        <ErrorIcon sx={{ fontSize: 48, color: "error.main", mb: 2 }} />

                        <Typography variant="h4" component="h1" gutterBottom color="error">
                            確認に失敗しました
                        </Typography>

                        <Alert severity="error" sx={{ mt: 3, mb: 3 }}>
                            {error || "メールアドレスの確認に失敗しました"}
                        </Alert>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            リンクが無効または期限切れの可能性があります。
                            <br />
                            確認メールの再送信をお試しください。
                        </Typography>

                        <CustomButton
                            color="warning"
                            variant="contained"
                            size="large"
                            fullWidth
                            onClick={() => router.push("/user/resend-confirmation")}
                            sx={{ mb: 2 }}
                        >
                            確認メールを再送信
                        </CustomButton>

                        <CustomButton
                            color="primary"
                            variant="outlined"
                            size="large"
                            fullWidth
                            onClick={() => router.push("/user/signup")}
                            sx={{ mb: 2 }}
                        >
                            新規登録画面へ
                        </CustomButton>

                        <Box sx={{ mt: 3, textAlign: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                                <Link href="/user/signin">ログイン画面に戻る</Link>
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    // 確認成功の場合
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
                    <CheckCircle sx={{ fontSize: 48, color: "success.main", mb: 2 }} />

                    <Typography variant="h4" component="h1" gutterBottom color="primary">
                        確認完了
                    </Typography>

                    <Alert severity="success" sx={{ mt: 3, mb: 3, textAlign: "left" }}>
                        メールアドレスの確認が完了しました。
                        <br />
                        管理者による参加登録後にログインが可能になります。しばらくお待ち下さい。
                    </Alert>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: "left" }}>
                        登録いただいたメールアドレスとパスワードでログインできます。
                    </Typography>

                    <CustomButton
                        color="primary"
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={() => router.push("/user/signin")}
                        sx={{ py: 1.5 }}
                    >
                        ログイン画面へ
                    </CustomButton>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ConfirmEmailPage;