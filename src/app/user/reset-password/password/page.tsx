"use client";

import { useState, useEffect } from "react";
import { changePassword } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Typography, Alert, Card, CardContent, Stack } from "@mui/material";
import { Lock } from "@mui/icons-material";
import { CustomTextField } from "@/components/base/CustomTextField";
import CustomButton from "@/components/base/CustomButton";

/**
 * パスワード変更ページコンポーネント（リセット用）
 * @returns {JSX.Element} - パスワード変更ページのコンポーネント
 */
const ResetPasswordPage = (): React.JSX.Element => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // URLにエラーパラメータがある場合の処理
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (errorParam) {
            setError(errorDescription || "リンクが無効または期限切れです");
        }
    }, [searchParams]);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // パスワードの確認
        if (password !== confirmPassword) {
            setError("パスワードが一致しません");
            return;
        }

        // パスワードの強度チェック
        if (password.length < 6) {
            setError("パスワードは6文字以上で入力してください");
            return;
        }

        setLoading(true);

        try {
            const error = await changePassword(password);
            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
            }
        } catch {
            setError("予期しないエラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 4,
                }}
            >
                <Card sx={{ width: "100%", maxWidth: 400 }}>
                    <CardContent sx={{ p: 4, textAlign: "center" }}>
                        <Typography variant="h4" component="h1" gutterBottom color="primary">
                            パスワード変更完了
                        </Typography>

                        <Alert severity="success" sx={{ mt: 3, mb: 3 }}>
                            パスワードが正常に変更されました。
                        </Alert>

                        <CustomButton
                            color="primary"
                            variant="contained"
                            size="large"
                            fullWidth
                            onClick={() => router.push("/user/signin")}
                        >
                            ログイン画面へ
                        </CustomButton>
                    </CardContent>
                </Card>
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
            }}
        >
            <Card sx={{ width: "100%", maxWidth: 400 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography
                        variant="h4"
                        component="h1"
                        gutterBottom
                        textAlign="center"
                        color="primary"
                    >
                        新しいパスワード設定
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                        sx={{ mb: 3 }}
                    >
                        新しいパスワードを入力してください。
                    </Typography>

                    <Box component="form" onSubmit={handleChangePassword} sx={{ mt: 3 }}>
                        <Stack spacing={3}>
                            <CustomTextField
                                type="password"
                                label="新しいパスワード"
                                placeholder="新しいパスワードを入力"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                fullWidth
                                variant="outlined"
                                showPasswordToggle
                                startAdornment={<Lock />}
                            />

                            <CustomTextField
                                type="password"
                                label="パスワード確認"
                                placeholder="パスワードを再入力"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                fullWidth
                                variant="outlined"
                                showPasswordToggle
                                startAdornment={<Lock />}
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
                                disabled={loading}
                                sx={{ mt: 3, py: 1.5 }}
                            >
                                {loading ? "変更中..." : "パスワードを変更"}
                            </CustomButton>
                        </Stack>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ResetPasswordPage;
