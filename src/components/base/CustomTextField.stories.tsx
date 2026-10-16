import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { CustomTextField } from "./CustomTextField";

const meta = {
    title: "Base/CustomTextField",
    component: CustomTextField,
    tags: ["autodocs"],
    args: {
        label: "チーム名",
        onChange: fn(),
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
        variant: { control: "select", options: ["outlined", "filled", "standard"] },
        size: { control: "select", options: ["small", "medium"] },
    },
} satisfies Meta<typeof CustomTextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 実際にキー入力してonChangeが呼ばれることを検証する（表示は非制御のためvalue自体は変化しない）。 */
export const TypingCallsOnChange: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByLabelText("チーム名");
        await userEvent.type(input, "チームA");
        await expect(args.onChange).toHaveBeenCalled();
    },
};

/** valueとonChangeをstoryローカルのstateで結び、実際に入力できる状態を再現する。 */
export const Controlled: Story = {
    render: (args) => {
        const [value, setValue] = useState("");
        return <CustomTextField {...args} value={value} onChange={(e) => setValue(e.target.value)} />;
    },
};

export const WithError: Story = {
    args: { error: true, helperText: "チーム名は必須です" },
};

export const Loading: Story = {
    args: { loading: true },
};

export const PasswordToggle: Story = {
    args: { label: "パスワード", type: "password", showPasswordToggle: true },
};
