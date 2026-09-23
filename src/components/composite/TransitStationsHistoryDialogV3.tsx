"use client";
import { TeamData } from "@/types/TeamData";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { Timeline } from "@mui/icons-material";
import CustomButton from "../base/CustomButton";
import { Teams } from "@/generated/prisma";
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';

/**
 * TransitStationsHistoryDialogV3コンポーネントのプロパティ型定義
 * @param {TeamData} teamData - チームデータ
 * @param {Teams} team - チーム
 * @param {boolean} isOpen - ダイアログの開閉状態
 * @param {() => void} onClose - ダイアログを閉じるハンドラー
 */
interface TransitStationsHistoryDialogV3Props {
    teamData: TeamData;
    team: Teams;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * 経由駅履歴ダイアログコンポーネント
 * @param {TransitStationsHistoryDialogV3Props} props - 経由駅履歴ダイアログのプロパティ
 * @return {JSX.Element} - 経由駅履歴ダイアログコンポーネント
 */
const TransitStationsHistoryDialogV3: React.FC<TransitStationsHistoryDialogV3Props> = ({
    teamData,
    team,
    isOpen,
    onClose,
}: TransitStationsHistoryDialogV3Props): React.JSX.Element => {
    const goalStationsCount = teamData.transitStations.filter(station => station.isGoal).length;

    return (
        <>
            <Dialog
                open={isOpen}
                onClose={onClose}
                aria-labelledby="transit-stations-history-dialog-title"
                aria-describedby="transit-stations-history-dialog-description"
                fullWidth
                sx={{ zIndex: 500 }}
            >
                <DialogTitle id="transit-stations-history-dialog-title" sx={{ pb: 0 }}>
                    <Typography>
                        <Timeline sx={{ fontSize: "2rem", marginRight: 1 }} />
                        <strong>{teamData.teamName}</strong> の履歴
                    </Typography>
                </DialogTitle>
                <Divider variant="middle" sx={{ backgroundColor: team.teamColor, height: 3, mt: 1 }} />
                <DialogContentText align="right" sx={{ marginRight: 2 }}>
                    {goalStationsCount}回ゴール / {teamData.transitStations.length}駅通過
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
                                            <Typography variant="body1">
                                                {
                                                    transitStation.isGoal &&
                                                    <OutlinedFlagIcon
                                                        fontSize="large"
                                                        sx={{ marginRight: 1, color: team.teamColor }}
                                                    />
                                                }
                                                {transitStation.station.name}
                                            </Typography>
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

export default TransitStationsHistoryDialogV3;
