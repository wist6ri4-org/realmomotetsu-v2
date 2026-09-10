import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Assignment } from "@mui/icons-material";
import FormTitle from "./FormTitle";

const meta = {
    title: "Base/FormTitle",
    component: FormTitle,
    tags: ["autodocs"],
    args: {
        title: "到着報告フォーム",
    },
} satisfies Meta<typeof FormTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIcon: Story = {
    args: {
        icon: <Assignment sx={{ fontSize: "2rem", marginRight: 1 }} />,
    },
};
