import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RouletteForm from "./RouletteForm";
import { buildBidirectionalNearbyStations, buildStations } from "@/stories/mocks/fixtures";

const stations = buildStations(["STATION_A", "STATION_B", "STATION_C"]);
const nearbyStations = buildBidirectionalNearbyStations([
    ["STATION_A", "STATION_B", 5],
    ["STATION_B", "STATION_C", 3],
]);

/**
 * props・fetch・contextに依存しない自己完結のフォーム。`setInterval`でルーレットを回転させる。
 */
const meta = {
    title: "Composite/Form/RouletteForm",
    component: RouletteForm,
    tags: ["autodocs"],
    args: {
        stations,
        nearbyStations,
        latestTransitStations: [],
        goalStations: [],
        closestStations: [{ stationCode: "STATION_A", distance: 0 }],
    },
} satisfies Meta<typeof RouletteForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** スタートボタン押下でルーレットが回転を始め（ボタンが「ストップ」に変化）、
 * ストップボタン押下で停止する（ボタンが「スタート」に戻る）ことを検証する。 */
export const StartAndStop: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByRole("button", { name: "スタート" }));
        await waitFor(() => expect(canvas.getByRole("button", { name: "ストップ" })).toBeInTheDocument());

        await userEvent.click(canvas.getByRole("button", { name: "ストップ" }));
        await waitFor(() => expect(canvas.getByRole("button", { name: "スタート" })).toBeInTheDocument());
    },
};

/** 今いる駅を未選択のままスタートすると、選択を促すアラートが表示される。 */
export const NoStationSelected: Story = {
    args: { closestStations: [] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "スタート" }));

        const body = within(document.body);
        await expect(await body.findByText("今いる駅を選択してください。")).toBeInTheDocument();
    },
};
