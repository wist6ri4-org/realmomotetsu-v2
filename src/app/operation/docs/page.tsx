"use client";

import CustomButton from "@/components/base/CustomButton";
import PageTitle from "@/components/base/PageTitle";
import { Documents } from "@/generated/prisma";
import { Description } from "@mui/icons-material";
import { Alert, Box, CircularProgress, Link, Paper, Stack, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";

/**
 * 配布資料ページ
 */
const DocsPage: React.FC = (): React.JSX.Element => {
    const [documents, setDocuments] = useState<Documents[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * データの取得
     */
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams();
            // TODO イベントコードをセッションから取得する
            params.append("eventCode", "TOKYU_20250517");

            const response = await fetch("/api/documents?" + params.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const documents = data?.data?.documents || data?.documents || [];
            if (!Array.isArray(documents)) {
                throw new Error("Unexpected response structure");
            }

            setDocuments(documents as Documents[]);
        } catch (error) {
            console.error("Error fetching documents:", error);
            setError(error instanceof Error ? error.message : "An unexpected error occurred");
            setDocuments([]);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 初期表示
     */
    useEffect(() => {
        fetchData();
    }, []);

    return (
        <>
            {/* サブヘッダーセクション */}
            <Box>
                <PageTitle
                    title="配布資料"
                    icon={<Description sx={{ fontSize: "3.5rem", marginRight: 1 }} />}
                />
            </Box>

            {/* コンテンツセクション */}
            <Box>
                {/* ローディング */}
                {isLoading && (
                    <Box sx={{ textAlign: "center", margin: 4 }}>
                        <CircularProgress size={40} color="primary" />
                    </Box>
                )}
                {/* エラー */}
                {error && (
                    <Box sx={{ margin: 4 }}>
                        <Alert
                            severity="error"
                            action={<CustomButton onClick={fetchData}>再試行</CustomButton>}
                        >
                            {error}
                        </Alert>
                    </Box>
                )}
                {/* データの表示 */}
                {!isLoading && !error && (
                    <>
                        <Box sx={{ margin: 2 }}>
                            <Stack spacing={1}>
                                {documents.map((doc) => (
                                    <Paper
                                        key={doc.id}
                                        sx={{
                                            padding: 1,
                                            margin: 1,
                                            border: "1px solid #ccc",
                                            borderRadius: 2,
                                        }}
                                    >
                                        <Link
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Typography variant="h6">{doc.name}</Typography>
                                        </Link>
                                    </Paper>
                                ))}
                            </Stack>
                        </Box>
                    </>
                )}
            </Box>
        </>
    );
};

export default DocsPage;
