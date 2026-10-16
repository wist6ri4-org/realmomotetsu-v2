import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import ArrivalGoalStationsForm from "./ArrivalGoalStationsForm";
import { buildTeam } from "@/stories/mocks/fixtures";
import { pointsHandlers, pointsUpdateHandlers } from "@/stories/mocks/handlers";

const teams = [buildTeam({ teamCode: "TEAM_A", teamName: "チームA" })];

/**
 * 到着ポイント登録（`POST /api/points`）と、既存ポイントの`scored`化（`PUT /api/points`）の
 * 2回のAPI呼び出しを行う。
 */
const meta = {
    title: "Composite/Form/ArrivalGoalStationsForm",
    component: ArrivalGoalStationsForm,
    tags: ["autodocs"],
    args: {
        teams,
        isOperating: true,
    },
    parameters: {
        msw: {
            handlers: {
                createPoints: pointsHandlers.success({}),
                updatePoints: pointsUpdateHandlers.success({}),
            },
        },
    },
} satisfies Meta<typeof ArrivalGoalStationsForm>;

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

/** チーム選択・到着ポイント入力・送信 → 確認ダイアログ → 登録完了ダイアログの流れを検証する。 */
export const SubmitSuccess: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByLabelText("チーム"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "チームA" }));

        // 到着ポイントは0だとバリデーションエラーになるため、正の値を入力する。
        const pointsInput = canvas.getByLabelText("到着ポイント");
        await userEvent.clear(pointsInput);
        await userEvent.type(pointsInput, "500");

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await expect(await body.findByText(/以下の内容で到着処理を行いますか？/)).toBeInTheDocument();
        await userEvent.click(body.getByRole("button", { name: "ＯＫ" }));

        await expect(await body.findByText("登録完了")).toBeInTheDocument();
    },
};
