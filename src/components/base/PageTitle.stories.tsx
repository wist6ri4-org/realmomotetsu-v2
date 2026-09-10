import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Casino } from "@mui/icons-material";
import PageTitle from "./PageTitle";

const meta = {
    title: "Base/PageTitle",
    component: PageTitle,
    tags: ["autodocs"],
    args: {
        title: "駅ルーレット",
    },
} satisfies Meta<typeof PageTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 既定表示 */
export const Default: Story = {};

/** アイコン付き */
export const WithIcon: Story = {
    args: {
        icon: <Casino sx={{ fontSize: "3.5rem", marginRight: 1 }} />,
    },
};
