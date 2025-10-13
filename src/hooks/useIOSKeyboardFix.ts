import { useEffect } from "react";

/**
 * iOS キーボード展開時のposition: fixed問題を修正するhook
 * @param {string} selector - 対象要素のセレクター（data属性など）
 * @param {string} cssVariableName - 高さを設定するCSS変数名
 * @param {boolean} isBottomFixed - 要素が画面下部に固定されているかどうか（NavigationBar用）
 */
export const useIOSKeyboardFix = (selector: string, cssVariableName?: string, isBottomFixed: boolean = false) => {
    useEffect(() => {
        /**
         * 要素の高さをCSS変数として設定
         */
        const updateElementHeight = () => {
            const element = document.querySelector(selector) as HTMLElement;
            if (element && cssVariableName) {
                const height = element.offsetHeight;
                document.documentElement.style.setProperty(cssVariableName, `${height}px`);
            }
        };

        /**
         * iOS キーボード対応の処理
         */
        const handleViewportChange = () => {
            // iOS Safari でキーボードが表示されている場合の対応
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            if (isIOS) {
                const element = document.querySelector(selector) as HTMLElement;
                if (element) {
                    // Visual Viewport APIを使用してより正確にキーボードの状態を判定
                    const visualViewport = window.visualViewport;
                    if (visualViewport) {
                        const viewportHeight = visualViewport.height;
                        const windowHeight = window.innerHeight;

                        // キーボードが表示されている場合（ビューポートの高さが大幅に減少した場合）
                        if (viewportHeight < windowHeight * 0.75) {
                            // キーボードが表示されている場合、absolute に変更
                            element.style.position = "absolute";
                            if (isBottomFixed) {
                                element.style.bottom = "0px";
                                element.style.top = "auto";
                            } else {
                                element.style.top = "0px";
                                element.style.bottom = "auto";
                            }
                        } else {
                            // キーボードが閉じられた場合、fixed に戻す
                            element.style.position = "fixed";
                            if (isBottomFixed) {
                                element.style.bottom = "0px";
                                element.style.top = "auto";
                            } else {
                                element.style.top = "0px";
                                element.style.bottom = "auto";
                            }
                        }
                    } else {
                        // Visual Viewport API が使用できない場合のフォールバック
                        const currentViewportHeight = window.innerHeight;
                        const initialViewportHeight = window.screen.height;

                        if (currentViewportHeight < initialViewportHeight * 0.75) {
                            element.style.position = "absolute";
                            if (isBottomFixed) {
                                element.style.bottom = "0px";
                                element.style.top = "auto";
                            } else {
                                element.style.top = "0px";
                                element.style.bottom = "auto";
                            }
                        } else {
                            element.style.position = "fixed";
                            if (isBottomFixed) {
                                element.style.bottom = "0px";
                                element.style.top = "auto";
                            } else {
                                element.style.top = "0px";
                                element.style.bottom = "auto";
                            }
                        }
                    }
                }
            }
        };

        /**
         * 画面回転時の処理
         */
        const handleOrientationChange = () => {
            setTimeout(() => {
                updateElementHeight();
                handleViewportChange();
            }, 100);
        };

        // 初期設定
        updateElementHeight();

        // イベントリスナーの登録
        window.addEventListener("resize", updateElementHeight);
        window.addEventListener("resize", handleViewportChange);

        // Visual Viewport API対応（より正確なキーボード検知）
        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", handleViewportChange);
        }

        // orientationchange イベントも監視
        window.addEventListener("orientationchange", handleOrientationChange);

        // クリーンアップ
        return () => {
            window.removeEventListener("resize", updateElementHeight);
            window.removeEventListener("resize", handleViewportChange);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener("resize", handleViewportChange);
            }
            window.removeEventListener("orientationchange", handleOrientationChange);
        };
    }, [selector, cssVariableName, isBottomFixed]);
};
