"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Container,
    Paper,
    Typography,
    Button,
    Box,
    Avatar,
    Alert,
    CircularProgress,
} from "@mui/material";
import { PhotoCamera, Save, Cancel } from "@mui/icons-material";
import { UserUtils } from "@/utils/userUtils";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import supabase from "@/lib/supabase";

export default function UserIconEditPage() {
    const router = useRouter();
    const params = useParams();
    const eventCode = params.eventCode as string;

    const { user, isLoading: authLoading } = useAuthGuard();
    const [currentIconUrl, setCurrentIconUrl] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");

    useEffect(() => {
        const loadCurrentIcon = async () => {
            if (user && user.uuid) {
                try {
                    const userUtils = new UserUtils();
                    const iconUrl = await userUtils.getUserIconUrlWithExtension(user.uuid);
                    if (iconUrl) {
                        setCurrentIconUrl(iconUrl);
                    }
                } catch (error) {
                    console.log("現在のアイコンの読み込みに失敗しました:", error);
                    // エラーが発生した場合はデフォルトアイコンを使用
                }
            }
        };

        loadCurrentIcon();
    }, [user]);

    // コンポーネントアンマウント時のクリーンアップ
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // ファイルサイズチェック（5MB制限）
            if (file.size > 5 * 1024 * 1024) {
                setError("ファイルサイズが5MBを超えています。");
                return;
            }

            // ファイル形式チェック
            if (!file.type.startsWith("image/")) {
                setError("画像ファイルを選択してください。");
                return;
            }

            setSelectedFile(file);
            setError("");

            // プレビュー用のURLを作成
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleSave = async () => {
        if (!selectedFile || !user || !user.uuid) {
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const userUtils = new UserUtils();
            // アイコンをアップロード
            const iconUrl = await userUtils.uploadUserIcon(selectedFile, user.uuid);

            if (iconUrl) {
                // 現在のセッションからアクセストークンを取得
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (!session?.access_token) {
                    throw new Error("認証が必要です。ログインしてください。");
                }

                // データベースのユーザー情報を更新（アイコンURLを更新）
                const response = await fetch(`/api/users/${user.uuid}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        iconUrl: iconUrl,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(
                        `アイコンURLの更新に失敗しました: ${error.message || "Unknown error"}`
                    );
                }

                setSuccess("アイコンが更新されました。");

                // 現在のアイコンURLを新しいアイコンURLで更新
                setCurrentIconUrl(iconUrl);
                setSelectedFile(null);
                setPreviewUrl("");

                // プレビューURLのメモリリークを防ぐ
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                }
            }
        } catch (err) {
            console.error("Icon update error:", err);
            setError(err instanceof Error ? err.message : "アイコンの更新に失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        // プレビューURLのメモリリークを防ぐ
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setSelectedFile(null);
        setPreviewUrl("");
        setError("");
    };

    const handleBack = () => {
        router.push(`/events/${eventCode}/operation/user-settings`);
    };

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
                    アイコン設定
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

                <Box
                    sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}
                >
                    {/* 現在のアイコン */}
                    <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6" gutterBottom>
                            現在のアイコン
                        </Typography>
                        <Avatar
                            src={currentIconUrl || undefined}
                            sx={{
                                width: 120,
                                height: 120,
                                mx: "auto",
                                bgcolor: currentIconUrl ? "transparent" : "primary.main",
                                fontSize: "3rem",
                            }}
                        >
                            {!currentIconUrl && "👤"}
                        </Avatar>
                    </Box>

                    {/* プレビュー */}
                    {previewUrl && (
                        <Box sx={{ textAlign: "center" }}>
                            <Typography variant="h6" gutterBottom>
                                新しいアイコン（プレビュー）
                            </Typography>
                            <Avatar src={previewUrl} sx={{ width: 120, height: 120, mx: "auto" }} />
                        </Box>
                    )}

                    {/* ファイル選択 */}
                    <Box sx={{ textAlign: "center" }}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: "none" }}
                            id="icon-upload"
                        />
                        <label htmlFor="icon-upload">
                            <Button
                                variant="outlined"
                                component="span"
                                startIcon={<PhotoCamera />}
                                disabled={loading}
                            >
                                画像を選択
                            </Button>
                        </label>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            JPG、PNG形式で5MB以下のファイルを選択してください
                        </Typography>
                    </Box>

                    {/* アクションボタン */}
                    <Box sx={{ display: "flex", gap: 2, justifyContent: "center", width: "100%" }}>
                        {selectedFile && (
                            <>
                                <Button
                                    variant="contained"
                                    onClick={handleSave}
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                                    sx={{ flex: 1 }}
                                >
                                    {loading ? "保存中..." : "保存"}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleCancel}
                                    disabled={loading}
                                    startIcon={<Cancel />}
                                    sx={{ flex: 1 }}
                                >
                                    キャンセル
                                </Button>
                            </>
                        )}
                    </Box>

                    <Button variant="text" onClick={handleBack} disabled={loading} sx={{ mt: 2 }}>
                        設定画面に戻る
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}
