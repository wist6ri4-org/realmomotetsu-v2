"use client";

import { useState } from "react";
import { useDiscordNotification } from "@/hooks/useDiscordNotification";

interface ArrivalNotificationProps {
    teamName?: string;
    stationName?: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export function ArrivalNotification({
    teamName: initialTeamName = "",
    stationName: initialStationName = "",
    onSuccess,
    onError,
}: ArrivalNotificationProps) {
    const [teamName, setTeamName] = useState(initialTeamName);
    const [stationName, setStationName] = useState(initialStationName);
    const { sendNotification, isLoading, error, clearError } = useDiscordNotification();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        if (!teamName.trim() || !stationName.trim()) {
            const errorMsg = "チーム名と駅名を入力してください";
            onError?.(errorMsg);
            return;
        }

        try {
            await sendNotification({
                templateName: "arrivalGoalStation.txt",
                variables: { teamName: teamName.trim(), stationName: stationName.trim() },
            });
            onSuccess?.();

            // 成功時にフォームをリセット（オプション）
            if (!initialTeamName) setTeamName("");
            if (!initialStationName) setStationName("");
        } catch {
            onError?.(error || "通知の送信に失敗しました");
        }
    };

    return (
        <div className="arrival-notification">
            <h3>🎯 到着通知</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="teamName" className="block text-sm font-medium">
                        チーム名
                    </label>
                    <input
                        id="teamName"
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="例: チーム青"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label htmlFor="stationName" className="block text-sm font-medium">
                        駅名
                    </label>
                    <input
                        id="stationName"
                        type="text"
                        value={stationName}
                        onChange={(e) => setStationName(e.target.value)}
                        placeholder="例: 東京駅"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        disabled={isLoading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !teamName.trim() || !stationName.trim()}
                    className={`w-full py-2 px-4 rounded-md font-medium ${
                        isLoading || !teamName.trim() || !stationName.trim()
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                    {isLoading ? "送信中..." : "🔔 Discord通知を送信"}
                </button>
            </form>

            {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
                    <p className="text-red-700 text-sm">❌ {error}</p>
                </div>
            )}
        </div>
    );
}

// 簡単な呼び出し用のコンポーネント
interface QuickArrivalButtonProps {
    teamName: string;
    stationName: string;
    className?: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export function QuickArrivalButton({
    teamName,
    stationName,
    className = "",
    onSuccess,
    onError,
}: QuickArrivalButtonProps) {
    const { sendNotification, isLoading } = useDiscordNotification();

    const handleClick = async () => {
        try {
            await sendNotification({
                templateName: "arrivalGoalStation.txt",
                variables: { teamName, stationName },
            });
            onSuccess?.();
        } catch (err) {
            onError?.(err instanceof Error ? err.message : "通知送信に失敗しました");
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={`${className} ${
                isLoading ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
            }`}
        >
            {isLoading ? "送信中..." : `🔔 ${teamName}の到着通知`}
        </button>
    );
}
