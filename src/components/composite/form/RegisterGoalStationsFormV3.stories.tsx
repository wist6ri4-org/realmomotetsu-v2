import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import RegisterGoalStationsFormV3 from "./RegisterGoalStationsFormV3";
import { buildEvent, buildStations } from "@/stories/mocks/fixtures";
import { goalStationsHandlers } from "@/stories/mocks/handlers";

const stations = buildStations(["STATION_A", "STATION_B"]);

const meta = {
    title: "Composite/Form/RegisterGoalStationsFormV3",
    component: RegisterGoalStationsFormV3,
    tags: ["autodocs"],
    args: {
        stations,
        event: buildEvent(),
        isOperating: true,
    },
    parameters: {
        msw: {
            handlers: { registerGoalStations: goalStationsHandlers.success({}) },
        },
    },
} satisfies Meta<typeof RegisterGoalStationsFormV3>;

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

/** 目的駅選択（オートコンプリート）・送信 → 確認ダイアログ → 登録完了ダイアログの流れを検証する。 */
export const SubmitSuccess: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const input = canvas.getByLabelText("目的駅");
        await userEvent.click(input);
        await userEvent.click(await within(document.body).findByRole("option", { name: "STATION_A" }));

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await expect(await body.findByText(/以下の内容で登録しますか？/)).toBeInTheDocument();
        await userEvent.click(body.getByRole("button", { name: "ＯＫ" }));

        await expect(await body.findByText("登録完了")).toBeInTheDocument();
    },
};
