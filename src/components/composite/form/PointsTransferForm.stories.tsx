import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import PointsTransferForm from "./PointsTransferForm";
import { buildTeam } from "@/stories/mocks/fixtures";
import { pointsHandlers } from "@/stories/mocks/handlers";

const teams = [
    buildTeam({ teamCode: "TEAM_A", teamName: "チームA" }),
    buildTeam({ teamCode: "TEAM_B", teamName: "チームB" }),
];

/** 移動元・移動先の2チームに対し並列で`POST /api/points`を呼ぶ。 */
const meta = {
    title: "Composite/Form/PointsTransferForm",
    component: PointsTransferForm,
    tags: ["autodocs"],
    args: {
        teams,
        isOperating: true,
    },
    parameters: {
        msw: {
            handlers: { transferPoints: pointsHandlers.success({}) },
        },
    },
} satisfies Meta<typeof PointsTransferForm>;

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
        // NOTE: ラジオボタンの選択肢ラベルも「ポイント」のため、getByLabelTextだと曖昧になる。
        const pointsInput = canvas.getByRole("textbox", { name: "ポイント" });
        await userEvent.clear(pointsInput);
        await userEvent.type(pointsInput, "500");

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await expect(await body.findByText(/以下の内容でポイントを移動しますか？/)).toBeInTheDocument();
        await userEvent.click(body.getByRole("button", { name: "ＯＫ" }));

        await expect(await body.findByText("更新完了")).toBeInTheDocument();
    },
};
