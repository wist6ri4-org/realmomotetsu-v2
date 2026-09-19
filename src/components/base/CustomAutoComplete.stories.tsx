import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { CustomAutoComplete, type AutoCompleteOption } from "./CustomAutoComplete";

const stationOptions: AutoCompleteOption[] = [
    { value: "STATION_A", label: "駅A", searchKeys: ["えきえー"] },
    { value: "STATION_B", label: "駅B", searchKeys: ["えきびー"] },
    { value: "STATION_C", label: "駅C", searchKeys: ["えきしー"] },
];

const meta = {
    title: "Base/CustomAutoComplete",
    component: CustomAutoComplete,
    tags: ["autodocs"],
    args: {
        label: "現在地の駅",
        options: stationOptions,
        sx: { width: 300 },
    },
} satisfies Meta<typeof CustomAutoComplete>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 実際に選択操作を行い、選択したラベルが入力欄に反映されることを検証する。 */
export const Controlled: Story = {
    render: (args) => {
        const [value, setValue] = useState<string | number | undefined>(undefined);
        return <CustomAutoComplete {...args} value={value} onChange={(e) => setValue(e.target.value as string)} />;
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByLabelText("現在地の駅");
        await userEvent.click(input);
        const option = await within(document.body).findByRole("option", { name: "駅B" });
        await userEvent.click(option);
        await expect(input).toHaveValue("駅B");
    },
};

export const Loading: Story = {
    args: { loading: true },
};

export const WithError: Story = {
    args: { error: true, helperText: "現在地の駅を選択してください" },
};

export const Required: Story = {
    args: { required: true },
};
