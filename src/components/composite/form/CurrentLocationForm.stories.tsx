import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import CurrentLocationForm from "./CurrentLocationForm";
import { buildEvent, buildGoalStation, buildStations, buildTeam } from "@/stories/mocks/fixtures";
import { currentLocationHandlers, goalStationsLatestHandlers, transitStationsLatestHandlers } from "@/stories/mocks/handlers";

const teams = [buildTeam({ teamCode: "TEAM_A", teamName: "チームA" })];
const stations = buildStations(["STATION_A", "STATION_B"]);

/**
 * 二重登録チェック（`GET /api/transit-stations/latest`）→ 現在地登録（`POST /api/current-location`）→
 * 次の目的駅取得（`GET /api/goal-stations/latest`、Discord通知の要否判定用）の順にAPIを呼ぶ。
 */
const meta = {
    title: "Composite/Form/CurrentLocationForm",
    component: CurrentLocationForm,
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
                currentLocation: currentLocationHandlers.success({}),
                goalStationsLatest: goalStationsLatestHandlers.success({ goalStation: buildGoalStation() }),
            },
        },
    },
} satisfies Meta<typeof CurrentLocationForm>;

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

/** チーム・駅選択・送信 → 確認ダイアログ → 登録完了ダイアログの流れを検証する。 */
export const SubmitSuccess: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByLabelText("チーム名"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "チームA" }));

        await userEvent.click(canvas.getByLabelText("今いる駅"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "STATION_A" }));

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await expect(await body.findByText(/以下の内容で登録しますか？/)).toBeInTheDocument();
        await userEvent.click(body.getByRole("button", { name: "ＯＫ" }));

        await expect(await body.findByText("登録完了")).toBeInTheDocument();
    },
};

/** 直近と同じ駅を再登録しようとすると、二重登録の確認ダイアログが追加で表示される。 */
export const DoubleRegistration: Story = {
    parameters: {
        msw: {
            handlers: {
                transitStationsLatest: transitStationsLatestHandlers.success({
                    latestTransitStations: [{ id: 1, teamCode: "TEAM_A", stationCode: "STATION_A", eventCode: "TEST_EVENT", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
                }),
            },
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByLabelText("チーム名"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "チームA" }));

        await userEvent.click(canvas.getByLabelText("今いる駅"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "STATION_A" }));

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await userEvent.click(await body.findByRole("button", { name: "ＯＫ" }));

        await expect(await body.findByText(/直近に登録した駅と同じ駅を登録しようとしています。/)).toBeInTheDocument();
    },
};
