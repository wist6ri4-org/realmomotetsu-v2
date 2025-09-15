"use client";

import { useEventContext } from "@/app/events/layout";
import PageTitle from "@/components/base/PageTitle";
import { Description } from "@mui/icons-material";
import { Alert, Box, CircularProgress, Link, Paper, Stack, Typography } from "@mui/material";

/**
 * 配布資料ページ
 */
const DocsPage: React.FC = (): React.JSX.Element => {
    const {documents, isInitDataLoading, contextError} = useEventContext();

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
                {isInitDataLoading && (
                    <Box sx={{ textAlign: "center", margin: 4 }}>
                        <CircularProgress size={40} color="primary" />
                    </Box>
                )}
                {/* エラー */}
                {contextError && (
                    <Box sx={{ margin: 4 }}>
                        <Alert
                            severity="error"
                        >
                            {contextError}
                        </Alert>
                    </Box>
                )}
                {/* データの表示 */}
                {!isInitDataLoading && !contextError && (
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
