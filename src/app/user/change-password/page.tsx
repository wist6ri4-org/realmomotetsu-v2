"use client";

import { useState } from "react";
import { changePassword } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Box, Typography, Alert, Card, CardContent, Stack, Divider } from "@mui/material";
import { Lock } from "@mui/icons-material";
import { CustomTextField } from "@/components/base/CustomTextField";
import CustomButton from "@/components/base/CustomButton";
import { useAuthGuard } from "@/hooks/useAuthGuard";

/**
 * ログイン中ユーザー用パスワード変更ページコンポーネント
 * @returns {JSX.Element} - パスワード変更ページのコンポーネント
 */
const ChangePasswordPage = (): React.JSX.Element => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // 認証ガード
    const { sbUser, user, isLoading: authLoading } = useAuthGuard();

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // パスワードの確認
        if (newPassword !== confirmPassword) {
            setError("新しいパスワードが一致しません");
            return;
        }

        // パスワードの強度チェック
        if (newPassword.length < 6) {
            setError("パスワードは6文字以上で入力してください");
            return;
        }

        // 現在のパスワードと新しいパスワードが同じかチェック
        if (currentPassword === newPassword) {
            setError("現在のパスワードと同じパスワードは設定できません");
            return;
        }

        setLoading(true);

        try {
            const error = await changePassword(newPassword);
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

    const handleGoBack = () => {
        router.back();
    };

    if (authLoading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 4,
                }}
            >
                <Typography>読み込み中...</Typography>
            </Box>
        );
    }

    if (!sbUser) {
        return (
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 4,
                }}
            >
                <Typography>ログインが必要です</Typography>
            </Box>
        );
    }

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

                        <Stack spacing={2}>
                            <CustomButton
                                color="primary"
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={handleGoBack}
                            >
                                戻る
                            </CustomButton>
                        </Stack>
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
                        パスワード変更
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                        sx={{ mb: 3 }}
                    >
                        セキュリティのため、現在のパスワードと新しいパスワードを入力してください。
                    </Typography>

                    <Box component="form" onSubmit={handleChangePassword} sx={{ mt: 3 }}>
                        <Stack spacing={3}>
                            <CustomTextField
                                type="password"
                                label="現在のパスワード"
                                placeholder="現在のパスワードを入力"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                fullWidth
                                variant="outlined"
                                showPasswordToggle
                                startAdornment={<Lock />}
                            />
                            <Divider />
                            <CustomTextField
                                type="password"
                                label="新しいパスワード"
                                placeholder="新しいパスワードを入力"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                fullWidth
                                variant="outlined"
                                showPasswordToggle
                                startAdornment={<Lock />}
                            />

                            <CustomTextField
                                type="password"
                                label="新しいパスワード確認"
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

                            <Stack spacing={2}>
                                <CustomButton
                                    color="primary"
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    disabled={loading}
                                    sx={{ py: 1.5 }}
                                >
                                    {loading ? "変更中..." : "パスワードを変更"}
                                </CustomButton>

                                <CustomButton
                                    color="secondary"
                                    variant="outlined"
                                    size="large"
                                    fullWidth
                                    onClick={handleGoBack}
                                >
                                    キャンセル
                                </CustomButton>
                            </Stack>
                        </Stack>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ChangePasswordPage;
