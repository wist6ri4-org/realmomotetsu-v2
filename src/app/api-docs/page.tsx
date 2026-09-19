"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// swagger-ui-reactはブラウザAPIに依存するためSSRを無効化して読み込む
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

/**
 * API仕様書（Swagger UI）ページ
 * tools/openapi-generator/generate.ts で生成された public/openapi/openapi.json を表示する
 * @returns {React.JSX.Element} - API仕様書ページのコンポーネント
 */
const ApiDocsPage: React.FC = (): React.JSX.Element => {
    return <SwaggerUI url="/openapi/openapi.json" />;
};

export default ApiDocsPage;
