"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import supabase from "@/lib/supabase";
import { UsersWithRelations } from "@/repositories/users/UsersRepository";

const SIGN_IN_URL = "/user/signin";

/**
 * 認証ガードフック
 * @returns {User | null} sbUser - Supabaseの認証ユーザー
 * @return {UsersWithRelations | null} user - publicスキーマのユーザーデータ
 * @return {boolean} isLoading - 認証状態のロード中フラグ
 *
 * このフックは、Supabaseの認証状態を監視し、ユーザーデータを取得します。
 * 認証されていない場合はサインインページにリダイレクトします。
 */
export const useAuthGuard = (): {
    sbUser: User | null;
    user: UsersWithRelations | null;
    isLoading: boolean;
} => {
    const [sbUser, setSbUser] = useState<User | null>(null);
    const [user, setUser] = useState<UsersWithRelations | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    /**
     * publicスキーマのユーザー情報を取得
     * @param sbUser - Supabaseの認証ユーザー
     * @return {Promise<UsersWithRelations | null>} - ユーザーデータまたはnull
     */
    const fetchUserData = async (sbUser: User): Promise<UsersWithRelations | null> => {
        try {
            const response = await fetch(`/api/users/${sbUser.id}`);
            if (!response.ok) {
                console.error(`Failed to fetch user data: ${response.status}`);
                return null;
            }

            const data = await response.json();
            return data?.data?.user || data?.user || null;
        } catch (error) {
            console.error("Error fetching user data:", error);
            return null;
        }
    };

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
                    throw new Error("No auth data in localStorage");
                }

                // Supabaseの認証チェック
                const {
                    data: { user: authUser },
                    error,
                } = await supabase.auth.getUser();

                if (error) {
                    console.error("Auth check error:", error);
                    throw error;
                }

                if (!authUser) {
                    console.log("No user found");
                    throw new Error("No user found");
                }

                // publicスキーマのユーザーデータを取得
                const userData = await fetchUserData(authUser);
                if (!userData) {
                    console.log("No user data found in public schema");
                    throw new Error("No user data found in public schema");
                }

                setSbUser(authUser);
                setUser(userData);
                setIsLoading(false);
            } catch (error) {
                console.error("Initial auth check failed:", error);
                setSbUser(null);
                setUser(null);
                setIsLoading(false);
                router.push(SIGN_IN_URL);
            }
        };

        // 認証状態の変更を監視
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth state changed:", event, session?.user?.id);

            if (event === "SIGNED_OUT" || !session || !session.user) {
                console.log("User signed out or session invalid");
                setSbUser(null);
                setUser(null);
                setIsLoading(false);
                router.push(SIGN_IN_URL);
            } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                console.log("User signed in or token refreshed");
                const userData = await fetchUserData(session.user);
                setSbUser(session.user);
                setUser(userData);
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
                    setUser(null);
                    setIsLoading(false);
                    router.push(SIGN_IN_URL);
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);

        checkInitialAuth();

        // クリーンアップ
        return () => {
            subscription.unsubscribe();
            window.removeEventListener("storage", handleStorageChange);
            // clearInterval(intervalCheck);
        };
    }, [router]);

    return { sbUser: sbUser, user: user, isLoading: isLoading };
};
