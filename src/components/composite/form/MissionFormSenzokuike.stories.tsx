import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import MissionFormSenzokuike from "./MissionFormSenzokuike";

/**
 * props・外部依存（fetch/context）を持たない単体完結のフォーム。
 */
const meta = {
    title: "Composite/Form/MissionFormSenzokuike",
    component: MissionFormSenzokuike,
    tags: ["autodocs"],
} satisfies Meta<typeof MissionFormSenzokuike>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 送信ボタン押下で計算結果のAlertDialogが表示されることを検証する。 */
export const SubmitShowsResult: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await expect(await body.findByText("計算結果")).toBeInTheDocument();
        await expect(body.getByText(/点です。/)).toBeInTheDocument();

        await userEvent.click(body.getByRole("button", { name: "閉じる" }));
    },
};
