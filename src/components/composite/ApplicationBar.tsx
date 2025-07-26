"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import { useState, MouseEvent, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import { Events } from "@/generated/prisma";
import { signOut } from "@/lib/auth";
import { UsersWithRelations } from "@/repositories/users/UsersRepository";

/**
 * アプリケーションバーのプロパティ型定義
 * @property {sbUser} sbUser - Supabaseのユーザーオブジェクト
 */
interface ApplicationBarProps {
    sbUser: User;
}

/**
 * アプリケーションバーコンポーネント
 * @param {ApplicationBarProps} props - アプリケーションバーのプロパティ
 * @return {React.JSX.Element} - アプリケーションバーコンポーネント
 */
const ApplicationBar: React.FC<ApplicationBarProps> = ({
    sbUser,
}: ApplicationBarProps): React.JSX.Element => {
    const router = useRouter();
    const { eventCode } = useParams();

    const [event, setEvent] = useState<Events | null>(null);
    const [user, setUser] = useState<UsersWithRelations | null>(null);
    const [error, setError] = useState<string | null>(null);

    /**
     * データの取得
     */
    const fetchData = async () => {
        try {
            setError(null);

            const [responseEvents, responseUsers] = await Promise.all([
                fetch(`/api/events/${eventCode}`),
                fetch(`/api/users/${sbUser.id}`),
            ]);

            if (!responseEvents.ok) {
                throw new Error(`HTTP error! status: ${responseEvents.status}`);
            }
            if (!responseUsers.ok) {
                throw new Error(`HTTP error! status: ${responseUsers.status}`);
            }
            const dataEvents = await responseEvents.json();
            const dataUsers = await responseUsers.json();

            const eventData = dataEvents?.data || {};
            const userData = dataUsers?.data || {};
            if (!eventData || !userData) {
                throw new Error("Event or user data not found");
            }
            setUser(userData as UsersWithRelations);
            setEvent(eventData as Events);
        } catch (error) {
            console.error("Error fetching event data:", error);
            setError(error instanceof Error ? error.message : "Unknown error");
            setEvent(null);
            setUser(null);
        }
    };

    /**
     * コンポーネントのマウント時にデータを取得
     */
    useEffect(() => {
        fetchData();
    }, [eventCode, sbUser]);

    // イベントメニューの状態管理
    const [anchorEventMenu, setAnchorEventMenu] = useState<null | HTMLElement>(null);
    const handleEventMenu = (event: MouseEvent<HTMLElement>) => {
        setAnchorEventMenu(event.currentTarget);
    };
    const handleEventMenuClose = () => {
        setAnchorEventMenu(null);
    };

    // ユーザーメニューの状態管理
    const [anchorUserMenu, setAnchorUserMenu] = useState<null | HTMLElement>(null);
    const handleUserMenu = (event: MouseEvent<HTMLElement>) => {
        setAnchorUserMenu(event.currentTarget);
    };
    const handleUserMenuClose = () => {
        setAnchorUserMenu(null);
    };
    const handlePushUserSettings = () => {
        handleUserMenuClose();
        router.push(`/events/${eventCode}/operation/user-settings`);
    };

    /**
     * サインアウト処理
     */
    const handleSignOut = async () => {
        try {
            await signOut();
            setUser(null);
            setEvent(null);
        } catch (error) {
            console.error("Error signing out:", error);
            setError(error instanceof Error ? error.message : "Unknown error");
        } finally {
            handleUserMenuClose();
        }
    };

    return (
        <>
            <Box
                component="header"
                sx={{ width: "100%", position: "sticky", top: 0, zIndex: 2000 }}
            >
                <AppBar position="sticky">
                    <Toolbar>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            onClick={handleEventMenu}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            id="event-menu"
                            anchorEl={anchorEventMenu}
                            anchorOrigin={{
                                vertical: "top",
                                horizontal: "left",
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: "top",
                                horizontal: "left",
                            }}
                            open={Boolean(anchorEventMenu)}
                            onClose={handleEventMenuClose}
                            sx={{
                                zIndex: 2000, // Ensure the menu is above other elements
                            }}
                        >
                            {user &&
                                user.attendances.map((attendance) => (
                                    <MenuItem
                                        key={attendance.eventCode}
                                        onClick={() => {
                                            handleUserMenuClose();
                                            window.location.href = `/events/${attendance.eventCode}/home`;
                                        }}
                                    >
                                        {attendance.event.eventName}
                                    </MenuItem>
                                ))}
                        </Menu>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            {event ? event.eventName : "Loading..."}
                        </Typography>
                        {user && (
                            <Box>
                                <IconButton
                                    size="large"
                                    aria-label="account of current user"
                                    aria-controls="user-menu"
                                    aria-haspopup="true"
                                    onClick={handleUserMenu}
                                    color="inherit"
                                >
                                    <AccountCircle />
                                </IconButton>
                                <Menu
                                    id="user-menu"
                                    anchorEl={anchorUserMenu}
                                    anchorOrigin={{
                                        vertical: "top",
                                        horizontal: "right",
                                    }}
                                    keepMounted
                                    transformOrigin={{
                                        vertical: "top",
                                        horizontal: "right",
                                    }}
                                    open={Boolean(anchorUserMenu)}
                                    onClose={handleUserMenuClose}
                                    sx={{
                                        zIndex: 2000,
                                    }}
                                >
                                    <MenuItem onClick={handlePushUserSettings}>
                                        ユーザー設定
                                    </MenuItem>
                                    <MenuItem onClick={handleSignOut}>サインアウト</MenuItem>
                                </Menu>
                            </Box>
                        )}
                    </Toolbar>
                </AppBar>
            </Box>
        </>
    );
};

export default ApplicationBar;
