import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import HomePage from "@/app/events/v03/[eventCode]/home/page";
import { MockEventProvider } from "@/stories/screens/helpers/MockEventProvider";
import { buildStation, buildTeam, buildTeamData, buildTransitStation } from "@/stories/mocks/fixtures";
import { initHomeHandlers } from "@/stories/mocks/handlers";

const EVENT_CODE = "TEST_EVENT";

const teams = [buildTeam({ id: 1, teamCode: "TEAM_A", teamName: "チームA", eventCode: EVENT_CODE })];

const teamData = [
    buildTeamData({
        id: 1,
        teamCode: "TEAM_A",
        teamName: "チームA",
        teamColor: "rgb(0,89,255)",
        points: 1200,
        scoredPoints: 3400,
        remainingStationsNumber: 5,
        transitStations: [
            {
                ...buildTransitStation({ stationCode: "STATION_A", teamCode: "TEAM_A" }),
                station: buildStation({ stationCode: "STATION_A", name: "渋谷" }),
            },
        ],
    }),
];

/**
 * v03ホーム画面（`src/app/events/v03/[eventCode]/home/page.tsx`）の画面レベル（結合）試験。
 *
 * 実際の`EventsLayout`（認証ガード・ApplicationBar等）は経由せず、ページコンポーネントを
 * `MockEventProvider`で直接ラップして描画する。`GET /api/init-home`はMSWでモックする。
 */
const meta = {
    title: "Screens/V03/Home",
    component: HomePage,
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <MockEventProvider value={{ teams }}>
                <Story />
            </MockEventProvider>
        ),
    ],
    parameters: {
        nextjs: {
            navigation: {
                segments: [["eventCode", EVENT_CODE]],
            },
        },
    },
} satisfies Meta<typeof HomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** データ取得成功 → チームカードが表示され、カード押下で経由駅履歴ダイアログが開く。 */
export const Data: Story = {
    parameters: {
        msw: {
            handlers: {
                initHome: initHomeHandlers.success({ teamData, nextGoalStation: null, bombiiTeam: null }),
            },
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(canvas.getByText("チームA")).toBeInTheDocument());

        const card = canvasElement.querySelector(".MuiCard-root");
        if (card) await userEvent.click(card);

        const body = within(document.body);
        await expect(await body.findByRole("dialog")).toBeInTheDocument();
    },
};

/** データが空の場合、「データがありません」と表示される。 */
export const Empty: Story = {
    parameters: {
        msw: {
            handlers: {
                initHome: initHomeHandlers.success({ teamData: [], nextGoalStation: null, bombiiTeam: null }),
            },
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(canvas.getByText("データがありません")).toBeInTheDocument());
    },
};

/** APIエラー時、エラーメッセージと再試行ボタンが表示される。 */
export const Error: Story = {
    parameters: {
        msw: {
            handlers: {
                initHome: initHomeHandlers.error(500, "Internal Server Error"),
            },
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole("button", { name: "再試行" })).toBeInTheDocument();
    },
};
