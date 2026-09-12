import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PointExchangerDisplay from "./PointExchangerDisplay";

const meta = {
    title: "Base/PointExchangerDisplay",
    component: PointExchangerDisplay,
    tags: ["autodocs"],
    args: {
        points: 1000,
    },
} satisfies Meta<typeof PointExchangerDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Zero: Story = {
    args: { points: 0 },
};

export const LargeAmount: Story = {
    args: { points: 999999 },
};
