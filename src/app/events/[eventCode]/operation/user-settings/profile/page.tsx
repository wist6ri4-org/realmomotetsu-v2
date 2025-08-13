"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
    Divider,
} from "@mui/material";
import { Save, Cancel, Email, Person } from "@mui/icons-material";
import { UserUtils } from "@/utils/userUtils";
import { useAuthGuard } from "@/hooks/useAuthGuard";

/**
 * ログイン中ユーザーのプロフィール編集ページコンポーネント
 * @returns {JSX.Element} - プロフィール編集ページのコンポーネント
 */
const UserProfileEditPage = (): React.JSX.Element => {
    const router = useRouter();
    const params = useParams();
    const eventCode = params.eventCode as string;

    const { user, isLoading: authLoading } = useAuthGuard();

    const [nickname, setNickname] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [originalNickname, setOriginalNickname] = useState<string>("");
    const [originalEmail, setOriginalEmail] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");

    /**
     * ユーザー情報の初期化
     */
    useEffect(() => {
        if (user) {
            setNickname(user.nickname || "");
            setEmail(user.email || "");
            setOriginalNickname(user.nickname || "");
            setOriginalEmail(user.email || "");
        }
    }, [user]);

    /**
     * ニックネーム保存ハンドラー
     * @returns {Promise<void>} - 非同期処理
     */
    const handleSaveNickname = async (): Promise<void> => {
        if (!user || !user.uuid || nickname === originalNickname) {
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const userUtils = new UserUtils();
            await userUtils.updateUserNickname(user.uuid, nickname);

            setSuccess("ニックネームが更新されました。");
            setOriginalNickname(nickname);
        } catch (err) {
            console.error("Nickname update error:", err);
            setError(err instanceof Error ? err.message : "ニックネームの更新に失敗しました。");
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * メールアドレス保存ハンドラー
     * @returns {Promise<void>} - 非同期処理
     */
    const handleSaveEmail = async (): Promise<void> => {
        if (!user || !user.uuid || email === originalEmail) {
            return;
        }

        // メールアドレスのバリデーション
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("有効なメールアドレスを入力してください。");
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const userUtils = new UserUtils();
            await userUtils.updateUserEmail(user.uuid, email);

            setSuccess("メールアドレスが更新されました。確認メールが送信されました。");
            setOriginalEmail(email);
        } catch (err) {
            console.error("Email update error:", err);
            setError(err instanceof Error ? err.message : "メールアドレスの更新に失敗しました。");
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 変更を取り消す処理
     * @returns {void}
     */
    const handleCancel = (): void => {
        setNickname(originalNickname);
        setEmail(originalEmail);
        setError("");
        setSuccess("");
    };

    /**
     * 設定画面に戻る処理
     * @returns {void}
     */
    const handleGoBack = (): void => {
        router.push(`/events/${eventCode}/operation/user-settings`);
    };

    const hasNicknameChanged = nickname !== originalNickname;
    const hasEmailChanged = email !== originalEmail;
    const hasAnyChange = hasNicknameChanged || hasEmailChanged;

    if (authLoading) {
        return (
            <Container maxWidth="sm" sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    プロフィール設定
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {/* ニックネーム設定 */}
                    <Box>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                            <Person />
                            ニックネーム
                        </Typography>
                        <TextField
                            fullWidth
                            label="ニックネーム"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            disabled={isLoading}
                            placeholder="ニックネームを入力してください"
                            variant="outlined"
                            sx={{ mb: 2 }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleSaveNickname}
                            disabled={isLoading || !hasNicknameChanged || !nickname.trim()}
                            startIcon={isLoading ? <CircularProgress size={20} /> : <Save />}
                            fullWidth
                        >
                            {isLoading ? "更新中..." : "ニックネームを更新"}
                        </Button>
                    </Box>

                    <Divider />

                    {/* メールアドレス設定 */}
                    <Box>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                            <Email />
                            メールアドレス
                        </Typography>
                        <TextField
                            fullWidth
                            label="メールアドレス"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            placeholder="sample@example.com"
                            variant="outlined"
                            sx={{ mb: 2 }}
                        />
                        <Alert severity="info" sx={{ mb: 2 }}>
                            メールアドレスを変更すると、新しいアドレスに確認メールが送信されます。
                            確認完了まで元のアドレスでログインできます。
                        </Alert>
                        <Button
                            variant="contained"
                            onClick={handleSaveEmail}
                            disabled={isLoading || !hasEmailChanged || !email.trim()}
                            startIcon={isLoading ? <CircularProgress size={20} /> : <Save />}
                            fullWidth
                        >
                            {isLoading ? "更新中..." : "メールアドレスを更新"}
                        </Button>
                    </Box>

                    {/* アクションボタン */}
                    <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 2 }}>
                        {hasAnyChange && (
                            <Button
                                variant="outlined"
                                onClick={handleCancel}
                                disabled={isLoading}
                                startIcon={<Cancel />}
                                sx={{ flex: 1 }}
                            >
                                変更を取り消し
                            </Button>
                        )}
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

export default UserProfileEditPage;
