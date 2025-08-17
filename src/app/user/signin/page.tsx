"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { Box, Typography, Alert, Card, CardContent, Link, Stack } from "@mui/material";
import { Email, Lock } from "@mui/icons-material";
import { CustomTextField } from "@/components/base/CustomTextField";
import CustomButton from "@/components/base/CustomButton";

/**
 * サインインページコンポーネント
 * @returns {JSX.Element} - サインインページのコンポーネント
 */
const SignInPage = (): React.JSX.Element => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const { user, error } = await signIn(email, password);
        if (error) {
            setError(error.message);
        } else {
            fetchEventCode(user as User).then((eventCode) => {
                if (eventCode) {
                    router.push(`/events/${eventCode}/home`);
                } else {
                    setError("Event code not found for user");
                }
            });
        }
    };

    const fetchEventCode = async (sbUser: User): Promise<string> => {
        try {
            setError(null);

            const uuid = sbUser.id;
            const response = await fetch(`/api/users/${uuid}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const user = data?.data?.user || data?.user || {};

            return user.attendances[0].eventCode;
        } catch (error) {
            console.error("Error fetching event code:", error);
            setError(error instanceof Error ? error.message : "Unknown error");
            return "";
        }
    };

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
                        ログイン
                    </Typography>

                    <Box component="form" onSubmit={handleLogin} sx={{ mt: 3 }}>
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

                            <CustomTextField
                                type="password"
                                label="パスワード"
                                placeholder="*****"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                                sx={{ mt: 3, py: 1.5 }}
                            >
                                ログイン
                            </CustomButton>
                        </Stack>
                    </Box>

                    <Box sx={{ mt: 3, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                            アカウントをお持ちでない方は{" "}
                            <Link href="/user/signup">サインアップ</Link>
                        </Typography>
                    </Box>
                    <Box sx={{ mt: 3, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                            パスワードを忘れた方は{" "}
                            <Link href="/user/reset-password/email">パスワードリセット</Link>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default SignInPage;
