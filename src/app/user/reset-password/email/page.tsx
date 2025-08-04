"use client";

import { useState } from "react";
import { sendEmailForPasswordReset } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Box, Typography, Alert, Card, CardContent, Link, Stack } from "@mui/material";
import { Email } from "@mui/icons-material";
import { CustomTextField } from "@/components/base/CustomTextField";
import CustomButton from "@/components/base/CustomButton";

/**
 * パスワードリセット用メール送信ページコンポーネント
 * @returns {JSX.Element} - パスワードリセット用メール送信ページのコンポーネント
 */
const ResetPasswordEmailPage = (): React.JSX.Element => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const error = await sendEmailForPasswordReset(email);
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
                            メール送信完了
                        </Typography>

                        <Alert severity="success" sx={{ mt: 3, mb: 3 }}>
                            パスワードリセット用のメールを送信しました。
                            メールボックスをご確認ください。
                        </Alert>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            メールが届かない場合は、迷惑メールフォルダもご確認ください。
                        </Typography>

                        <CustomButton
                            color="primary"
                            variant="contained"
                            size="large"
                            fullWidth
                            onClick={() => router.push("/user/signin")}
                        >
                            ログイン画面に戻る
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
                        パスワードリセット
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                        sx={{ mb: 3 }}
                    >
                        登録されているメールアドレスを入力してください。
                        パスワードリセット用のリンクをお送りします。
                    </Typography>

                    <Box component="form" onSubmit={handleResetPassword} sx={{ mt: 3 }}>
                        <Stack spacing={3}>
                            <CustomTextField
                                type="email"
                                label="メールアドレス"
                                placeholder="sample@mail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                fullWidth
                                variant="outlined"
                                startAdornment={<Email />}
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
                                {loading ? "送信中..." : "リセットメールを送信"}
                            </CustomButton>
                        </Stack>
                    </Box>

                    <Box sx={{ mt: 3, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                            <Link href="/user/signin">ログイン画面に戻る</Link>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ResetPasswordEmailPage;
