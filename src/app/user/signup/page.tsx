"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
    Box,
    Typography,
    Alert,
    Card,
    CardContent,
    Link,
    Stack,
} from "@mui/material";
import { Email, Lock } from "@mui/icons-material";
import { CustomTextField } from "@/components/base/CustomTextField";
import CustomButton from "@/components/base/CustomButton";

export default function SignUpPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const error = await signUp(email, password);
        if (error) {
            setError(error.message);
        } else {
            router.push("/user/signin");
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
                        登録
                    </Typography>

                    <Box component="form" onSubmit={handleSignUp} sx={{ mt: 3 }}>
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
                                color="success"
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                sx={{ mt: 3, py: 1.5 }}
                            >
                                登録
                            </CustomButton>
                        </Stack>
                    </Box>

                    <Box sx={{ mt: 3, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                            既にアカウントをお持ちの方は{" "}
                            <Link href="/user/signin">
                                ログイン
                            </Link>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
