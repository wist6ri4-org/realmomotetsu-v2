"use client";

import { Box, Typography, Card, CardContent, CardActionArea, Avatar, Grid, CircularProgress } from "@mui/material";
import {
    AccountCircle as AccountCircleIcon,
    Settings,
    Description,
    Construction,
} from "@mui/icons-material";
import PageTitle from "@/components/base/PageTitle";
import { useParams, useRouter } from "next/navigation";
import { checkIsAdminUserWithUsers } from "@/lib/auth";
import { useEffect, useState } from "react";
import { useEventContext } from "../../layout";

/**
 * オペレーションメニューページ
 */
const OperationPage: React.FC = (): React.JSX.Element => {
    const router = useRouter();
    const params = useParams();
    const eventCode = params.eventCode as string;

    const { user, isInitDataLoading, contextError } = useEventContext();

    const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
    const [isCheckingAdmin, setIsCheckingAdmin] = useState<boolean>(true);

    /**
     * 管理者ユーザーかどうかを確認
     */
    useEffect(() => {
        setIsCheckingAdmin(true);
        const checkIsAdmin = () => {
            if (user) {
                try {
                    const isAdminUser = checkIsAdminUserWithUsers(user, eventCode);
                    setIsAdminUser(isAdminUser);
                } catch (error) {
                    console.error("Error checking admin status:", error);
                    setIsAdminUser(false);
                } finally {
                    setIsCheckingAdmin(false);
                }
            } else {
                setIsCheckingAdmin(false);
                setIsAdminUser(false);
            }
        };
        checkIsAdmin();
    }, [user, eventCode, isInitDataLoading]);

    const menuItems = [
        {
            title: "ユーザー設定",
            description: "アカウントとプロフィール設定",
            icon: <AccountCircleIcon sx={{ fontSize: "1.8rem" }} />,
            color: "#4CAF50",
            onClick: () => {
                router.push(`/events/${eventCode}/operation/user-settings`);
            },
        },
        {
            title: "配布資料",
            description: "各種配布資料の確認",
            icon: <Description sx={{ fontSize: "1.8rem" }} />,
            color: "#FF9800",
            onClick: () => {
                router.push(`/events/${eventCode}/operation/docs`);
            },
        },
        ...(isAdminUser
            ? [
                  {
                      title: "GMツール",
                      description: "GM用の管理機能",
                      icon: <Construction sx={{ fontSize: "1.8rem" }} />,
                      color: "#2196F3",
                      onClick: () => {
                          router.push(`/events/${eventCode}/operation/tools`);
                      },
                  },
              ]
            : []),
    ];

    return (
        <>
            <Box>
                <PageTitle title="その他" icon={<Settings sx={{ fontSize: "3.5rem", marginRight: 1 }} />} />
            </Box>

            {/* ローディング */}
            {isInitDataLoading ||
                (isCheckingAdmin && (
                    <Box sx={{ textAlign: "center", mb: 4 }}>
                        <CircularProgress size={40} color="primary" />
                    </Box>
                ))}
            {/* エラー */}
            {contextError && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="body1" color="error">
                        エラーが発生しました: {contextError}
                    </Typography>
                </Box>
            )}
            {/* データの表示 */}
            {!isInitDataLoading && !isCheckingAdmin && !contextError && (
                <Grid container spacing={2}>
                    {menuItems.map((item, index) => (
                        <Grid size={6} key={index}>
                            <Card
                                variant="outlined"
                                sx={{
                                    height: "100%",
                                    borderRadius: 3,
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                        transform: "translateY(-4px)",
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                                    },
                                    minHeight: 150,
                                }}
                            >
                                <CardActionArea
                                    onClick={item.onClick}
                                    sx={{
                                        height: "100%",
                                        p: 2,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-start",
                                        justifyContent: "flex-start",
                                        minHeight: 120,
                                    }}
                                >
                                    <Box sx={{ mb: 1.5 }}>
                                        <Avatar
                                            sx={{
                                                bgcolor: item.color,
                                                width: 36,
                                                height: 36,
                                            }}
                                        >
                                            {item.icon}
                                        </Avatar>
                                    </Box>
                                    <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                                            {item.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                            {item.description}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </>
    );
};

export default OperationPage;
