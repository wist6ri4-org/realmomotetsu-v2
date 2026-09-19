import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import BulletinBoard from "./BulletinBoard";

/**
 * 電光掲示板風の流れるテキスト表示。`visibilitychange`/`pageshow`等のイベントで
 * アニメーションを再起動する副作用を持つが、初期表示の見た目はpropsのみで決まる。
 */
const meta = {
    title: "Base/BulletinBoard",
    component: BulletinBoard,
    tags: ["autodocs"],
    args: {
        nextStation: "渋谷",
        nextStationEng: "Shibuya",
    },
} satisfies Meta<typeof BulletinBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoNextStation: Story = {
    args: { nextStation: "ー", nextStationEng: "ー" },
};
