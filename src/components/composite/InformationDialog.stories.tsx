import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import InformationDialog from "./InformationDialog";
import { buildTeamData } from "@/stories/mocks/fixtures";

const teamData = [
    buildTeamData({ id: 1, teamCode: "TEAM_A", teamName: "チームA", points: 1200, scoredPoints: 3400 }),
    buildTeamData({ id: 2, teamCode: "TEAM_B", teamName: "チームB", points: 800, scoredPoints: 2100 }),
];

/**
 * `Fab`押下で内部stateにより`Dialog`（`@mui/x-data-grid`）を開く。デフォルトでは閉じた状態。
 */
const meta = {
    title: "Composite/InformationDialog",
    component: InformationDialog,
    tags: ["autodocs"],
    args: {
        teamData,
    },
} satisfies Meta<typeof InformationDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Fabボタン押下でチーム情報ダイアログが開くことを検証する。 */
export const OpenDialog: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByLabelText("info"));

        const body = within(document.body);
        await expect(await body.findByText("チーム情報")).toBeInTheDocument();
        await expect(body.getByText("チームA")).toBeInTheDocument();
        await expect(body.getByText("チームB")).toBeInTheDocument();
    },
};
