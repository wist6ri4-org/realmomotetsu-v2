import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import RegisterPointsFormV3 from "./RegisterPointsFormV3";
import { buildTeam, buildTeamData } from "@/stories/mocks/fixtures";
import { pointsHandlers } from "@/stories/mocks/handlers";

const teams = [buildTeam({ teamCode: "TEAM_A", teamName: "チームA" })];
const teamData = [
    buildTeamData({ teamCode: "TEAM_A", teamName: "チームA", scoredPoints: 10_000, propertyPurchasePoints: -3_000 }),
];

const meta = {
    title: "Composite/Form/RegisterPointsFormV3",
    component: RegisterPointsFormV3,
    tags: ["autodocs"],
    args: {
        teams,
        teamData,
        isOperating: true,
    },
    parameters: {
        msw: {
            handlers: { registerPoints: pointsHandlers.success({}) },
        },
    },
} satisfies Meta<typeof RegisterPointsFormV3>;

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

/** チーム選択・送信 → 確認ダイアログ → 登録完了ダイアログの流れを検証する。 */
export const SubmitSuccess: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByLabelText("チーム"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "チームA" }));

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await expect(await body.findByText(/以下の内容でポイントを登録しますか？/)).toBeInTheDocument();
        await userEvent.click(body.getByRole("button", { name: "ＯＫ" }));

        await expect(await body.findByText("登録完了")).toBeInTheDocument();
    },
};

/** チームを選択すると現在の持ち金・資産が表示され、確認ダイアログに登録前後の持ち金・資産が表示される。 */
export const ShowsBalanceOnTeamSelect: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await expect(canvas.queryByText(/現在の持ち金:/)).not.toBeInTheDocument();

        await userEvent.click(canvas.getByLabelText("チーム"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "チームA" }));
        await expect(await canvas.findByText(/現在の持ち金: 1 億 0 万 ／ 資産: 3000 万/)).toBeInTheDocument();

        const pointsInput = canvas.getByLabelText("ポイント（単位：万円）");
        await userEvent.clear(pointsInput);
        await userEvent.type(pointsInput, "500");

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await expect(await body.findByText(/金額: 500 万/)).toBeInTheDocument();
        await expect(body.getByText(/登録後の持ち金: 1 億 500 万/)).toBeInTheDocument();
        await expect(body.getByText(/登録後の資産: 3000 万/)).toBeInTheDocument();
    },
};
