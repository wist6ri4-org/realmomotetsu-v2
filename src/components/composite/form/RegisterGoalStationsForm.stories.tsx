import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import RegisterGoalStationsForm from "./RegisterGoalStationsForm";
import { buildEvent, buildStations } from "@/stories/mocks/fixtures";
import { goalStationsHandlers } from "@/stories/mocks/handlers";

const stations = buildStations(["STATION_A", "STATION_B"]);

const meta = {
    title: "Composite/Form/RegisterGoalStationsForm",
    component: RegisterGoalStationsForm,
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
} satisfies Meta<typeof RegisterGoalStationsForm>;

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

/** 目的駅選択・送信 → 確認ダイアログ → 登録完了ダイアログの一連の流れを検証する。 */
export const SubmitSuccess: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByLabelText("目的駅"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "STATION_A" }));

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await expect(await body.findByText(/以下の内容で登録しますか？/)).toBeInTheDocument();
        await userEvent.click(body.getByRole("button", { name: "ＯＫ" }));

        await expect(await body.findByText("登録完了")).toBeInTheDocument();
    },
};

export const SubmitFailure: Story = {
    parameters: {
        msw: {
            handlers: { registerGoalStations: goalStationsHandlers.error(500, "Internal Server Error") },
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByLabelText("目的駅"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "STATION_A" }));

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await userEvent.click(await body.findByRole("button", { name: "ＯＫ" }));

        await expect(await body.findByText("エラー")).toBeInTheDocument();
    },
};
