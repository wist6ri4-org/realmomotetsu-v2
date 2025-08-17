"use client";

import { useState } from "react";
import { changePassword } from "@/lib/auth";
import { useRouter, useParams } from "next/navigation";
import { Container, Paper, Typography, Alert, Box, CircularProgress, Button } from "@mui/material";
import { Lock, Save } from "@mui/icons-material";
import { CustomTextField } from "@/components/base/CustomTextField";
import CustomButton from "@/components/base/CustomButton";
import { useAuthGuard } from "@/hooks/useAuthGuard";

/**
 * ログイン中ユーザー用パスワード変更ページコンポーネント
 * @returns {JSX.Element} - パスワード変更ページのコンポーネント
 */
const ChangePasswordPage = (): React.JSX.Element => {
    const router = useRouter();
    const params = useParams();
    const eventCode = params.eventCode as string;

    const { sbUser, isLoading: authIsLoading } = useAuthGuard();

    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    /**
     * パスワード変更処理
     * @param {React.FormEvent} e - フォーム送信イベント
     * @returns {Promise<void>} - 非同期処理
     */
    const handleChangePassword = async (e: React.FormEvent): Promise<void> => {
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

        setIsLoading(true);

        try {
            const error = await changePassword(newPassword);
            if (error) {
                setError(error.message);
            } else {
                setIsSuccess(true);
            }
        } catch {
            setError("予期しないエラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 設定画面に戻る処理
     * @returns {void}
     */
    const handleGoBack = (): void => {
        router.push(`/events/${eventCode}/operation/user-settings`);
    };

    if (authIsLoading) {
        return (
            <Container maxWidth="sm" sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!sbUser) {
        return (
            <Container maxWidth="sm" sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
                    <Typography>ログインが必要です</Typography>
                </Paper>
            </Container>
        );
    }

    if (isSuccess) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        パスワード変更完了
                    </Typography>

                    <Alert severity="success" sx={{ mb: 3 }}>
                        パスワードが正常に変更されました。
                    </Alert>

                    <Button variant="text" onClick={handleGoBack} sx={{ mt: 2 }}>
                        設定画面に戻る
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    パスワード変更
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    セキュリティのため、現在のパスワードと新しいパスワードを入力してください。
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box
                    component="form"
                    onSubmit={handleChangePassword}
                    sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                >
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
                        disabled={isLoading}
                    />

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
                        disabled={isLoading}
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
                        disabled={isLoading}
                    />

                    <Box sx={{ display: "flex", gap: 2, justifyContent: "center", width: "100%" }}>
                        <CustomButton
                            color="primary"
                            type="submit"
                            variant="contained"
                            disabled={isLoading}
                            startIcon={isLoading ? <CircularProgress size={20} /> : <Save />}
                            sx={{ flex: 1 }}
                        >
                            {isLoading ? "変更中..." : "パスワードを変更"}
                        </CustomButton>
                    </Box>

                    <Button
                        variant="text"
                        onClick={handleGoBack}
                        disabled={isLoading}
                        sx={{ mt: 2 }}
                    >
                        設定画面に戻る
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default ChangePasswordPage;
