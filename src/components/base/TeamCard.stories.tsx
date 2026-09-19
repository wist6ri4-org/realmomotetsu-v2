import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { TeamCard } from "./TeamCard";
import { buildTeam, buildTeamData, buildTransitStation } from "@/stories/mocks/fixtures";
import { buildStation } from "@/stories/mocks/fixtures";

const teamData = buildTeamData({
    teamName: "チームA",
    teamColor: "rgb(0,89,255)",
    points: 1200,
    scoredPoints: 3400,
    remainingStationsNumber: 5,
    transitStations: [
        {
            ...buildTransitStation({ stationCode: "STATION_A" }),
            station: buildStation({ stationCode: "STATION_A", name: "渋谷" }),
        },
    ],
});

const meta = {
    title: "Base/TeamCard",
    component: TeamCard,
    tags: ["autodocs"],
    args: {
        teamData,
        bombiiTeamData: null,
    },
} satisfies Meta<typeof TeamCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** ボンビー（貧乏神）取り憑き中のチーム */
export const WithBombii: Story = {
    args: {
        bombiiTeamData: buildTeam({ teamCode: teamData.teamCode }),
    },
};

// NOTE: `transitStations`が空の場合、実装側（TeamCard.tsx）が`lastStation.createdAt`を
//       null チェックなしで参照しておりクラッシュする（画面側は必ず1件以上ある前提で運用されているため
//       表面化していない未対応ケース）。Storybookで確認できた副次的な発見のため、ここでは再現しない。

/** クリック可能な場合、押下でonClickが呼ばれることを検証する。 */
export const Clickable: Story = {
    args: { onClick: fn() },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByText("チームA"));
        // Cardの本体クリックで検証（テキストの親要素をクリック）
        const card = canvasElement.querySelector(".MuiCard-root");
        if (card) await userEvent.click(card);
        await expect(args.onClick).toHaveBeenCalled();
    },
};
