import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { CustomSelect, type SelectOption } from "./CustomSelect";

const teamOptions: SelectOption[] = [
    { value: "TEAM_A", label: "チームA" },
    { value: "TEAM_B", label: "チームB" },
    { value: "TEAM_C", label: "チームC", disabled: true },
];

const meta = {
    title: "Base/CustomSelect",
    component: CustomSelect,
    tags: ["autodocs"],
    args: {
        label: "チーム選択",
        options: teamOptions,
        value: "",
        onChange: fn(),
        sx: { width: 300 },
    },
} satisfies Meta<typeof CustomSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 選択操作でonChangeが呼ばれることを検証する。 */
export const SelectOptionInteraction: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByLabelText("チーム選択"));
        const option = await within(document.body).findByRole("option", { name: "チームB" });
        await userEvent.click(option);
        await expect(args.onChange).toHaveBeenCalled();
    },
};

export const Controlled: Story = {
    render: (args) => {
        const [value, setValue] = useState<string | number>("TEAM_A");
        return <CustomSelect {...args} value={value} onChange={(e) => setValue(e.target.value as string)} />;
    },
};

export const WithPlaceholder: Story = {
    args: { label: undefined, placeholder: "チームを選択してください" },
};

export const Loading: Story = {
    args: { loading: true },
};

export const WithError: Story = {
    args: { error: true, helperText: "チームを選択してください" },
};
