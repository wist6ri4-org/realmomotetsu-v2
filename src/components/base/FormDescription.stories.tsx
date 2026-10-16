import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import FormDescription from "./FormDescription";

const meta = {
    title: "Base/FormDescription",
    component: FormDescription,
    tags: ["autodocs"],
    args: {
        children: "移動先の駅に到着したら、このフォームから到着報告を送信してください。",
    },
} satisfies Meta<typeof FormDescription>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
