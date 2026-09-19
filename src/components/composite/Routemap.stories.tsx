import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";
import { StationType } from "@/generated/prisma";
import Routemap from "./Routemap";
import { buildStation, buildTeamData, buildTransitStation } from "@/stories/mocks/fixtures";

const stationsFromDB = [
    buildStation({ stationCode: "CHUORINKAN", name: "中央林間", stationType: StationType.plus }),
    buildStation({ stationCode: "TSUKIMINO", name: "つきみ野", stationType: StationType.minus }),
];

const teamData = [
    buildTeamData({
        teamCode: "TEAM_A",
        teamColor: "rgb(0,89,255)",
        transitStations: [
            {
                ...buildTransitStation({ stationCode: "CHUORINKAN", teamCode: "TEAM_A" }),
                station: buildStation({ stationCode: "CHUORINKAN", name: "中央林間" }),
            },
        ],
    }),
];

/**
 * `src/data/routemap/${configFileName}.json`を動的importで読み込むため、初期表示は非同期。
 * `configFileName`は既定の`routemap-config`（フォールバック用の設定ファイル）を使う。
 */
const meta = {
    title: "Composite/Routemap",
    component: Routemap,
    tags: ["autodocs"],
    args: {
        teamData,
        nextGoalStation: null,
        bombiiTeam: null,
        propertyPurchases: [],
        stationsFromDB,
        configFileName: "routemap-config",
        visibleTeams: ["TEAM_A"],
    },
} satisfies Meta<typeof Routemap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(canvas.getByText("中央林間")).toBeInTheDocument());
    },
};
