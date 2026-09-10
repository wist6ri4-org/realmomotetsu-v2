import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RouletteFormV3 from "./RouletteFormV3";
import { buildBidirectionalNearbyStations, buildStations } from "@/stories/mocks/fixtures";

const stations = buildStations(["STATION_A", "STATION_B", "STATION_C"]);
const nearbyStations = buildBidirectionalNearbyStations([
    ["STATION_A", "STATION_B", 5],
    ["STATION_B", "STATION_C", 3],
]);

const meta = {
    title: "Composite/Form/RouletteFormV3",
    component: RouletteFormV3,
    tags: ["autodocs"],
    args: {
        stations,
        nearbyStations,
        latestTransitStations: [],
        goalStations: [],
        closestStations: [{ stationCode: "STATION_A", distance: 0 }],
    },
} satisfies Meta<typeof RouletteFormV3>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** スタートボタン押下でルーレットが回転を始め、ストップボタン押下で停止することを検証する。 */
export const StartAndStop: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByRole("button", { name: "スタート" }));
        await waitFor(() => expect(canvas.getByRole("button", { name: "ストップ" })).toBeInTheDocument());

        await userEvent.click(canvas.getByRole("button", { name: "ストップ" }));
        await waitFor(() => expect(canvas.getByRole("button", { name: "スタート" })).toBeInTheDocument());
    },
};
