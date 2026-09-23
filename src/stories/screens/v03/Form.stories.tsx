import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import FormPage from "@/app/events/v03/[eventCode]/form/page";
import { MockEventProvider } from "@/stories/screens/helpers/MockEventProvider";
import { buildEventWithRelations, buildStations, buildTeam, buildUsersWithRelations } from "@/stories/mocks/fixtures";
import { currentLocationV3Handlers, transitStationsLatestHandlers, goalStationsLatestHandlers } from "@/stories/mocks/handlers";

const EVENT_CODE = "TEST_EVENT";

const teams = [buildTeam({ id: 1, teamCode: "TEAM_A", teamName: "チームA", eventCode: EVENT_CODE })];
const stations = buildStations(["STATION_A", "STATION_B"]);

/**
 * v03フォーム画面（`src/app/events/v03/[eventCode]/form/page.tsx`）の画面レベル（結合）試験。
 *
 * このページ自体はAPIを呼ばず（geolocationのみ、`.storybook/preview.tsx`でスタブ済み）、
 * `CurrentLocationFormV03`が実際のAPI呼び出しを行うため、その分のMSWハンドラーも用意する。
 */
const meta = {
    title: "Screens/V03/Form",
    component: FormPage,
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <MockEventProvider
                value={{
                    teams,
                    stations,
                    user: buildUsersWithRelations({}, [{ eventCode: EVENT_CODE, teamCode: "TEAM_A" }]),
                    event: buildEventWithRelations({ eventCode: EVENT_CODE }),
                }}
            >
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
        msw: {
            handlers: {
                transitStationsLatest: transitStationsLatestHandlers.success({ latestTransitStations: [] }),
                goalStationsLatest: goalStationsLatestHandlers.error(500, "no goal station"),
                currentLocation: currentLocationV3Handlers.success({
                    transitStation: {
                        id: 1,
                        stationCode: "STATION_A",
                        teamCode: "TEAM_A",
                        eventCode: EVENT_CODE,
                        isGoal: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    stationType: "mission",
                }),
            },
        },
    },
} satisfies Meta<typeof FormPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 位置情報取得（スタブ）の完了後、現在地登録フォームが表示される。 */
export const Data: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(canvas.getByLabelText("チーム名")).toBeInTheDocument());
        await expect(canvas.getByLabelText("今いる駅")).toBeInTheDocument();
    },
};

/** チーム・駅を選択して送信すると、確認ダイアログ → 登録完了ダイアログが表示される。 */
export const SubmitSuccess: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(canvas.getByLabelText("チーム名")).toBeInTheDocument());

        await userEvent.click(canvas.getByLabelText("今いる駅"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "STATION_A" }));

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await expect(await body.findByText(/以下の内容で登録しますか？/)).toBeInTheDocument();
        await userEvent.click(body.getByRole("button", { name: "ＯＫ" }));

        await expect(await body.findByText("登録完了")).toBeInTheDocument();
    },
};
