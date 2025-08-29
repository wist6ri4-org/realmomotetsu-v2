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
 */
interface TransitStationsHistoryDialogProps {
    teamData: TeamData;
    isOpen: boolean;
    onClose: () => void;
}

const TransitStationsHistoryDialog: React.FC<TransitStationsHistoryDialogProps> = ({
    teamData,
    isOpen,
    onClose,
}): React.JSX.Element => {
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
                    <Typography variant="h4">{teamData.teamName} の履歴</Typography>
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
                                        <Typography variant="body1" fontWeight="bold">時間</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body1" fontWeight="bold">駅名</Typography>
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
