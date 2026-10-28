import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, spyOn, userEvent, waitFor, within } from "storybook/test";
import CurrentLocationFormV03 from "./CurrentLocationFormV03";
import { buildEvent, buildGoalStation, buildStations, buildTeam } from "@/stories/mocks/fixtures";
import { currentLocationV3Handlers, goalStationsLatestHandlers, transitStationsLatestHandlers } from "@/stories/mocks/handlers";

const teams = [buildTeam({ teamCode: "TEAM_A", teamName: "チームA" })];
const stations = buildStations(["STATION_A", "STATION_B"]);

/**
 * `CurrentLocationForm`のV3版。到着した駅種別（`stationType`）に応じて追加のダイアログ
 * （ミッション/プラス/マイナス/カード/宝くじ駅）や、目的駅到着時は`GoalDialog`（confetti）を表示する。
 */
const meta = {
    title: "Composite/Form/CurrentLocationFormV03",
    component: CurrentLocationFormV03,
    tags: ["autodocs"],
    args: {
        teams,
        stations,
        event: buildEvent(),
        isOperating: true,
    },
    parameters: {
        msw: {
            handlers: {
                transitStationsLatest: transitStationsLatestHandlers.success({ latestTransitStations: [] }),
                currentLocation: currentLocationV3Handlers.success({
                    transitStation: {
                        id: 1,
                        stationCode: "STATION_A",
                        teamCode: "TEAM_A",
                        eventCode: "TEST_EVENT",
                        isGoal: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    stationType: "mission",
                    isPurchased: false,
                }),
                goalStationsLatest: goalStationsLatestHandlers.success({
                    goalStation: buildGoalStation({ stationCode: "STATION_B" }),
                }),
            },
        },
    },
} satisfies Meta<typeof CurrentLocationFormV03>;

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

/** ミッション駅（目的駅ではない・未購入）に到着した場合、登録完了 → ミッション駅到着のダイアログ（購入できる旨つき）が順に表示される。 */
export const SubmitSuccessMissionStation: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByLabelText("チーム名"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "チームA" }));

        await userEvent.click(canvas.getByLabelText("今いる駅"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "STATION_A" }));

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await userEvent.click(await body.findByRole("button", { name: "ＯＫ" }));
        await expect(await body.findByText("登録完了")).toBeInTheDocument();
        await userEvent.click(body.getByRole("button", { name: "閉じる" }));

        await waitFor(() => expect(body.getByRole("heading", { name: "ミッション駅　到着！" })).toBeInTheDocument(), {
            timeout: 3000,
        });
        await expect(body.getByText(/STATION_A駅を\s*購入できます！/)).toBeInTheDocument();
    },
};

/** 購入済みのミッション駅に到着した場合、ミッション駅到着のダイアログに購入できる旨は表示されない。 */
export const SubmitSuccessPurchasedMissionStation: Story = {
    parameters: {
        msw: {
            handlers: {
                currentLocation: currentLocationV3Handlers.success({
                    transitStation: {
                        id: 1,
                        stationCode: "STATION_A",
                        teamCode: "TEAM_A",
                        eventCode: "TEST_EVENT",
                        isGoal: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    stationType: "mission",
                    isPurchased: true,
                }),
            },
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByLabelText("チーム名"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "チームA" }));

        await userEvent.click(canvas.getByLabelText("今いる駅"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "STATION_A" }));

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await userEvent.click(await body.findByRole("button", { name: "ＯＫ" }));
        await expect(await body.findByText("登録完了")).toBeInTheDocument();
        await userEvent.click(body.getByRole("button", { name: "閉じる" }));

        await waitFor(() => expect(body.getByRole("heading", { name: "ミッション駅　到着！" })).toBeInTheDocument(), {
            timeout: 3000,
        });
        await expect(body.queryByText(/購入できます！/)).not.toBeInTheDocument();
    },
};

/** 通知設定が有効でも追加の通知通信は行わず、ゴール演出とミッション案内は維持する。 */
export const SubmitSuccessGoalStation: Story = {
    args: { event: buildEvent({ isNotificationEnabled: true, discordWebhookUrl: "https://discord.com/api/webhooks/test" }) },
    parameters: {
        msw: {
            handlers: {
                goalStationsLatest: goalStationsLatestHandlers.success({
                    goalStation: buildGoalStation({ stationCode: "STATION_A" }),
                }),
            },
        },
    },
    play: async ({ canvasElement }) => {
        const fetchSpy = spyOn(globalThis, "fetch");
        try {
            const canvas = within(canvasElement);
            const body = within(document.body);
            await userEvent.click(canvas.getByLabelText("チーム名"));
            await userEvent.click(await body.findByRole("option", { name: "チームA" }));
            await userEvent.click(canvas.getByLabelText("今いる駅"));
            await userEvent.click(await body.findByRole("option", { name: "STATION_A" }));
            await userEvent.click(canvas.getByRole("button", { name: "送信" }));
            await userEvent.click(await body.findByRole("button", { name: "ＯＫ" }));
            await expect(await body.findByText("登録完了")).toBeInTheDocument();
            await userEvent.click(body.getByRole("button", { name: "閉じる" }));
            await expect(await body.findByRole("heading", { name: "目的地到着！！" })).toBeInTheDocument();
            await userEvent.click(body.getByRole("button", { name: "ＯＫ" }));
            await expect(await body.findByRole("heading", { name: "ミッション駅　到着！" })).toBeInTheDocument();

            const urls = fetchSpy.mock.calls.map(([input]) => input instanceof Request ? input.url : String(input));
            await expect(urls.some((url) => url.includes("/api/current-location-v3"))).toBe(true);
            await expect(urls.some((url) => /discord/i.test(url))).toBe(false);
        } finally {
            fetchSpy.mockRestore();
        }
    },
};
