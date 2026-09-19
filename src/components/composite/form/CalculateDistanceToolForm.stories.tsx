import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import CalculateDistanceToolForm from "./CalculateDistanceToolForm";
import { buildBidirectionalNearbyStations, buildStations } from "@/stories/mocks/fixtures";

const stations = buildStations(["STATION_A", "STATION_B", "STATION_C"]);
const nearbyStations = buildBidirectionalNearbyStations([
    ["STATION_A", "STATION_B", 5],
    ["STATION_B", "STATION_C", 3],
]);

const meta = {
    title: "Composite/Form/CalculateDistanceToolForm",
    component: CalculateDistanceToolForm,
    tags: ["autodocs"],
    args: {
        stations,
        nearbyStations,
    },
} satisfies Meta<typeof CalculateDistanceToolForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 開始駅・終了駅を選択して計算ボタンを押すと、ダイクストラ法で求めた駅数がAlertDialogで表示される。 */
export const CalculateShowsResult: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByLabelText("開始駅"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "STATION_A" }));

        await userEvent.click(canvas.getByLabelText("終了駅"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "STATION_C" }));

        await userEvent.click(canvas.getByRole("button", { name: "計算" }));

        const body = within(document.body);
        await expect(await body.findByText("計算結果")).toBeInTheDocument();
        await expect(body.getByText("駅数は 2 です。")).toBeInTheDocument();
    },
};
