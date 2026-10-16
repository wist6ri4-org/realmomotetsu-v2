import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SignupHeader } from "./SignupHeader";

const meta = {
    title: "Composite/SignupHeader",
    component: SignupHeader,
    tags: ["autodocs"],
} satisfies Meta<typeof SignupHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
