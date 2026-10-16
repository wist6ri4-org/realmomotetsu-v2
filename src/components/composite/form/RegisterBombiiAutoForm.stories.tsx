import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import RegisterBombiiAutoForm from "./RegisterBombiiAutoForm";
import { buildEvent, buildTeamData } from "@/stories/mocks/fixtures";
import { bombiiHistoriesHandlers } from "@/stories/mocks/handlers";

// 目的駅から最も遠い（remainingStationsNumberが大きい）チームが自動的にボンビー候補になる。
const teamData = [
    buildTeamData({ teamCode: "TEAM_A", teamName: "チームA", remainingStationsNumber: 3 }),
    buildTeamData({ teamCode: "TEAM_B", teamName: "チームB", remainingStationsNumber: 8 }),
];

const meta = {
    title: "Composite/Form/RegisterBombiiAutoForm",
    component: RegisterBombiiAutoForm,
    tags: ["autodocs"],
    args: {
        teamData,
        event: buildEvent(),
        isOperating: true,
    },
    parameters: {
        msw: {
            handlers: { registerBombii: bombiiHistoriesHandlers.success({}) },
        },
    },
} satisfies Meta<typeof RegisterBombiiAutoForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NotOperating: Story = {
    args: { isOperating: false },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole("button", { name: "準備中" })).toBeDisabled();
    },
};

/** 送信 → 目的駅から最も遠いチーム（チームB）を対象とした確認ダイアログ → 登録完了の流れを検証する。 */
export const SubmitSuccess: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await expect(await body.findByText(/チーム: チームB/)).toBeInTheDocument();
        await userEvent.click(body.getByRole("button", { name: "ＯＫ" }));

        await expect(await body.findByText("登録完了")).toBeInTheDocument();
    },
};
