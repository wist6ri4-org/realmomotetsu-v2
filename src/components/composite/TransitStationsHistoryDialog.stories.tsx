import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import TransitStationsHistoryDialog from "./TransitStationsHistoryDialog";
import CustomButton from "../base/CustomButton";
import { buildStation, buildTeam, buildTeamData, buildTransitStation } from "@/stories/mocks/fixtures";

const team = buildTeam({ teamCode: "TEAM_A", teamName: "チームA", teamColor: "rgb(0,89,255)" });

const teamData = buildTeamData({
    teamCode: "TEAM_A",
    teamName: "チームA",
    transitStations: [
        {
            ...buildTransitStation({ id: 1, stationCode: "STATION_B", teamCode: "TEAM_A" }),
            station: buildStation({ stationCode: "STATION_B", name: "渋谷" }),
        },
        {
            ...buildTransitStation({ id: 2, stationCode: "STATION_A", teamCode: "TEAM_A" }),
            station: buildStation({ stationCode: "STATION_A", name: "新宿" }),
        },
    ],
});

const meta = {
    title: "Composite/TransitStationsHistoryDialog",
    component: TransitStationsHistoryDialog,
    tags: ["autodocs"],
    // NOTE: 開閉状態をローカルstateで持つ理由はAlertDialog.stories.tsxのコメントを参照。
    render: (args) => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <>
                <CustomButton onClick={() => setIsOpen(true)}>ダイアログを開く</CustomButton>
                <TransitStationsHistoryDialog
                    {...args}
                    isOpen={isOpen}
                    onClose={() => {
                        args.onClose();
                        setIsOpen(false);
                    }}
                />
            </>
        );
    },
    argTypes: {
        isOpen: { table: { disable: true } },
    },
    args: {
        teamData,
        team,
        isOpen: false,
        onClose: fn(),
    },
} satisfies Meta<typeof TransitStationsHistoryDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 「ダイアログを開く」ボタンで開くことを確認する。 */
export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "ダイアログを開く" }));
        await expect(within(document.body).getByText("渋谷")).toBeInTheDocument();
    },
};

export const NoHistory: Story = {
    args: {
        teamData: buildTeamData({ ...teamData, transitStations: [] }),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "ダイアログを開く" }));
        await expect(within(document.body).getByText("0駅を通過しました")).toBeInTheDocument();
    },
};

/** 開く→閉じるボタン押下でonCloseが呼ばれ、ダイアログが閉じることを検証する。 */
export const Close: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "ダイアログを開く" }));

        const body = within(document.body);
        await userEvent.click(body.getByRole("button", { name: "閉じる" }));
        await expect(args.onClose).toHaveBeenCalledTimes(1);
    },
};
