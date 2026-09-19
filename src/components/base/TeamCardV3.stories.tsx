import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { TeamCardV3 } from "./TeamCardV3";
import { buildStation, buildTeam, buildTeamData, buildTransitStation } from "@/stories/mocks/fixtures";

const teamData = buildTeamData({
    teamName: "チームA",
    teamColor: "rgb(0,89,255)",
    points: 1200,
    scoredPoints: 3400,
    propertyPurchasePoints: 500,
    remainingStationsNumber: 5,
    transitStations: [
        {
            ...buildTransitStation({ stationCode: "STATION_A" }),
            station: buildStation({ stationCode: "STATION_A", name: "渋谷" }),
        },
    ],
});

const meta = {
    title: "Base/TeamCardV3",
    component: TeamCardV3,
    tags: ["autodocs"],
    args: {
        teamData,
        bombiiTeamData: null,
    },
} satisfies Meta<typeof TeamCardV3>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** ボンビー（貧乏神）取り憑き中のチーム */
export const WithBombii: Story = {
    args: {
        bombiiTeamData: buildTeam({ teamCode: teamData.teamCode }),
    },
};

// NOTE: `TeamCard`と同様、`transitStations`が空だと`lastStation.createdAt`の参照でクラッシュする
//       実装上の制約があるため、その状態のstoryはここでは作成していない。

/** クリック可能な場合、押下でonClickが呼ばれることを検証する。 */
export const Clickable: Story = {
    args: { onClick: fn() },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByText("チームA"));
        const card = canvasElement.querySelector(".MuiCard-root");
        if (card) await userEvent.click(card);
        await expect(args.onClick).toHaveBeenCalled();
    },
};
