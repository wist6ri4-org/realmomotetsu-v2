"use client";

import CustomButton from "@/components/base/CustomButton";
import ColorPaletteExample from "@/components/ColorPaletteExample";
import CustomColorsExample from "@/components/CustomColorsExample";
import theme from "@/theme";
import { ThemeProvider } from "@mui/material/styles";

export default function TestPage() {
    return (
        <ThemeProvider theme={theme}>
            <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
                <main className="flex flex-col gap-[32px] items-center sm:items-start">
                    <h1 className="text-2xl font-bold">テストページ</h1>
                    <p className="text-sm text-gray-600">
                        ここにホームページのコンテンツが表示されます。
                    </p>
                    <div>
                        <div>
                            <CustomButton
                                variant="contained"
                                color="primary"
                                onClick={() => alert("Button clicked")}
                            >
                                ボタン
                            </CustomButton>
                        </div>
                        <div>
                            <ColorPaletteExample></ColorPaletteExample>
                        </div>
                        <div>
                            <CustomColorsExample></CustomColorsExample>
                        </div>
                    </div>
                </main>
            </div>
        </ThemeProvider>
    );
}
