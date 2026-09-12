/**
 * 現在地登録フォーム（V3）
 */
"use client";

import AlertDialog from "@/components/base/AlertDialog";
import ConfirmDialog from "@/components/base/ConfirmDialog";
import CustomButton from "@/components/base/CustomButton";
import CustomSelect from "@/components/base/CustomSelect";
import { DialogConstants } from "@/constants/dialogConstants";
import { DiscordNotificationTemplates } from "@/constants/discordNotificationTemplates";
import { getMessage } from "@/constants/messages";
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ApplicationErrorHandler } from "@/error/errorHandler";
import { GetLatestGoalStationsResponse } from "@/features/goal-stations/latest/types";
import { GetLatestTransitStationsResponse } from "@/features/transit-stations/latest/types";
import { Events, LatestTransitStations, Stations, StationType, Teams } from "@/generated/prisma";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useGoalDialog } from "@/hooks/useGoalDialog";
import { useDiscordNotification } from "@/hooks/useDiscordNotification";
import { useSelectInput } from "@/hooks/useSelectInput";
import { ClosestStation } from "@/types/ClosestStation";
import { TypeConverter } from "@/utils/typeConverter";
import { Box, CircularProgress } from "@mui/material";
import { useParams } from "next/navigation";
import { useState } from "react";
import GoalDialog from "../GoalDialog";
import { PostCurrentLocationV3Request, PostCurrentLocationV3Response } from "@/features/current-location-v3/types";
import CustomAutoComplete from "@/components/base/CustomAutoComplete";
import { Converter } from "@/utils/converter";

/**
 * CurrentLocationFormV3コンポーネントのプロパティ型定義
 * @property {Teams[]} teams - チームのリスト
 * @property {Stations[]} stations - 駅のリスト
 * @property {Events} event - イベント情報
 * @property {ClosestStation[]} [closestStations] - 最寄り駅のリスト（オプション）
 * @property {string} [initialTeamCode] - 初期選択されるチームコード（オプション）
 * @property {boolean} isOperating - 操作権限があるかどうか
 */
interface CurrentLocationFormV3Props {
    teams: Teams[];
    stations: Stations[];
    event: Events;
    closestStations?: ClosestStation[];
    initialTeamCode?: string;
    isOperating: boolean;
}

/**
 * 現在地登録フォームコンポーネント
 * @param { CurrentLocationFormV3Props } props - コンポーネントのプロパティ
 * @returns {JSX.Element} - CurrentLocationFormV3コンポーネント
 */
