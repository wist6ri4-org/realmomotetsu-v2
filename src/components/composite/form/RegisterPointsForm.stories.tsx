import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import RegisterPointsForm from "./RegisterPointsForm";
import { buildTeam } from "@/stories/mocks/fixtures";
import { pointsHandlers } from "@/stories/mocks/handlers";

const teams = [buildTeam({ teamCode: "TEAM_A", teamName: "チームA" }), buildTeam({ teamCode: "TEAM_B", teamName: "チームB" })];

/**
 * `next/navigation`の`useParams`と`fetch POST /api/points`に依存する。
 * APIはMSWでモックし、`parameters.msw.handlers`で成功/失敗を切り替える。
 */
const meta = {
    title: "Composite/Form/RegisterPointsForm",
    component: RegisterPointsForm,
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
} satisfies Meta<typeof RegisterPointsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 操作権限が無い場合、送信ボタンが「準備中」となり無効化される。 */
export const NotOperating: Story = {
    args: { isOperating: false },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole("button", { name: "準備中" })).toBeDisabled();
    },
};

/** チーム選択・ポイント入力・送信 → 確認ダイアログ → 登録完了ダイアログの一連の流れを検証する。 */
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

/** APIがエラーを返す場合、失敗ダイアログが表示される。 */
export const SubmitFailure: Story = {
    parameters: {
        msw: {
            handlers: { registerPoints: pointsHandlers.error(500, "Internal Server Error") },
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
