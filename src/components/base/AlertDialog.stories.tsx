import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import AlertDialog from "./AlertDialog";
import CustomButton from "./CustomButton";

const meta = {
    title: "Base/AlertDialog",
    component: AlertDialog,
    tags: ["autodocs"],
    // NOTE: 実際のアプリと同じく「ボタンを押して開く→ダイアログ内のボタンを押して閉じる」を
    //       storyでも再現できるよう、開閉状態はargsではなくstory側のローカルstateで持つ。
    //       常時open（args側でisAlertOpen:trueを既定にする）にすると、MUIのDialogがPortalで
    //       document.body直下に描画するposition:fixedのバックドロップがDocsページ全体
    //       （Controls表を含む）を覆ってしまう。`docs.story.inline:false`で個別iframeに
    //       分離する手もあるが、その場合DocsページのControlsから値を変更しても反映されなくなる
    //       （いずれもStorybookの制約）ため、このローカルstate方式を採用している。
    render: (args) => {
        const [isAlertOpen, setIsAlertOpen] = useState(false);
        return (
            <>
                <CustomButton onClick={() => setIsAlertOpen(true)}>ダイアログを開く</CustomButton>
                <AlertDialog
                    {...args}
                    isAlertOpen={isAlertOpen}
                    onOk={() => {
                        args.onOk();
                        setIsAlertOpen(false);
                    }}
                />
            </>
        );
    },
    argTypes: {
        // ローカルstateで管理するため、Controlsから直接操作しても反映されない。混乱を避けるため非表示にする。
        isAlertOpen: { table: { disable: true } },
    },
    args: {
        isAlertOpen: false,
        title: "計算結果",
        message: "洗足池ミッションの得点は 1000 点です。",
        onOk: fn(),
    },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 「ダイアログを開く」ボタンで開くことを確認する。 */
export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "ダイアログを開く" }));
        await expect(within(document.body).getByText("計算結果")).toBeInTheDocument();
    },
};

export const WithoutTitle: Story = {
    args: { title: undefined },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "ダイアログを開く" }));
        await expect(within(document.body).getByText("洗足池ミッションの得点は 1000 点です。")).toBeInTheDocument();
    },
};

/** 開く→OKボタン押下でonOkが呼ばれ、ダイアログが閉じることを検証する。 */
export const ConfirmOk: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "ダイアログを開く" }));

        const body = within(document.body);
        await userEvent.click(body.getByRole("button", { name: "閉じる" }));
        await expect(args.onOk).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(body.queryByText("計算結果")).not.toBeInTheDocument());
    },
};
