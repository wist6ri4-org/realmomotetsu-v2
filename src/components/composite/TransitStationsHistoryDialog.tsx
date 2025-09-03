"use client";
import { TeamData } from "@/types/TeamData";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import CustomButton from "../base/CustomButton";

/**
 * TransitStationsHistoryDialogコンポーネントのプロパティ型定義
 * @param {TeamData} teamData - チームデータ
 * @param {boolean} isOpen - ダイアログの開閉状態
 * @param {() => void} onClose - ダイアログを閉じるハンドラー
 */
interface TransitStationsHistoryDialogProps {
    teamData: TeamData;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * 経由駅履歴ダイアログコンポーネント
 * @param {TransitStationsHistoryDialogProps} props - 経由駅履歴ダイアログのプロパティ
 * @return {JSX.Element} - 経由駅履歴ダイアログコンポーネント
 */
const TransitStationsHistoryDialog: React.FC<TransitStationsHistoryDialogProps> = ({
    teamData,
    isOpen,
    onClose,
}: TransitStationsHistoryDialogProps): React.JSX.Element => {
    return (
        <>
            <Dialog
                open={isOpen}
                onClose={onClose}
                aria-labelledby="transit-stations-history-dialog-title"
                aria-describedby="transit-stations-history-dialog-description"
                fullWidth
                sx={{ zIndex: 3000 }}
            >
                <DialogTitle id="transit-stations-history-dialog-title">
                    <Typography>{teamData.teamName} の履歴</Typography>
                </DialogTitle>
                <DialogContentText align="right" sx={{ marginRight: 2 }}>
                    {teamData.transitStations.length}駅を通過しました
                </DialogContentText>
                <DialogContent>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <Typography variant="body1" fontWeight="bold">
                                            時間
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body1" fontWeight="bold">
                                            駅名
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {teamData.transitStations.map((transitStation) => (
                                    <TableRow key={transitStation.id}>
                                        <TableCell>
                                            <Typography variant="body1">
                                                {new Date(transitStation.createdAt).toLocaleTimeString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body1">{transitStation.station.name}</Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <CustomButton onClick={onClose} color="warning">
                        閉じる
                    </CustomButton>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default TransitStationsHistoryDialog;
