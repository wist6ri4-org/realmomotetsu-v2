import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "リアル桃鉄", //アプリケーション名
        short_name: "リアル桃鉄", //アプリケーション名(短縮版)
        description: "リアル桃鉄のアプリケーション", // アプリケーションの説明文
        start_url: "/", // アプリ起動時に開くパス
        display: "standalone", // アプリケーションの表示モードを指定する
        orientation: "portrait", // 画面の向きを指定する
        background_color: "#ffffff", // コンテンツ表示されるまでの背景色
        theme_color: "#000000", // ブラウザのアドレスバーやステータスバーの色
        icons: [
            // ホーム画面に表示させるicon画像
            {
                src: "/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    };
}
