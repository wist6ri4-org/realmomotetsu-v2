"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

/**
 * ユーザーアイコンのコンテキスト型定義
 * @property {string} userIconUrl - 現在のユーザーアイコンのURL
 * @property {function} updateUserIcon - ユーザーアイコンを更新する関数
 * @property {function} clearUserIcon - ユーザーアイコンをクリアする関数
 * @property {number} refreshKey - 再レンダリングを強制するためのキー
 * @description
 * ユーザーアイコンの状態を管理するためのコンテキスト。
 * コンポーネントツリー内のどこからでもユーザーアイコンの状態を取得・更新できる。
 */
interface UserIconContextType {
    userIconUrl: string;
    updateUserIcon: (userId: string, newIconUrl?: string) => Promise<void>;
    clearUserIcon: () => void;
    refreshKey: number;
}

// ユーザーアイコンのコンテキストを作成
const UserIconContext = createContext<UserIconContextType | undefined>(undefined);

/**
 * ユーザーアイコンのコンテキストプロバイダーのプロパティ型定義
 * @property {ReactNode} children - コンテキストプロバイダーの子要素
 * @description
 * ユーザーアイコンのコンテキストプロバイダーに渡す子要素の型定義。
 * コンテキストプロバイダーは、子要素にユーザーアイコンの状態を提供する。
 */
interface UserIconProviderProps {
    children: ReactNode;
}

/**
 * ユーザーアイコンのコンテキストプロバイダー
 * @param {ReactNode} children - コンテキストプロバイダーの子要素
 * @returns {JSX.Element} - コンテキストプロバイダーのコンポーネント
 * @description
 * ユーザーアイコンのURLを管理し、更新やクリアの機能を提供するコンテキストプロバイダー。
 * コンポーネントツリー内のどこからでもユーザーアイコンの状態を取得・更新できる。
 */
export const UserIconProvider: React.FC<UserIconProviderProps> = ({ children }) => {
    const [userIconUrl, setUserIconUrl] = useState<string>("");
    const [refreshKey, setRefreshKey] = useState<number>(Date.now());

    /**
     * ユーザーアイコンを更新する関数
     * @param {string} userId - ユーザーのID
     * @param {string} [newIconUrl] - 新しいアイコンのURL（オプション）
     * @returns {Promise<void>} - 非同期処理
     */
    const updateUserIcon = useCallback(
        async (userId: string, newIconUrl?: string): Promise<void> => {
            try {
                const { UserUtils } = await import("@/utils/userUtils");
                const userUtils = new UserUtils();

                if (newIconUrl) {
                    // 新しいURLが提供された場合はそれを使用
                    setUserIconUrl(newIconUrl);
                    setRefreshKey(Date.now()); // 再レンダリングを強制
                } else {
                    // URLが提供されていない場合は動的に取得
                    const iconUrl = await userUtils.getUserIconUrlWithExtension(userId, true);
                    setUserIconUrl(iconUrl || "");
                    setRefreshKey(Date.now()); // 再レンダリングを強制
                }
            } catch (error) {
                console.error("Failed to update user icon:", error);
                setUserIconUrl("");
                setRefreshKey(Date.now());
            }
        },
        []
    );

    /**
     * ユーザーアイコンをクリアする関数
     * @returns {void} - クリア処理
     */
    const clearUserIcon = useCallback((): void => {
        setUserIconUrl("");
        setRefreshKey(Date.now());
    }, []);

    return (
        <UserIconContext.Provider
            value={{ userIconUrl, updateUserIcon, clearUserIcon, refreshKey }}
        >
            {children}
        </UserIconContext.Provider>
    );
};

/**
 * ユーザーアイコンのコンテキストを取得するカスタムフック
 * @returns {UserIconContextType} - ユーザーアイコンのコンテキスト
 */
export const useUserIcon = (): UserIconContextType => {
    const context = useContext(UserIconContext);
    if (!context) {
        throw new Error("useUserIcon must be used within a UserIconProvider");
    }
    return context;
};
