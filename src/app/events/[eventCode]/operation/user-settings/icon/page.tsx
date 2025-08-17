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
import { useUserIcon } from "@/contexts/UserIconContext";
import supabase from "@/lib/supabase";

/**
 * ユーザーアイコン編集ページコンポーネント
 * @returns {JSX.Element} - ユーザーアイコン編集ページのコンポーネント
 */
const UserIconEditPage = (): React.JSX.Element => {
    const router = useRouter();
    const params = useParams();
    const eventCode = params.eventCode as string;

    const { user, isLoading: authLoading } = useAuthGuard();

    const { userIconUrl: contextIconUrl, updateUserIcon, refreshKey } = useUserIcon();
    const [currentIconUrl, setCurrentIconUrl] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");

    useEffect(() => {
        const loadCurrentIcon = async () => {
            if (user && user.uuid) {
                // コンテキストにアイコンがある場合はそれを使用、なければ動的に取得
                if (contextIconUrl) {
                    setCurrentIconUrl(contextIconUrl);
                } else {
                    try {
                        const userUtils = new UserUtils();
                        const iconUrl = await userUtils.getUserIconUrlWithExtension(user.uuid);
                        if (iconUrl) {
                            setCurrentIconUrl(iconUrl);
                            // コンテキストも更新
                            await updateUserIcon(user.uuid, iconUrl);
                        }
                    } catch (error) {
                        console.log("現在のアイコンの読み込みに失敗しました:", error);
                        // エラーが発生した場合はデフォルトアイコンを使用
                    }
                }
            }
        };

        loadCurrentIcon();
    }, [user, contextIconUrl, updateUserIcon]);

    // コンポーネントアンマウント時のクリーンアップ
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    /**
     * ファイル選択ハンドラー
     * @param {React.ChangeEvent<HTMLInputElement>} event - ファイル選択イベント
     * @returns {void} - ファイル選択処理
     */
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
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

    /**
     * アイコン保存ハンドラー
     * @returns {Promise<void>} - 非同期処理
     */
    const handleSave = async (): Promise<void> => {
        if (!selectedFile || !user || !user.uuid) {
            return;
        }

        setIsLoading(true);
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

                // アップロードされたファイルの拡張子を取得
                const uploadedExtension = selectedFile.name.split(".").pop();
                console.log("Uploaded file extension:", uploadedExtension);

                // Supabaseストレージの更新が確実に反映されるまで待機
                setTimeout(async () => {
                    try {
                        const userUtils = new UserUtils();
                        // 最新のアイコンURLを取得
                        const latestIconUrl = await userUtils.getUserIconUrlWithExtension(
                            user.uuid,
                            true
                        );

                        console.log("Retrieved latest icon URL:", latestIconUrl);

                        if (latestIconUrl) {
                            // コンテキストを使ってアプリ全体のアイコンを更新
                            await updateUserIcon(user.uuid, latestIconUrl);
                            // 現在のアイコンURLを新しいアイコンURLで更新
                            setCurrentIconUrl(latestIconUrl);
                            console.log("Successfully updated icon context");
                        } else {
                            // フォールバックとして元のURLを使用
                            console.log("Fallback to original icon URL:", iconUrl);
                            await updateUserIcon(user.uuid, iconUrl);
                            setCurrentIconUrl(iconUrl);
                        }
                    } catch (error) {
                        console.error("Failed to refresh icon:", error);
                        // エラーの場合は元のURLを使用
                        await updateUserIcon(user.uuid, iconUrl);
                        setCurrentIconUrl(iconUrl);
                    }
                }, 1000); // 1000ms（1秒）待ってから更新

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
            setIsLoading(false);
        }
    };

    /**
     * キャンセルハンドラー
     * @returns {void} - キャンセル処理
     */
    const handleCancel = (): void => {
        // プレビューURLのメモリリークを防ぐ
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setSelectedFile(null);
        setPreviewUrl("");
        setError("");
    };

    /**
     *  設定画面に戻るハンドラー
     * @return {void} - 設定画面に戻る処理
     */
    const handleGoBack = (): void => {
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
                            key={`${currentIconUrl}-${refreshKey}`} // URLとrefreshKeyでキャッシュ無効化
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
                                disabled={isLoading}
                            >
                                画像を選択
                            </Button>
                        </label>
                        <Typography variant="body2" display="block" sx={{ mt: 1 }}>
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
                                    disabled={isLoading}
                                    startIcon={
                                        isLoading ? <CircularProgress size={20} /> : <Save />
                                    }
                                    sx={{ flex: 1 }}
                                >
                                    {isLoading ? "保存中..." : "保存"}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleCancel}
                                    disabled={isLoading}
                                    startIcon={<Cancel />}
                                    sx={{ flex: 1 }}
                                >
                                    キャンセル
                                </Button>
                            </>
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

export default UserIconEditPage;
