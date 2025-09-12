"use client";

import { TeamData } from "@/types/TeamData";
import { Info } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { Dialog, DialogActions, DialogContent, DialogTitle, Fab } from "@mui/material";
import React, { useState } from "react";
import CustomButton from "../base/CustomButton";

/**
 * InformationDialogコンポーネントのプロパティ型定義
 * @param {TeamData[]} teamData - チームデータの配列
 */
interface InformationDialogProps {
    teamData: TeamData[];
}

/**
 * チーム情報ダイアログコンポーネント
 * @param {InformationDialogProps} props - InformationDialogのプロパティ
 * @returns {JSX.Element} - InformationDialogコンポーネント
 */
const InformationDialog: React.FC<InformationDialogProps> = ({
    teamData,
}: InformationDialogProps): React.JSX.Element => {
    const [isOpen, setIsOpen] = useState(false);

    /**
     * ダイアログを開くハンドラー
     */
    const handleClickOpen = () => {
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
            <Dialog
                open={isOpen}
                onClose={handleClose}
                aria-labelledby="information-dialog-title"
                aria-describedby="information-dialog-description"
                sx={{ zIndex: 500 }}
            >
                <DialogTitle id="information-dialog-title">チーム情報</DialogTitle>
                <DialogContent>
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
        </>
    );
};

export default InformationDialog;
