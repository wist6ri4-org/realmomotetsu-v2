"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Typography, Card, CardContent, CardActionArea, Avatar, Grid, CircularProgress } from "@mui/material";
import {
    Lock as LockIcon,
    Settings as SettingsIcon,
    AccountCircle as AccountCircleIcon,
} from "@mui/icons-material";
import PageTitle from "@/components/base/PageTitle";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useUserIcon } from "@/contexts/UserIconContext";

interface SettingsMenuItem {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
    disabled?: boolean;
}

/**
 * ユーザー設定ページコンポーネント
 * @returns {JSX.Element} - ユーザー設定ページのコンポーネント
 */
const UserSettingsPage = (): React.JSX.Element => {
    const router = useRouter();
    const params = useParams();
    const eventCode = params.eventCode as string;

    // 認証ガード
    const { sbUser, user, isLoading: authLoading } = useAuthGuard();

    // ユーザーアイコンのコンテキストを使用
    const { userIconUrl, updateUserIcon, refreshKey } = useUserIcon();

    // ユーザーアイコンURLを取得
    useEffect(() => {
        const loadUserIcon = async () => {
            if (sbUser?.id) {
                await updateUserIcon(sbUser.id);
            }
        };

        loadUserIcon();
    }, [sbUser?.id, updateUserIcon]);

    // ページがフォーカスされたときにアイコンを再読み込み（アイコン変更後の反映のため）
    // useEffect(() => {
    //     const handleFocus = () => {
    //         if (sbUser?.id) {
    //             updateUserIcon(sbUser.id);
    //         }
    //     };

    //     window.addEventListener("focus", handleFocus);
    //     return () => window.removeEventListener("focus", handleFocus);
    // }, [sbUser?.id, updateUserIcon]);

    const settingsMenuItems: SettingsMenuItem[] = [
        {
            title: "プロフィール設定",
            description: "プロフィールの設定",
            icon: <SettingsIcon sx={{ fontSize: "1.8rem" }} />,
            color: "#4CAF50",
            onClick: () => {
                router.push(`/events/${eventCode}/operation/user-settings/profile`);
            },
        },
        {
            title: "パスワード変更",
            description: "アカウントのパスワードを変更",
            icon: <LockIcon sx={{ fontSize: "1.8rem" }} />,
            color: "#F44336",
            onClick: () => {
                router.push(`/events/${eventCode}/operation/user-settings/change-password`);
            },
        },
        {
            title: "アイコン設定",
            description: "アイコンの設定",
            icon: <AccountCircleIcon sx={{ fontSize: "1.8rem" }} />,
            color: "#2196F3",
            onClick: () => {
                router.push(`/events/${eventCode}/operation/user-settings/icon`);
            },
        },
    ];

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
                <CircularProgress />
            </Box>
        );
    }

    if (!sbUser || !user) {
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

    return (
        <>
            <Box>
                <PageTitle
                    title="ユーザー設定"
                    icon={<SettingsIcon sx={{ fontSize: "3.5rem", marginRight: 1 }} />}
                />
            </Box>

            {/* ユーザー情報表示 */}
            <Box
                sx={{
                    mb: 4,
                    p: 3,
                    bgcolor: "white",
                    border: "1px solid",
                    borderColor: "grey.200",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                        key={`${userIconUrl}-${refreshKey}`} // URLとrefreshKeyの両方でキャッシュを無効化
                        src={userIconUrl || undefined}
                        sx={{
                            width: 56,
                            height: 56,
                            mr: 3,
                            bgcolor: userIconUrl ? "transparent" : "primary.main",
                        }}
                    >
                        {!userIconUrl && <AccountCircleIcon sx={{ fontSize: "2rem" }} />}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="h5"
                            component="div"
                            sx={{
                                fontWeight: "bold",
                                mb: 0.5,
                                color: "text.primary",
                            }}
                        >
                            {user?.nickname || "ユーザー"}
                        </Typography>
                        <Box
                            sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}
                        >
                            <Box
                                sx={{
                                    px: 1.5,
                                    py: 0.25,
                                    bgcolor: "primary.50",
                                    borderRadius: 1,
                                    border: "1px solid",
                                    borderColor: "primary.200",
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    color="primary.main"
                                    sx={{ fontWeight: "medium" }}
                                >
                                    {user && user.attendances.length > 0
                                        ? `${user.attendances.length}イベント参加中`
                                        : "未参加"}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        mt: 2,
                        lineHeight: 1.6,
                    }}
                >
                    アカウントに関する設定を管理できます。
                    セキュリティのため、重要な変更を行う際は現在のパスワードが必要です。
                </Typography>
            </Box>

            {/* 設定メニュー */}
            <Grid container spacing={2}>
                {settingsMenuItems.map((item, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                        <Card
                            sx={{
                                height: "100%",
                                opacity: item.disabled ? 0.6 : 1,
                                cursor: item.disabled ? "not-allowed" : "pointer",
                            }}
                        >
                            <CardActionArea
                                onClick={!item.disabled ? item.onClick : undefined}
                                disabled={item.disabled}
                                sx={{
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    p: 0,
                                }}
                            >
                                <CardContent sx={{ width: "100%", p: 3 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            mb: 2,
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                mr: 2,
                                                bgcolor: item.color,
                                            }}
                                        >
                                            {item.icon}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography
                                                variant="h6"
                                                component="div"
                                                sx={{
                                                    fontWeight: "medium",
                                                    mb: 0.5,
                                                }}
                                            >
                                                {item.title}
                                                {item.disabled && (
                                                    <Typography
                                                        component="span"
                                                        variant="caption"
                                                        sx={{
                                                            ml: 1,
                                                            px: 1,
                                                            py: 0.25,
                                                            bgcolor: "grey.300",
                                                            borderRadius: 1,
                                                            fontSize: "1.2rem",
                                                        }}
                                                    >
                                                        近日実装予定
                                                    </Typography>
                                                )}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ lineHeight: 1.4 }}
                                            >
                                                {item.description}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </>
    );
};

export default UserSettingsPage;
