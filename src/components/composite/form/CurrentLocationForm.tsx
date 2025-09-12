/**
 * 現在地登録フォーム
 */
"use client";

import AlertDialog from "@/components/base/AlertDialog";
import ConfirmDialog from "@/components/base/ConfirmDialog";
import CustomButton from "@/components/base/CustomButton";
import CustomSelect from "@/components/base/CustomSelect";
import { DialogConstants } from "@/constants/dialogConstants";
import { DiscordNotificationTemplates } from "@/constants/discordNotificationTemplates";
import { Stations, Teams } from "@/generated/prisma";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useDiscordNotification } from "@/hooks/useDiscordNotification";
import { useSelectInput } from "@/hooks/useSelectInput";
import { ClosestStation } from "@/types/ClosestStation";
import { TypeConverter } from "@/utils/typeConverter";
import { Box, CircularProgress } from "@mui/material";
import { useParams } from "next/navigation";
import { useState } from "react";

/**
 * CurrentLocationFormコンポーネントのプロパティ型定義
 * @property {Teams[]} teams - チームのリスト
 * @property {Stations[]} stations - 駅のリスト
 * @property {ClosestStation[]} [closestStations] - 最寄り駅のリスト（オプション）
 */
interface CurrentLocationFormProps {
    teams: Teams[];
    stations: Stations[];
    closestStations?: ClosestStation[];
}

/**
 * 現在地登録フォームコンポーネント
 * @param { CurrentLocationFormProps } props - コンポーネントのプロパティ
 * @returns {JSX.Element} - CurrentLocationFormコンポーネント
 */
const CurrentLocationForm: React.FC<CurrentLocationFormProps> = ({
    teams,
    stations,
    closestStations,
}: CurrentLocationFormProps): React.JSX.Element => {
    const { eventCode } = useParams();

    const selectedTeamCodeInput = useSelectInput("");
    const selectedStationCodeInput = useSelectInput(
        closestStations?.[0]?.stationCode ? String(closestStations?.[0]?.stationCode) : ""
    );

    const { isConfirmOpen, dialogOptions, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();
    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const { sendNotification, clearError } = useDiscordNotification();

    /**
     * Discord通知を送信する
     * @returns {Promise<void>} - 通知送信の完了を示すPromise
     * @description
     * 目的駅到着時
     */
    const notifyToDiscord = async (): Promise<void> => {
        await sendNotification({
            templateName: DiscordNotificationTemplates.ARRIVAL_GOAL_STATION,
            variables: {
                teamName: teams.find((team) => team.teamCode === selectedTeamCodeInput.value)?.teamName || "不明",
                stationName:
                    stations.find((station) => station.stationCode === selectedStationCodeInput.value)?.name || "不明",
            },
        });
    };

    /**
     * 最新の目的駅の駅コードを取得
     * @returns {Promise<string>} - 次の目的駅の駅コード
     */
    const fetchNextGoalStationCode = async (): Promise<string> => {
        try {
            const response = await fetch(`/api/goal-stations/latest?eventCode=${eventCode}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const nextGoalStation = data.data.station;
            return nextGoalStation.stationCode;
        } catch (error) {
            console.error("Error fetching next goal station:", error);
            throw error;
            return "";
        }
    };

    /**
     * データの登録
     * @param {React.FormEvent<HTMLFormElement>} e - フォームの送信イベント
     * @returns {Promise<void>} - 登録処理の完了を示すPromise
     */
    const registerTransitStation = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        clearError();

        const teamName = teams.find((team) => team.teamCode === selectedTeamCodeInput.value)?.teamName || "不明";
        const stationName =
            stations.find((station) => station.stationCode === selectedStationCodeInput.value)?.name || "不明";

        const confirmMessage = "以下の内容で登録しますか？\n" + `チーム: ${teamName}\n` + `駅: ${stationName}`;
        const isConfirmed = await showConfirmDialog({
            message: confirmMessage,
        });

        if (!isConfirmed) {
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // 経由駅の登録
            const response = await fetch("/api/transit-stations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventCode: eventCode,
                    teamCode: selectedTeamCodeInput.value,
                    stationCode: selectedStationCodeInput.value,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 最新の目的駅の駅コードを取得
            const nextGoalStationCode = await fetchNextGoalStationCode();
            if (selectedStationCodeInput.value === nextGoalStationCode) {
                // 目的駅に到着した場合、Discord通知を送信
                notifyToDiscord();
            }

            selectedTeamCodeInput.reset();
            selectedStationCodeInput.reset();

            await showAlertDialog({
                title: DialogConstants.DIALOG_TITLE_REGISTERED,
                message: DialogConstants.DIALOG_MESSAGE_REGISTER_SUCCESS,
            });
            return;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            await showAlertDialog({
                title: DialogConstants.DIALOG_TITLE_ERROR,
                message: `${DialogConstants.DIALOG_MESSAGE_REGISTER_FAILURE}\n${error}`,
            });
            return;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Box>
                <Box
                    component="form"
                    border={1}
                    borderRadius={1}
                    onSubmit={registerTransitStation}
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        margin: 2,
                        padding: 2,
                        backgroundColor: "white",
                    }}
                >
                    <Box sx={{ marginBottom: 2 }}>
                        <CustomSelect
                            options={TypeConverter.convertTeamsToSelectOptions(teams)}
                            value={selectedTeamCodeInput.value}
                            onChange={selectedTeamCodeInput.handleChange}
                            size="small"
                            variant="outlined"
                            label="チーム名"
                            fullWidth
                            required
                            disabled={isLoading}
                        />
                    </Box>
                    <Box sx={{ marginBottom: 2 }}>
                        <CustomSelect
                            options={TypeConverter.convertStationsToSelectOptions(stations)}
                            value={selectedStationCodeInput.value}
                            onChange={selectedStationCodeInput.handleChange}
                            size="small"
                            variant="outlined"
                            label="今いる駅"
                            fullWidth
                            required
                            disabled={isLoading}
                        />
                    </Box>
                    <Box sx={{ marginTop: 5 }}>
                        <CustomButton
                            type="submit"
                            disabled={isLoading}
                            fullWidth
                            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {isLoading ? "送信中..." : "送信"}
                        </CustomButton>
                    </Box>
                </Box>
            </Box>
            <ConfirmDialog
                isConfirmOpen={isConfirmOpen}
                title={dialogOptions.title}
                message={dialogOptions.message}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
            <AlertDialog
                isAlertOpen={isAlertOpen}
                title={alertOptions.title}
                message={alertOptions.message}
                onOk={handleAlertOk}
                okText={alertOptions.okText}
            />
        </>
    );
};

export default CurrentLocationForm;
