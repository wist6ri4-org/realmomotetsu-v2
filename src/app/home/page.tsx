"use client";

import { Stations } from "@/generated/prisma/client";
import { useEffect, useState } from "react";

export default function HomePage() {
    const [data, setData] = useState<Stations[]>([]);

    useEffect(() => {
        console.log("api")
        fetch("/api/init-home")
        .then((res) => res.json())
        .then((data) => setData(data as Stations[]))
    },[]);


    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col gap-[32px] items-center sm:items-start">
                <h1 className="text-2xl font-bold">ホームページ</h1>
                <p className="text-sm text-gray-600">
                    ここにホームページのコンテンツが表示されます。
                </p>
                <div>
                    <h2 className="text-xl font-semibold">初期化データ</h2>
                    <div>
                        {JSON.stringify(data)}
                    </div>
                </div>
            </main>
        </div>
    );
}