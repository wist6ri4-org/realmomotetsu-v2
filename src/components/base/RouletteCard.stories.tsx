import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RouletteCard from "./RouletteCard";
import { buildStation } from "@/stories/mocks/fixtures";

const meta = {
    title: "Base/RouletteCard",
    component: RouletteCard,
    tags: ["autodocs"],
} satisfies Meta<typeof RouletteCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 未確定状態（ルーレット停止前） */
export const Unset: Story = {
    args: { displayedStation: null },
};

export const ShortName: Story = {
    args: { displayedStation: buildStation({ name: "渋谷" }) },
};

export const LongName: Story = {
    args: { displayedStation: buildStation({ name: "武蔵小杉大通り公園前" }) },
};
