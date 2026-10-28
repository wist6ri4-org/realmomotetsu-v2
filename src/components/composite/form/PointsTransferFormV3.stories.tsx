import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import PointsTransferFormV3 from "./PointsTransferFormV3";
import { buildTeam, buildTeamData } from "@/stories/mocks/fixtures";
import { pointsBulkHandlers } from "@/stories/mocks/handlers";

const teams = [
    buildTeam({ teamCode: "TEAM_A", teamName: "チームA" }),
    buildTeam({ teamCode: "TEAM_B", teamName: "チームB" }),
];
const teamData = [
    buildTeamData({ teamCode: "TEAM_A", teamName: "チームA", scoredPoints: 10_000 }),
    buildTeamData({ id: 2, teamCode: "TEAM_B", teamName: "チームB", scoredPoints: 2_000 }),
];

const meta = {
    title: "Composite/Form/PointsTransferFormV3",
    component: PointsTransferFormV3,
    tags: ["autodocs"],
    args: {
        teams,
        teamData,
        isOperating: true,
    },
    parameters: {
        msw: {
            handlers: { transferPoints: pointsBulkHandlers.success({}) },
        },
    },
} satisfies Meta<typeof PointsTransferFormV3>;

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

/** 移動元・移動先チームを選択して送信 → 確認ダイアログ → 更新完了ダイアログの流れを検証する。 */
export const SubmitSuccess: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByLabelText("移動元チーム"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "チームA" }));

        await userEvent.click(canvas.getByLabelText("移動先チーム"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "チームB" }));

        // ポイントは0だとバリデーションエラーになるため、正の値を入力する。
        const pointsInput = canvas.getByLabelText("ポイント（単位：万円）");
        await userEvent.clear(pointsInput);
        await userEvent.type(pointsInput, "500");

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await expect(await body.findByText(/以下の内容でポイントを移動しますか？/)).toBeInTheDocument();
        await userEvent.click(body.getByRole("button", { name: "ＯＫ" }));

        await expect(await body.findByText("更新完了")).toBeInTheDocument();
    },
};

/** 確認ダイアログに、移動元・移動先それぞれの移動前後の持ち金が表示される。 */
export const ShowsBalanceChange: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByLabelText("移動元チーム"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "チームA" }));
        await expect(await canvas.findByText(/現在の持ち金: 1 億 0 万/)).toBeInTheDocument();

        await userEvent.click(canvas.getByLabelText("移動先チーム"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "チームB" }));
        await expect(await canvas.findByText(/現在の持ち金: 2000 万/)).toBeInTheDocument();

        const pointsInput = canvas.getByLabelText("ポイント（単位：万円）");
        await userEvent.clear(pointsInput);
        await userEvent.type(pointsInput, "500");

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await expect(await body.findByText(/持ち金: 1 億 0 万 → 9500 万/)).toBeInTheDocument();
        await expect(body.getByText(/持ち金: 2000 万 → 2500 万/)).toBeInTheDocument();
    },
};
