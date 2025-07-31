/**
 * 現在地登録フォーム
 */
"use client";

import CustomButton from "@/components/base/CustomButton";
import CustomSelect from "@/components/base/CustomSelect";
import { DiscordNotificationTemplates } from "@/constants/discordNotificationTemplates";
import { Stations, Teams } from "@/generated/prisma";
import { useDiscordNotification } from "@/hooks/useDiscordNotification";
import { useSelectInput } from "@/hooks/useSelectInput";
import { ClosestStation } from "@/types/ClosestStation";
import { TypeConverter } from "@/utils/typeConverter";
import { Box } from "@mui/material";
import { useParams } from "next/navigation";

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

    const { sendNotification, clearError } = useDiscordNotification();

    /**
     * Discord通知を送信する
     * @description
     * 目的駅到着時
     */
    const notifyToDiscord = async (): Promise<void> => {
        await sendNotification({
            templateName: DiscordNotificationTemplates.ARRIVAL_GOAL_STATION,
            variables: {
                teamName:
                    teams.find((team) => team.teamCode === selectedTeamCodeInput.value)?.teamName ||
                    "不明",
                stationName:
                    stations.find(
                        (station) => station.stationCode === selectedStationCodeInput.value
                    )?.name || "不明",
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
            alert("次の目的駅の取得に失敗しました。");
            return "";
        }
    };

    /**
     * データの登録
     */
    const registerTransitStation = async () => {
        clearError();
        const isConfirmed = confirm(
            "以下の内容で登録しますか？\n" +
                `チーム: ${selectedTeamCodeInput.value}\n` +
                `駅: ${selectedStationCodeInput.value}`
        );
        if (!isConfirmed) {
            return;
        }
        try {
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
            alert("登録されました。");
        } catch (error) {
            console.error("Error creating transit station:", error);
            alert("登録に失敗しました。");
            return;
        }
    };

    return (
        <>
            <Box>
                <Box
                    border={1}
                    borderRadius={1}
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
                        />
                    </Box>
                    <Box sx={{ marginTop: 5 }}>
                        <CustomButton fullWidth onClick={registerTransitStation}>
                            送信
                        </CustomButton>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default CurrentLocationForm;
