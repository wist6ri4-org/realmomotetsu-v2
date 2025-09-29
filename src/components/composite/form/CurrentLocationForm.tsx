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
import { GameConstants } from "@/constants/gameConstants";
import { getMessage } from "@/constants/messages";
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ApplicationErrorHandler } from "@/error/errorHandler";
import { GetLatestGoalStationsResponse } from "@/features/goal-stations/latest/types";
import { GetLatestTransitStationsResponse } from "@/features/transit-stations/latest/types";
import { LatestTransitStations, Stations, Teams } from "@/generated/prisma";
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
 * @property {string} [initialTeamCode] - 初期選択されるチームコード（オプション）
 * @property {boolean} isOperating - 操作権限があるかどうか
 */
interface CurrentLocationFormProps {
    teams: Teams[];
    stations: Stations[];
    closestStations?: ClosestStation[];
    initialTeamCode?: string;
    isOperating: boolean;
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
    initialTeamCode,
    isOperating,
}: CurrentLocationFormProps): React.JSX.Element => {
    const { eventCode } = useParams();

    const selectedTeamCodeInput = useSelectInput(initialTeamCode || "");
    const selectedStationCodeInput = useSelectInput(
        closestStations?.[0]?.stationCode ? String(closestStations?.[0]?.stationCode) : ""
    );

    const { isConfirmOpen, dialogOptions, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();
    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    const [isLoading, setIsLoading] = useState<boolean>(false);

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
                throw ApplicationErrorFactory.createFromResponse(response);
            }
            const data: GetLatestGoalStationsResponse = (await response.json()).data;
            const nextGoalStation = data.goalStation;
            return nextGoalStation.station.stationCode;
        } catch (error) {
            const appError = ApplicationErrorFactory.normalize(error);
            ApplicationErrorHandler.logError(appError, "WARN");
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

        const team = teams.find((team) => team.teamCode === selectedTeamCodeInput.value) as Teams;
        const station = stations.find((station) => station.stationCode === selectedStationCodeInput.value) as Stations;

        const teamName = team.teamName || "不明";
        const stationName = station.name || "不明";

        const confirmMessage = "以下の内容で登録しますか？\n" + `チーム: ${teamName}\n` + `駅: ${stationName}`;
        const isConfirmed = await showConfirmDialog({
            message: confirmMessage,
        });

        if (!isConfirmed) {
            return;
        }

        try {
            setIsLoading(true);

            // 二重登録チェック
            const params = new URLSearchParams();
            params.append("eventCode", eventCode as string);
            const responseForCheck = await fetch("/api/transit-stations/latest?" + params.toString());
            if (!responseForCheck.ok) {
                throw ApplicationErrorFactory.createFromResponse(responseForCheck);
            }
            const data: GetLatestTransitStationsResponse = (await responseForCheck.json()).data;
            const latestTransitStations: LatestTransitStations[] = data.latestTransitStations || [];

            if (checkIsRegistered(latestTransitStations, team.teamCode, station.stationCode)) {
                const confirmDoubleRegistrationMessage =
                    "直近に登録した駅と同じ駅を登録しようとしています。\n再度登録しますか？";

                const isDoubleRegistrationConfirmed = await showConfirmDialog({
                    message: confirmDoubleRegistrationMessage,
                });

                if (!isDoubleRegistrationConfirmed) {
                    return;
                }
            }

            // 経由駅と移動ポイントの登録
            const response = await fetch("/api/current-location", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventCode: eventCode,
                    teamCode: selectedTeamCodeInput.value,
                    stationCode: selectedStationCodeInput.value,
                    points: GameConstants.POINT_FOR_MOVING,
                    status: GameConstants.POINT_STATUS.POINTS,
                }),
            });

            if (!response.ok) {
                throw ApplicationErrorFactory.createFromResponse(response);
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
                title: DialogConstants.TITLE.REGISTERED,
                message: getMessage("REGISTER_SUCCESS", { data: "現在地" }),
            });
            return;
        } catch (err) {
            const appError = ApplicationErrorFactory.normalize(err);
            ApplicationErrorHandler.logError(appError);

            await showAlertDialog({
                title: DialogConstants.TITLE.ERROR,
                message: getMessage("REGISTER_FAILED", { data: "現在地" }),
            });
            return;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 直近の登録と同じかどうかを確認する
     * @param {LatestTransitStations[]} latestTransitStations - 最新の経由駅のリスト
     * @param {string} teamCode - チームコード
     * @param {string} stationCode - 駅コード
     * @returns {boolean} - 同じ場合はtrue、異なる場合はfalse
     */
    const checkIsRegistered = (
        latestTransitStations: LatestTransitStations[],
        teamCode: string,
        stationCode: string
    ): boolean => {
        return latestTransitStations.some((item) => {
            return item.teamCode === teamCode && item.stationCode === stationCode;
        });
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
                            disabled={isLoading || !isOperating}
                            fullWidth
                            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {isLoading ? "送信中..." : !isOperating ? "開催をお待ち下さい" : "送信"}
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