const CurrentLocationFormV3: React.FC<CurrentLocationFormV3Props> = ({
    teams,
    stations,
    event,
    closestStations,
    initialTeamCode,
    isOperating,
}: CurrentLocationFormV3Props): React.JSX.Element => {
    const params = useParams();
    const eventCode = typeof params.eventCode === "string" ? params.eventCode : "";

    const selectedTeamCodeInput = useSelectInput(initialTeamCode || "");
    const selectedStationCodeInput = useSelectInput(
        closestStations?.[0]?.stationCode ? String(closestStations?.[0]?.stationCode) : ""
    );

    const { isConfirmOpen, dialogOptions, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();
    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();
    const { isGoalDialogOpen, showGoalDialog, handleClose } = useGoalDialog();

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
            discordWebhookUrl: event.discordWebhookUrl,
            templateName: DiscordNotificationTemplates.ARRIVAL_GOAL_STATION,
            variables: {
                teamName: teams.find((team) => team.teamCode === selectedTeamCodeInput.value)?.teamName || "不明",
                stationName:
                    stations.find((station) => station.stationCode === selectedStationCodeInput.value)?.name || "不明",
            },
        });
    };

    /**
     * 収益獲得通知を送信する
     * @returns {Promise<void>} - 通知送信の完了を示すPromise
     */
    const notifyToTeamDiscord = async (discordWebhookUrl: string, revenue: number): Promise<void> => {
        await sendNotification({
            discordWebhookUrl: discordWebhookUrl,
            templateName: DiscordNotificationTemplates.EARN_REVENUE,
            variables: {
                stationName: stations.find((station) => station.stationCode === selectedStationCodeInput.value)?.name || "不明",
                revenueYen: Converter.convertPointsToYenV3(revenue),
            }
        })
    }

    /**
     * 最新の目的駅の駅コードを取得
     * @returns {Promise<string>} - 次の目的駅の駅コード
     */
    const fetchNextGoalStationCode = async (): Promise<string> => {
        try {
            const response = await fetch(`/api/goal-stations/latest?eventCode=${eventCode}`);
            if (!response.ok) {
                throw ApplicationErrorFactory.createFromErrorBody(response.status, await response.json());
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
    const registerTransitStation = async (e: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        clearError();

        const team = teams.find((team) => team.teamCode === selectedTeamCodeInput.value) as Teams;
        const station = stations.find((station) => station.stationCode === selectedStationCodeInput.value) as Stations;

        const teamName = team.teamName || "不明";
        const stationName = station.name || "不明";

        const confirmMessage = "以下の内容で登録しますか？\n\n" + `チーム: ${teamName}\n` + `駅: ${stationName}`;
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
            params.append("eventCode", eventCode);
            const responseForCheck = await fetch("/api/transit-stations/latest?" + params.toString());
            if (!responseForCheck.ok) {
                throw ApplicationErrorFactory.createFromErrorBody(responseForCheck.status, await responseForCheck.json());
            }
            const data: GetLatestTransitStationsResponse = (await responseForCheck.json()).data;
            const latestTransitStations: LatestTransitStations[] = data.latestTransitStations || [];

            if (checkIsRegistered(latestTransitStations, team.teamCode, station.stationCode)) {
                const confirmDoubleRegistrationMessage =
                    "直近に登録した駅と同じ駅を登録しようとしています。\n\n再度登録しますか？";

                const isDoubleRegistrationConfirmed = await showConfirmDialog({
                    message: confirmDoubleRegistrationMessage,
                    confirmText: "登録する"
                });

                if (!isDoubleRegistrationConfirmed) {
                    return;
                }
            }

            // 経由駅と収益の登録
            const response = await fetch("/api/current-location-v3", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventCode: eventCode,
                    teamCode: selectedTeamCodeInput.value,
                    stationCode: selectedStationCodeInput.value,
                } satisfies PostCurrentLocationV3Request),
            });

            if (!response.ok) {
                throw ApplicationErrorFactory.createFromErrorBody(response.status, await response.json());
            }
            const responseData: PostCurrentLocationV3Response = (await response.json()).data;

            // 収益獲得通知を送信
            if (responseData.point && event.isNotificationEnabled && responseData.teamDiscordWebhookUrl) {
                notifyToTeamDiscord(responseData.teamDiscordWebhookUrl, responseData.point.points);
            }

            // 最新の目的駅の駅コードを取得
            const nextGoalStationCode = await fetchNextGoalStationCode();
            if (event.isNotificationEnabled && event.discordWebhookUrl && selectedStationCodeInput.value === nextGoalStationCode) {
                // 目的駅に到着した場合、Discord通知を送信
                notifyToDiscord();
            }

            await showAlertDialog({
                title: DialogConstants.TITLE.REGISTERED,
                message: getMessage("REGISTER_SUCCESS", { data: "現在地" }),
                buttonColor: "primary",
            });

            switch (responseData.stationType) {
                // ミッション駅の場合
                case StationType.mission: {
                    // 目的駅に到着した場合、ゴールダイアログを表示
                    if (selectedStationCodeInput.value === nextGoalStationCode) {
                        await showGoalDialog();
                    }

                    // ミッション駅到着のダイアログを表示
                    await showAlertDialog({
                        title: DialogConstants.TITLE.MISSION_STATION,
                        message: getMessage(
                            "MISSION_STATION_ARRIVAL",
                            { stationName: station.name, stationNameKana: station.kana }
                        ),
                        buttonColor: "primary",
                    });
                    break;
                }

                // プラス駅の場合
                case StationType.plus: {
                    // プラス額を表示するダイアログを表示
                    const plusPoints = responseData.point?.points ?? 0;
                    await showAlertDialog({
                        title: DialogConstants.TITLE.PLUS_STATION,
                        message: getMessage(
                            "PLUS_STATION_ARRIVAL",
                            { teamName: team.teamName, points: Converter.convertPointsToYenV3(plusPoints) }
                        ),
                        buttonColor: "primary",
                    });
                    break;
                }

                // マイナス駅の場合
                case StationType.minus: {
                    // マイナス額を表示するダイアログを表示
                    const minusPoints = responseData.point?.points ?? 0;
                    await showAlertDialog({
                        title: DialogConstants.TITLE.MINUS_STATION,
                        message: getMessage(
                            "MINUS_STATION_ARRIVAL",
                            { teamName: team.teamName, points: Converter.convertPointsToYenV3(-1 * minusPoints) }
                        ),
                        buttonColor: "primary",
                    });
                    break;
                }

                // カード駅の場合
                case StationType.card: {
                    // カード駅到着のダイアログを表示
                    await showAlertDialog({
                        title: DialogConstants.TITLE.CARD_STATION,
                        message: getMessage(
                            "CARD_STATION_ARRIVAL",
                            { stationName: station.name, stationNameKana: station.kana }
                        ),
                        buttonColor: "primary",
                    });
                    break;
                }

                // 宝くじ駅の場合
                case StationType.treasure: {
                    // 宝くじ駅到着のダイアログを表示
                    await showAlertDialog({
                        title: DialogConstants.TITLE.TREASURE_STATION,
                        message: getMessage(
                            "TREASURE_STATION_ARRIVAL",
                            { stationName: station.name, stationNameKana: station.kana }
                        ),
                        buttonColor: "primary",
                    });
                    break;
                }
            }

            selectedTeamCodeInput.reset();
            selectedStationCodeInput.reset();

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
                        <CustomAutoComplete
                            options={TypeConverter.convertStationsToAutoCompleteOptions(stations)}
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
                            {isLoading ? "送信中..." : !isOperating ? "準備中" : "送信"}
                        </CustomButton>
                    </Box>
                </Box>
            </Box>
            <ConfirmDialog
                isConfirmOpen={isConfirmOpen}
                title={dialogOptions.title}
                message={dialogOptions.message}
                confirmButtonColor={dialogOptions.confirmButtonColor}
                onConfirm={handleConfirm}
                cancelButtonColor={dialogOptions.cancelButtonColor}
                onCancel={handleCancel}
                confirmText={dialogOptions.confirmText}
            />
            <AlertDialog
                isAlertOpen={isAlertOpen}
                title={alertOptions.title}
                message={alertOptions.message}
                buttonColor={alertOptions.buttonColor}
                onOk={handleAlertOk}
                okText={alertOptions.okText}
            />
            <GoalDialog
                goalStationName={stations.find((station) => station.stationCode === selectedStationCodeInput.value)?.name || "不明"}
                isOpen={isGoalDialogOpen}
                handleClose={handleClose}
            />
        </>
    );
};

export default CurrentLocationFormV3;
