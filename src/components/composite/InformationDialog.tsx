"use client";

import { TeamData } from "@/types/TeamData";
import { Info } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { Dialog, DialogActions, DialogContent, DialogTitle, Fab } from "@mui/material";
import React, { useCallback, useState } from "react";
import CustomButton from "../base/CustomButton";
import { InitOperationResponse } from "@/features/init-operation/types";

/**
 * InformationDialogコンポーネントのプロパティ型定義
 * @param {TeamData[]} teamData - チームデータの配列
 */
interface InformationDialogProps {
    teamData: TeamData[];
    eventCode: string;
    onDataUpdate: (data: TeamData[]) => void;
}

/**
 * チーム情報ダイアログコンポーネント
 * @param {InformationDialogProps} props - InformationDialogのプロパティ
 * @returns {JSX.Element} - InformationDialogコンポーネント
 */
const InformationDialog: React.FC<InformationDialogProps> = ({
    teamData,
    eventCode,
    onDataUpdate: setTeamData,
}: InformationDialogProps): React.JSX.Element => {
    const [isOpen, setIsOpen] = useState(false);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * データの取得
     * @returns {Promise<void>} データ取得の非同期処理
     */
    const fetchData = useCallback(async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams();
            params.append("eventCode", eventCode as string);

            const response = await fetch("/api/init-operation?" + params.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: InitOperationResponse = (await response.json()).data;
            const teamData = data.teamData || [];

            if (!Array.isArray(teamData)) {
                throw new Error("Unexpected response structure");
            }
            setTeamData(teamData as TeamData[]);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError(error instanceof Error ? error.message : "Unknown error");
            setTeamData([]);
        } finally {
            setIsLoading(false);
        }
    }, [eventCode]);

    /**
     * ダイアログを開くハンドラー
     */
    const handleClickOpen = () => {
        fetchData();
        setIsOpen(true);
    };

    /**
     * ダイアログを閉じるハンドラー
     */
    const handleClose = () => {
        setIsOpen(false);
    };

    // チームデータのフィールドとヘッダー名
    const fields = [
        { field: "teamName", headerName: "チーム名", width: 120 },
        { field: "points", headerName: "PT", width: 80 },
        { field: "scoredPoints", headerName: "総資産", width: 80 },
        { field: "remainingStationsNumber", headerName: "目的駅まで", width: 80 },
        { field: "bombiiCounts", headerName: "ボンビー回数", width: 80 },
    ];
    // ページネーションの初期設定
    const paginationModel = { page: 0, pageSize: 5 };

    return (
        <>
            <Fab color="success" aria-label="info" onClick={handleClickOpen} sx={{ bottom: 175, zIndex: 400 }}>
                <Info />
            </Fab>
            {!isLoading && !error && (
                <Dialog
                    open={isOpen}
                    onClose={handleClose}
                    aria-labelledby="information-dialog-title"
                    aria-describedby="information-dialog-description"
                    sx={{ zIndex: 500 }}
                >
                    <DialogTitle id="information-dialog-title">チーム情報</DialogTitle>
                    <DialogContent sx={{ padding: 1 }}>
                        <DataGrid
                            rows={teamData}
                            columns={fields}
                            initialState={{ pagination: { paginationModel } }}
                            pageSizeOptions={[5, 10]}
                            density="compact"
                        />
                    </DialogContent>
                    <DialogActions>
                        <CustomButton onClick={handleClose} color="warning">
                            閉じる
                        </CustomButton>
                    </DialogActions>
                </Dialog>
            )}
        </>
    );
};

export default InformationDialog;
