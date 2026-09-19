"use client";

import { TeamData } from "@/types/TeamData";
import { Info } from "@mui/icons-material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Dialog, DialogActions, DialogContent, DialogTitle, Fab } from "@mui/material";
import React, { useState } from "react";
import CustomButton from "../base/CustomButton";

/**
 * InformationDialogV3コンポーネントのプロパティ型定義
 * @param {TeamData[]} teamData - チームデータの配列
 */
interface InformationDialogV3Props {
    teamData: TeamData[];
}

/**
 * チーム情報ダイアログコンポーネント
 *
 * 以前は開くたびに取得APIを叩いて親のstateを更新していたが、
 * 親側がリアルタイム通知で最新のチームデータを保持するようになったため、
 * ここでは受け取ったデータを表示するだけとする。
 *
 * @param {InformationDialogV3Props} props - InformationDialogV3のプロパティ
 * @returns {JSX.Element} - InformationDialogV3コンポーネント
 */
const InformationDialogV3: React.FC<InformationDialogV3Props> = ({
    teamData,
}: InformationDialogV3Props): React.JSX.Element => {
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
    const fields: GridColDef[] = [
        { field: "teamName", headerName: "チーム名", minWidth: 120 },
        { field: "scoredPoints", headerName: "総資産", minWidth: 80 },
        { field: "propertyPurchasePoints", headerName: "物件", minWidth: 80 },
        { field: "remainingStationsNumber", headerName: "あと", minWidth: 80, valueFormatter: (value) => (value !== null ? value : "-") },
        { field: "goalCounts", headerName: "ゴール回数回数", minWidth: 80 },
        { field: "bombiiCounts", headerName: "ボンビー回数", minWidth: 80 },
    ];
    // ページネーションの初期設定
    const paginationModel = { page: 0, pageSize: 6 };

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
                <DialogContent sx={{ padding: 1 }}>
                    <DataGrid
                        rows={teamData.map((team) => ({
                            ...team,
                            propertyPurchasePoints: -1 * team.propertyPurchasePoints,
                            goalCounts: team.transitStations.filter((station) => station.isGoal).length,
                        }))}
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

export default InformationDialogV3;
