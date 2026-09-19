import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PageDescription from "./PageDescription";

const meta = {
    title: "Base/PageDescription",
    component: PageDescription,
    tags: ["autodocs"],
    args: {
        children: "このページでは、チームの現在地を登録できます。",
    },
} satisfies Meta<typeof PageDescription>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
