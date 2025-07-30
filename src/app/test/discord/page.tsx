"use client";

import { useState } from "react";
import {
    ArrivalNotification,
    QuickArrivalButton,
} from "@/components/composite/ArrivalNotification";

export default function NotificationTestPage() {
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");

    const handleSuccess = () => {
        setSuccessMessage("✅ Discord通知を送信しました！");
        setErrorMessage("");
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    const handleError = (error: string) => {
        setErrorMessage(error);
        setSuccessMessage("");
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-center mb-8">🎯 Discord通知テスト</h1>

                {/* 成功・エラーメッセージ */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-md">
                        <p className="text-green-700">{successMessage}</p>
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-md">
                        <p className="text-red-700">❌ {errorMessage}</p>
                    </div>
                )}

                {/* フォーム型の通知 */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <ArrivalNotification onSuccess={handleSuccess} onError={handleError} />
                </div>

                {/* クイックボタン型の通知 */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">🚀 クイック通知</h3>
                    <p className="text-gray-600 mb-4">事前に設定されたチーム・駅での通知テスト</p>

                    <div className="space-y-3">
                        <QuickArrivalButton
                            teamName="チーム青"
                            stationName="東京駅"
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md"
                            onSuccess={handleSuccess}
                            onError={handleError}
                        />

                        <QuickArrivalButton
                            teamName="チーム赤"
                            stationName="新宿駅"
                            className="w-full bg-red-600 text-white py-2 px-4 rounded-md"
                            onSuccess={handleSuccess}
                            onError={handleError}
                        />

                        <QuickArrivalButton
                            teamName="チーム緑"
                            stationName="渋谷駅"
                            className="w-full bg-green-600 text-white py-2 px-4 rounded-md"
                            onSuccess={handleSuccess}
                            onError={handleError}
                        />
                    </div>
                </div>

                {/* 環境設定情報 */}
                <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">📝 設定確認</h4>
                    <p className="text-yellow-700 text-sm">
                        Discord通知が動作しない場合は、環境変数 <code>DISCORD_WEBHOOK_URL</code>{" "}
                        が正しく設定されていることを確認してください。
                    </p>
                </div>
            </div>
        </div>
    );
}
