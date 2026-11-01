import React from "react";

/**
 * 路線一覧（凡例）画像の種類
 */
export type RouteListVariant = "tokyu" | "metro";

/**
 * RouteListSymbolSVGのプロパティ
 * @param {RouteListVariant} [variant] - 路線一覧の種類（デフォルト: tokyu）
 */
interface RouteListSymbolSVGProps {
    variant?: RouteListVariant;
}

const ROUTE_LIST_SYMBOLS = {
    tokyu: { viewBox: "0 0 4000 2000", href: "/route.jpg" },
    metro: { viewBox: "0 0 4640 1480", href: "/metro_lines.png" },
} as const;

const RouteListSymbolSVG = ({ variant = "tokyu" }: RouteListSymbolSVGProps) => {
    const { viewBox, href } = ROUTE_LIST_SYMBOLS[variant];

    return (
        <>
            <symbol id="route-list-symbol" viewBox={viewBox}>
                <image href={href}></image>
            </symbol>
        </>
    );
};

export default RouteListSymbolSVG;
