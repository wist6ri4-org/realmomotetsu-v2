import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import CustomButton from "./CustomButton";

const meta = {
    title: "Base/CustomButton",
    component: CustomButton,
    tags: ["autodocs"],
    args: {
        children: "ボタン",
        onClick: fn(),
    },
    argTypes: {
        color: {
            control: "select",
            options: [
                "primary",
                "secondary",
                "success",
                "error",
                "warning",
                "info",
                "light",
                "team1",
                "team2",
                "team3",
                "team4",
            ],
        },
        size: { control: "select", options: ["small", "medium", "large"] },
        variant: { control: "select", options: ["contained", "outlined", "text"] },
    },
} satisfies Meta<typeof CustomButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 既定表示 */
export const Default: Story = {};

/** クリック操作の検証。play functionでクリックしonClickが呼ばれることを確認する。 */
export const Clickable: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const button = canvas.getByRole("button", { name: "ボタン" });
        await userEvent.click(button);
        await expect(args.onClick).toHaveBeenCalledTimes(1);
    },
};

/** ローディング状態。テキストが"Loading..."に切り替わり操作不能になることを確認する。 */
export const Loading: Story = {
    args: { loading: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const button = canvas.getByRole("button", { name: "Loading..." });
        await expect(button).toBeDisabled();
    },
};

/** 無効状態 */
export const Disabled: Story = {
    args: { disabled: true },
};

/** チームカラーのバリエーション */
export const TeamColors: Story = {
    render: (args) => (
        <>
            <CustomButton {...args} color="team1">
                チーム1
            </CustomButton>
            <CustomButton {...args} color="team2">
                チーム2
            </CustomButton>
            <CustomButton {...args} color="team3">
                チーム3
            </CustomButton>
            <CustomButton {...args} color="team4">
                チーム4
            </CustomButton>
        </>
    ),
};
