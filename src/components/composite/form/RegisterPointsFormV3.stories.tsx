import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import RegisterPointsFormV3 from "./RegisterPointsFormV3";
import { buildTeam } from "@/stories/mocks/fixtures";
import { pointsHandlers } from "@/stories/mocks/handlers";

const teams = [buildTeam({ teamCode: "TEAM_A", teamName: "チームA" })];

const meta = {
    title: "Composite/Form/RegisterPointsFormV3",
    component: RegisterPointsFormV3,
    tags: ["autodocs"],
    args: {
        teams,
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
