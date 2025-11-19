"use client";

import createEmotionCache from "@/lib/emotion";
import theme from "@/theme";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ReactNode } from "react";

// TODO add docs

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

interface ThemeRegistryProps {
    children: ReactNode;
    emotionCache?: typeof clientSideEmotionCache;
}

export default function ThemeRegistry({
    children,
    emotionCache = clientSideEmotionCache,
}: ThemeRegistryProps) {
    return (
        <CacheProvider value={emotionCache}>
            <ThemeProvider theme={theme}>
                <CssBaseline enableColorScheme />
                {children}
            </ThemeProvider>
        </CacheProvider>
    );
}
