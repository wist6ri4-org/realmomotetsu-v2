import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import ArrivalGoalStationsFormV3 from "./ArrivalGoalStationsFormV3";
import { buildEvent, buildStations, buildTeam } from "@/stories/mocks/fixtures";
import { arrivalGoalStationV3Handlers, verifyArrivalGoalStationV3Handlers } from "@/stories/mocks/handlers";

const teams = [buildTeam({ teamCode: "TEAM_A", teamName: "チームA" })];
const stations = buildStations(["STATION_A"]);

/**
 * 処理可否チェック（`POST /api/verify/verify-arrival-goal-station-v3`）→
 * 到着処理本体（`POST /api/arrival-goal-station-v3`）の2段階API呼び出しを行う。
 */
const meta = {
    title: "Composite/Form/ArrivalGoalStationsFormV3",
    component: ArrivalGoalStationsFormV3,
    tags: ["autodocs"],
    args: {
        event: buildEvent(),
        teams,
        stations,
        isOperating: true,
    },
    parameters: {
        msw: {
            handlers: {
                verify: verifyArrivalGoalStationV3Handlers.success({ result: "VERIFIED" }),
                arrival: arrivalGoalStationV3Handlers.success({
                    points: 1000,
                    propertyPurchases: null,
                    purchasePoints: null,
                    consecutiveGoalCount: 1,
                    consecutiveGoalBonus: null,
                }),
            },
        },
    },
} satisfies Meta<typeof ArrivalGoalStationsFormV3>;

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

/** チーム選択・送信 → 確認ダイアログ → 検証OK → 到着処理完了ダイアログの流れを検証する。 */
export const SubmitSuccess: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByLabelText("チーム"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "チームA" }));

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await expect(await body.findByText(/以下の内容で到着処理を行いますか？/)).toBeInTheDocument();
        await userEvent.click(body.getByRole("button", { name: "ＯＫ" }));

        await expect(await body.findByText("登録完了")).toBeInTheDocument();
    },
};

/** 処理可否チェックがエラーを返した場合、エラーダイアログが表示される。 */
export const VerifyFailure: Story = {
    parameters: {
        msw: {
            handlers: {
                verify: verifyArrivalGoalStationV3Handlers.error(500, "Internal Server Error"),
            },
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByLabelText("チーム"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "チームA" }));

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await userEvent.click(await body.findByRole("button", { name: "ＯＫ" }));

        await expect(await body.findByText("エラー")).toBeInTheDocument();
    },
};
