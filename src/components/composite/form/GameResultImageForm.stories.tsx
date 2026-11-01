import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import GameResultImageForm from "./GameResultImageForm";
import { buildTeamData } from "@/stories/mocks/fixtures";

const teamData = [
    buildTeamData({ id: 1, teamCode: "TEAM_A", teamName: "チームA", teamColor: "#d32f2f", scoredPoints: 12_000 }),
    buildTeamData({
        id: 2,
        teamCode: "TEAM_B",
        teamName: "チームB",
        teamColor: "#1976d2",
        scoredPoints: 30_000,
        propertyPurchasePoints: -5_000,
    }),
    buildTeamData({ id: 3, teamCode: "TEAM_C", teamName: "チームC", teamColor: "#388e3c", scoredPoints: -800 }),
    buildTeamData({ id: 4, teamCode: "TEAM_D", teamName: "チームD", teamColor: "#f9a825", scoredPoints: 9_500 }),
];

const members = [
    { id: 1, nickname: "たろう", iconUrl: null, teamCode: "TEAM_B" },
    { id: 2, nickname: "はなこ", iconUrl: null, teamCode: "TEAM_B" },
    { id: 3, nickname: "じろう", iconUrl: null, teamCode: "TEAM_B" },
    { id: 4, nickname: "さぶろう", iconUrl: null, teamCode: "TEAM_A" },
];

const meta = {
    title: "Composite/Form/GameResultImageForm",
    component: GameResultImageForm,
    tags: ["autodocs"],
    args: {
        teamData,
        members,
        eventName: "リアル桃鉄 テスト大会",
        eventCode: "TEST_EVENT",
    },
} satisfies Meta<typeof GameResultImageForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 同額で優勝が複数チーム・チーム数が多い・名前が長い場合（レイアウト確認用）。 */
export const TiedWinnersManyTeams: Story = {
    args: {
        teamData: [
            ...teamData.map((team) => ({ ...team, scoredPoints: team.teamCode === "TEAM_A" ? 35_000 : team.scoredPoints })),
            buildTeamData({ id: 5, teamCode: "TEAM_E", teamName: "とても長い名前のチームですよ", teamColor: "#7b1fa2", scoredPoints: 100 }),
            buildTeamData({ id: 6, teamCode: "TEAM_F", teamName: "チームF", teamColor: "#00796b", scoredPoints: 100 }),
            buildTeamData({ id: 7, teamCode: "TEAM_G", teamName: "チームG", teamColor: "#5d4037", scoredPoints: 567 }),
            buildTeamData({ id: 8, teamCode: "TEAM_H", teamName: "チームH", teamColor: "#455a64", scoredPoints: 0 }),
        ],
        members: [
            ...members,
            ...Array.from({ length: 12 }, (_, index) => ({
                id: 100 + index,
                nickname: `メンバー${index + 1}`,
                iconUrl: null,
                teamCode: "TEAM_B",
            })),
        ],
    },
};

/** 優勝チームのメンバーが多い場合・資産0のチームがある場合（レイアウト確認用）。 */
export const ManyMembersAndZeroAssets: Story = {
    args: {
        teamData: [
            ...teamData,
            buildTeamData({ id: 5, teamCode: "TEAM_E", teamName: "チームE", teamColor: "#7b1fa2" }),
        ],
        members: [
            ...members,
            ...Array.from({ length: 10 }, (_, index) => ({
                id: 100 + index,
                nickname: `ながいなまえ${index + 1}`,
                iconUrl: null,
                teamCode: "TEAM_B",
            })),
        ],
    },
};

/** 全チームの資産が0で、全チームが同点優勝になる場合（レイアウト確認用）。 */
export const AllTeamsZeroAssets: Story = {
    args: {
        teamData: teamData.map((team) => ({ ...team, scoredPoints: 0, propertyPurchasePoints: 0 })),
    },
};

/** 画像を生成ボタンを押すとプレビュー画像と共有/保存ボタンが表示される。 */
export const GenerateShowsPreview: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByRole("button", { name: "画像を生成" }));

        await expect(await canvas.findByAltText("結果画像", undefined, { timeout: 10_000 })).toBeInTheDocument();
        await expect(canvas.getByRole("button", { name: "共有/保存" })).toBeInTheDocument();
    },
};

/** チームデータが無い場合はエラーダイアログが表示される。 */
export const NoTeamsShowsError: Story = {
    args: { teamData: [] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByRole("button", { name: "画像を生成" }));

        const body = within(document.body);
        await expect(
            await body.findByText("チームデータが無いため、結果画像を生成できません。")
        ).toBeInTheDocument();
    },
};
