/**
 * 共通定数
 */
export const CommonConstants = {
    CSS : {
        VARIABLES: {
            // ApplicationBarの高さ
            APPLICATION_BAR_HEIGHT: "--application-bar-height",
            // NavigationBarの高さ
            NAVIGATION_BAR_HEIGHT: "--navigation-bar-height",
        },
    },
} as const;

export type CommonConstants = typeof CommonConstants;
