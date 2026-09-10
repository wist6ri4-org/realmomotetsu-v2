import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import ConfirmDialog from "./ConfirmDialog";
import CustomButton from "./CustomButton";

const meta = {
    title: "Base/ConfirmDialog",
    component: ConfirmDialog,
    tags: ["autodocs"],
    // NOTE: 開閉状態をローカルstateで持つ理由はAlertDialog.stories.tsxのコメントを参照。
    render: (args) => {
        const [isConfirmOpen, setIsConfirmOpen] = useState(false);
        return (
            <>
                <CustomButton onClick={() => setIsConfirmOpen(true)}>ダイアログを開く</CustomButton>
                <ConfirmDialog
                    {...args}
                    isConfirmOpen={isConfirmOpen}
                    onConfirm={() => {
                        args.onConfirm();
                        setIsConfirmOpen(false);
                    }}
                    onCancel={() => {
                        args.onCancel();
                        setIsConfirmOpen(false);
                    }}
                />
            </>
        );
    },
    argTypes: {
        isConfirmOpen: { table: { disable: true } },
    },
    args: {
        isConfirmOpen: false,
        title: "確認",
        message: "本当に登録しますか？",
        onConfirm: fn(),
        onCancel: fn(),
    },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 「ダイアログを開く」ボタンで開くことを確認する。 */
export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "ダイアログを開く" }));
        await expect(within(document.body).getByText("本当に登録しますか？")).toBeInTheDocument();
    },
};

/** 開く→ＯＫボタン押下でonConfirmが呼ばれ、ダイアログが閉じることを検証する。 */
export const Confirm: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "ダイアログを開く" }));

        const body = within(document.body);
        await userEvent.click(body.getByRole("button", { name: "ＯＫ" }));
        await expect(args.onConfirm).toHaveBeenCalledTimes(1);
        await expect(args.onCancel).not.toHaveBeenCalled();
        await waitFor(() => expect(body.queryByText("本当に登録しますか？")).not.toBeInTheDocument());
    },
};

/** 開く→キャンセルボタン押下でonCancelが呼ばれ、ダイアログが閉じることを検証する。 */
export const Cancel: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "ダイアログを開く" }));

        const body = within(document.body);
        await userEvent.click(body.getByRole("button", { name: "キャンセル" }));
        await expect(args.onCancel).toHaveBeenCalledTimes(1);
        await expect(args.onConfirm).not.toHaveBeenCalled();
        await waitFor(() => expect(body.queryByText("本当に登録しますか？")).not.toBeInTheDocument());
    },
};
