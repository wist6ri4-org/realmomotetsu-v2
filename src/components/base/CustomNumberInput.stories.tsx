import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CustomNumberInput } from "./CustomNumberInput";

const meta = {
    title: "Base/CustomNumberInput",
    component: CustomNumberInput,
    tags: ["autodocs"],
    args: {
        label: "ポイント",
        min: 0,
        step: 1,
    },
} satisfies Meta<typeof CustomNumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSteppers: Story = {
    args: { showSteppers: true },
};

export const Controlled: Story = {
    render: (args) => {
        const [value, setValue] = useState<number | undefined>(0);
        return (
            <CustomNumberInput
                {...args}
                showSteppers
                value={value}
                onChange={(e) => {
                    const target = e as { target: { value: unknown } };
                    setValue(typeof target.target.value === "number" ? target.target.value : undefined);
                }}
            />
        );
    },
};

export const Loading: Story = {
    args: { loading: true },
};

export const WithError: Story = {
    args: { error: true, helperText: "0以上の数値を入力してください" },
};
