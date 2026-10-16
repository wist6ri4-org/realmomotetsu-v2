import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import CurrentLocationFormV03 from "./CurrentLocationFormV03";
import { buildEvent, buildGoalStation, buildStations, buildTeam } from "@/stories/mocks/fixtures";
import { currentLocationV3Handlers, goalStationsLatestHandlers, transitStationsLatestHandlers } from "@/stories/mocks/handlers";

const teams = [buildTeam({ teamCode: "TEAM_A", teamName: "チームA" })];
const stations = buildStations(["STATION_A", "STATION_B"]);

/**
 * `CurrentLocationForm`のV3版。到着した駅種別（`stationType`）に応じて追加のダイアログ
 * （ミッション/プラス/マイナス/カード/宝くじ駅）や、目的駅到着時は`GoalDialog`（confetti）を表示する。
 */
const meta = {
    title: "Composite/Form/CurrentLocationFormV03",
    component: CurrentLocationFormV03,
    tags: ["autodocs"],
    args: {
        teams,
        stations,
        event: buildEvent(),
        isOperating: true,
    },
    parameters: {
        msw: {
            handlers: {
                transitStationsLatest: transitStationsLatestHandlers.success({ latestTransitStations: [] }),
                currentLocation: currentLocationV3Handlers.success({
                    transitStation: {
                        id: 1,
                        stationCode: "STATION_A",
                        teamCode: "TEAM_A",
                        eventCode: "TEST_EVENT",
                        isGoal: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    stationType: "mission",
                }),
                goalStationsLatest: goalStationsLatestHandlers.success({
                    goalStation: buildGoalStation({ stationCode: "STATION_B" }),
                }),
            },
        },
    },
} satisfies Meta<typeof CurrentLocationFormV03>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NotOperating: Story = {
    args: { isOperating: false },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole("button", { name: "準備中" })).toBeDisabled();
    },
};

/** ミッション駅（目的駅ではない）に到着した場合、登録完了 → ミッション駅到着のダイアログが順に表示される。 */
export const SubmitSuccessMissionStation: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByLabelText("チーム名"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "チームA" }));

        await userEvent.click(canvas.getByLabelText("今いる駅"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "STATION_A" }));

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await userEvent.click(await body.findByRole("button", { name: "ＯＫ" }));
        await expect(await body.findByText("登録完了")).toBeInTheDocument();
        await userEvent.click(body.getByRole("button", { name: "閉じる" }));

        await waitFor(() => expect(body.getByRole("heading", { name: "ミッション駅　到着！" })).toBeInTheDocument(), {
            timeout: 3000,
        });
    },
};
