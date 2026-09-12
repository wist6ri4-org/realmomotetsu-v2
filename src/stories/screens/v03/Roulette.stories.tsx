import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RoulettePage from "@/app/events/v03/[eventCode]/roulette/page";
import { MockEventProvider } from "@/stories/screens/helpers/MockEventProvider";
import { buildBidirectionalNearbyStations, buildStations } from "@/stories/mocks/fixtures";
import { initRouletteHandlers } from "@/stories/mocks/handlers";

const EVENT_CODE = "TEST_EVENT";

const stations = buildStations(["STATION_A", "STATION_B", "STATION_C"]);
const nearbyStations = buildBidirectionalNearbyStations([
    ["STATION_A", "STATION_B", 5],
    ["STATION_B", "STATION_C", 3],
]);

/**
 * v03ルーレット画面（`src/app/events/v03/[eventCode]/roulette/page.tsx`）の画面レベル（結合）試験。
 * `GET /api/init-roulette`をMSWでモックする。
 */
const meta = {
    title: "Screens/V03/Roulette",
    component: RoulettePage,
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <MockEventProvider value={{ stations, nearbyStations }}>
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
} satisfies Meta<typeof RoulettePage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** データ取得成功 → ルーレットフォームが表示され、開始・停止操作ができる。 */
export const Data: Story = {
    parameters: {
        msw: {
            handlers: {
                initRoulette: initRouletteHandlers.success({ latestTransitStations: [], goalStations: [] }),
            },
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(canvas.getByRole("button", { name: "スタート" })).toBeInTheDocument());

        await userEvent.click(canvas.getByRole("button", { name: "スタート" }));
        await waitFor(() => expect(canvas.getByRole("button", { name: "ストップ" })).toBeInTheDocument());
        await userEvent.click(canvas.getByRole("button", { name: "ストップ" }));
    },
};

/** APIエラー時、エラーメッセージと再試行ボタンが表示される。 */
export const Error: Story = {
    parameters: {
        msw: {
            handlers: {
                initRoulette: initRouletteHandlers.error(500, "Internal Server Error"),
            },
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole("button", { name: "再試行" })).toBeInTheDocument();
    },
};
