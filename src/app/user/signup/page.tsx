"use client";

import { useState, useEffect } from "react";
import { signUp } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Box, Typography, Alert, Card, CardContent, Link, Stack, CircularProgress, Divider } from "@mui/material";
import { Email, Lock, Person } from "@mui/icons-material";
import { CustomTextField } from "@/components/base/CustomTextField";
import CustomButton from "@/components/base/CustomButton";
import { Messages } from "@/constants/messages";

/**
 * サインアップページコンポーネント
 * @return {React.JSX.Element} - サインアップページのコンポーネント
 */
const SignUpPage: React.FC = (): React.JSX.Element => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [nickname, setNickname] = useState<string>("");
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
     * サインアップ処理を実行するハンドラー
     * @param {React.FormEvent} e - フォームの送信イベント
     * @return {Promise<void>} - サインアップ処理の完了を示すPromise
     */
    const handleSignUp = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (password !== confirmPassword) {
            setError(Messages.MSG_PASSWORD_NOT_MATCH);
            return;
        }

        try {
            const error = await signUp(email, password, nickname);
            if (error) {
                setError(error.message);
            } else {
                router.push("/user/signin");
            }
        } catch {
            setError(Messages.MSG_UNEXPECTED_ERROR);
        } finally {
            setIsLoading(false);
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
                        登録
                    </Typography>

                    <Box component="form" onSubmit={handleSignUp} sx={{ mt: 3 }}>
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
                            <CustomTextField
                                type="password"
                                label="パスワード（確認用）"
                                placeholder="********"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                fullWidth
                                variant="outlined"
                                disabled={isLoading}
                                showPasswordToggle
                                startAdornment={<Lock sx={{ fontSize: "2.4rem" }} />}
                            />
                            <Divider />
                            <CustomTextField
                                type="text"
                                label="ニックネーム"
                                placeholder="桃鉄たろう"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                required
                                fullWidth
                                variant="outlined"
                                disabled={isLoading}
                                startAdornment={<Person sx={{ fontSize: "2.4rem" }} />}
                            />

                            {error && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {error}
                                </Alert>
                            )}
                            <Typography variant="body2" color="text.secondary">
                                登録ボタンを押すとメールアドレス確認用のメールが送信されます。
                                <br />
                                メール内のリンクをクリックして登録を完了してください。
                            </Typography>

                            <CustomButton
                                color="warning"
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={isLoading}
                                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                                sx={{ mt: 3, py: 1.5 }}
                            >
                                {isLoading ? "登録中..." : "登録"}
                            </CustomButton>
                        </Stack>
                    </Box>

                    <Box sx={{ mt: 3, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                            既にアカウントをお持ちの方は <Link href="/user/signin">ログイン</Link>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default SignUpPage;
