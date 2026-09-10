import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { CustomRadio, type RadioOption } from "./CustomRadio";

const modeOptions: RadioOption[] = [
    { value: "normal", label: "通常モード" },
    { value: "mission", label: "ミッションモード" },
];

const meta = {
    title: "Base/CustomRadio",
    component: CustomRadio,
    tags: ["autodocs"],
    args: {
        label: "ルーレットモード",
        options: modeOptions,
        onChange: fn(),
    },
} satisfies Meta<typeof CustomRadio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Row: Story = {
    args: { row: true },
};

/** ラジオボタンをクリックするとonChangeが呼ばれることを検証する。 */
export const SelectOptionInteraction: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByLabelText("ミッションモード"));
        await expect(args.onChange).toHaveBeenCalled();
    },
};

export const Controlled: Story = {
    render: (args) => {
        const [value, setValue] = useState<string | number>("normal");
        return <CustomRadio {...args} value={value} onChange={(_e, v) => setValue(v)} />;
    },
};

export const Loading: Story = {
    args: { loading: true },
};

export const WithError: Story = {
    args: { error: true, helperText: "モードを選択してください" },
};
