import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RoutemapDialog from "./RoutemapDialog";
import { MockEventProvider } from "@/stories/screens/helpers/MockEventProvider";
import { buildEventWithRelations, buildStation, buildStations, buildTeamData, buildTransitStation } from "@/stories/mocks/fixtures";
import { initRoutemapHandlers } from "@/stories/mocks/handlers";

const stations = buildStations(["CHUORINKAN", "TSUKIMINO"]);
// NOTE: `Routemap.tsx`は`team.transitStations[0]`が存在する前提で書かれておりnullチェックが無いため
//       （`TeamCard`と同様の未対応ケース。詳細は`TeamCard.stories.tsx`のコメントを参照）、
//       ここでは経由駅履歴を持つチームのみをfixtureとして用意する。
const teamData = [
    buildTeamData({
        teamCode: "TEAM_A",
        teamName: "チームA",
        transitStations: [
            {
                ...buildTransitStation({ stationCode: "CHUORINKAN", teamCode: "TEAM_A" }),
                station: buildStation({ stationCode: "CHUORINKAN", name: "中央林間" }),
            },
        ],
    }),
];

/**
 * props無し・`EventContext`（`stations`, `event`）・`next/navigation`・
 * `GET /api/init-routemap`（MSW）に依存する複合コンポーネント。内部stateでFabからダイアログを開閉する。
 */
const meta = {
    title: "Composite/RoutemapDialog",
    component: RoutemapDialog,
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <MockEventProvider value={{ stations, event: buildEventWithRelations({ eventCode: "TEST_EVENT" }) }}>
                <Story />
            </MockEventProvider>
        ),
    ],
    parameters: {
        nextjs: {
            navigation: {
                segments: [["eventCode", "TEST_EVENT"]],
            },
        },
        msw: {
            handlers: {
                default: initRoutemapHandlers.success({
                    teamData,
                    nextGoalStation: null,
                    bombiiTeam: null,
                    propertyPurchases: [],
                }),
            },
        },
    },
} satisfies Meta<typeof RoutemapDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fabボタン押下で路線図ダイアログが開き、路線図とチーム表示設定が表示される。 */
export const OpenDialog: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(canvas.getByLabelText("info")).toBeEnabled());
        await userEvent.click(canvas.getByLabelText("info"));

        const body = within(document.body);
        await expect(await body.findByText("路線図")).toBeInTheDocument();
        await expect(await body.findByText("チームA")).toBeInTheDocument();
    },
};
