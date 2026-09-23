import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { UpdatedTime } from "./UpdatedTime";

/**
 * 表示時刻はマウント時の`new Date()`に依存するため、storyでは
 * 「ラベルが表示されること」のみを検証し、具体的な時刻の値は検証しない。
 */
const meta = {
    title: "Base/UpdatedTime",
    component: UpdatedTime,
    tags: ["autodocs"],
} satisfies Meta<typeof UpdatedTime>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/最終更新日時:/)).toBeInTheDocument();
    },
};

export const AlignedLeft: Story = {
    args: { textAlign: "left" },
};

export const HeadingVariant: Story = {
    args: { variant: "h5" },
};
