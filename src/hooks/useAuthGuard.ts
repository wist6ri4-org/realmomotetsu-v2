"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import supabase from "@/lib/supabase";

const SIGN_IN_URL = "/user/signin";

export const useAuthGuard = () => {
    const [sbUser, setSbUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // 初回認証チェック
        const checkInitialAuth = async () => {
            try {
                // まずlocalStorageの認証データをチェック
                const authKeys = [
                    "sb-" +
                        process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0] +
                        "-auth-token",
                    "supabase.auth.token",
                    "sb-access-token",
                    "sb-refresh-token",
                ];

                const hasAuthData = authKeys.some((key) => {
                    const item = localStorage.getItem(key);
                    return item && item !== "null" && item !== "undefined";
                });

                if (!hasAuthData) {
                    console.log("No auth data in localStorage");
                    setSbUser(null);
                    setIsLoading(false);
                    router.push(SIGN_IN_URL);
                    return;
                }

                // Supabaseの認証チェック
                const {
                    data: { user },
                    error,
                } = await supabase.auth.getUser();

                if (error) {
                    console.error("Auth check error:", error);
                    setSbUser(null);
                    setIsLoading(false);
                    router.push(SIGN_IN_URL);
                    return;
                }

                if (!user) {
                    console.log("No user found");
                    setSbUser(null);
                    setIsLoading(false);
                    router.push(SIGN_IN_URL);
                    return;
                }

                setSbUser(user);
                setIsLoading(false);
            } catch (error) {
                console.error("Initial auth check failed:", error);
                setSbUser(null);
                setIsLoading(false);
                router.push(SIGN_IN_URL);
            }
        };

        // 認証状態の変更を監視
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth state changed:", event, session?.user?.id);

            if (event === "SIGNED_OUT" || !session || !session.user) {
                console.log("User signed out or session invalid");
                setSbUser(null);
                setIsLoading(false);
                router.push(SIGN_IN_URL);
            } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                console.log("User signed in or token refreshed");
                setSbUser(session.user);
                setIsLoading(false);
            }
        });

        // localStorageの変更を監視
        const handleStorageChange = (e: StorageEvent) => {
            // Supabase関連のキーが削除された場合
            if ((e.key && e.key.includes("supabase")) || (e.key && e.key.includes("sb-"))) {
                if (!e.newValue || e.newValue === "null") {
                    console.log("Auth data removed from localStorage");
                    setSbUser(null);
                    setIsLoading(false);
                    router.push(SIGN_IN_URL);
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);

        // // 定期的な認証チェック
        // const intervalCheck = setInterval(async () => {
        //     try {
        //         const {
        //             data: { user },
        //             error,
        //         } = await supabase.auth.getUser();

        //         if (error || !user) {
        //             console.log("Periodic auth check failed");
        //             setSbUser(null);
        //             router.push(SIGN_IN_URL);
        //             clearInterval(intervalCheck);
        //         }
        //     } catch (error) {
        //         console.error("Periodic auth check error:", error);
        //         setSbUser(null);
        //         router.push(SIGN_IN_URL);
        //         clearInterval(intervalCheck);
        //     }
        // }, 5000);

        checkInitialAuth();

        // クリーンアップ
        return () => {
            subscription.unsubscribe();
            window.removeEventListener("storage", handleStorageChange);
            // clearInterval(intervalCheck);
        };
    }, [router]);

    return { sbUser: sbUser, isLoading: isLoading };
};
