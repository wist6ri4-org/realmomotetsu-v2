import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import GoalDialog from "./GoalDialog";
import CustomButton from "../base/CustomButton";

/**
 * `isOpen`時にconfetti（`react-canvas-confetti`）をwindow.setTimeout/setIntervalで発射するが、
 * 描画・操作の検証自体には影響しない。
 *
 * NOTE: 開閉状態をローカルstateで持つ理由はAlertDialog.stories.tsxのコメントを参照。
 */
const meta = {
    title: "Composite/GoalDialog",
    component: GoalDialog,
    tags: ["autodocs"],
    render: (args) => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <>
                <CustomButton onClick={() => setIsOpen(true)}>ダイアログを開く</CustomButton>
                <GoalDialog
                    {...args}
                    isOpen={isOpen}
                    handleClose={() => {
                        args.handleClose();
                        setIsOpen(false);
                    }}
                />
            </>
        );
    },
    argTypes: {
        isOpen: { table: { disable: true } },
    },
    args: {
        goalStationName: "渋谷",
        isOpen: false,
        handleClose: fn(),
    },
} satisfies Meta<typeof GoalDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 「ダイアログを開く」ボタンで開くことを確認する。 */
export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "ダイアログを開く" }));
        await expect(within(document.body).getByText("目的地到着！！")).toBeInTheDocument();
    },
};

/** 開く→OKボタン押下でhandleCloseが呼ばれ、ダイアログが閉じることを検証する。 */
export const Close: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "ダイアログを開く" }));

        const body = within(document.body);
        await userEvent.click(body.getByRole("button", { name: "OK" }));
        await expect(args.handleClose).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(body.queryByText("目的地到着！！")).not.toBeInTheDocument());
    },
};
