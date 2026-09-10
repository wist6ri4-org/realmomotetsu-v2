import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import RegisterPropertyPurchasesFormV3 from "./RegisterPropertyPurchasesFormV3";
import { buildStations, buildTeam } from "@/stories/mocks/fixtures";
import { propertyPurchasesHandlers } from "@/stories/mocks/handlers";

const teams = [buildTeam({ teamCode: "TEAM_A", teamName: "チームA" })];
const stations = buildStations(["STATION_A"]);

const meta = {
    title: "Composite/Form/RegisterPropertyPurchasesFormV3",
    component: RegisterPropertyPurchasesFormV3,
    tags: ["autodocs"],
    args: {
        teams,
        stations,
        isOperating: true,
    },
    parameters: {
        msw: {
            handlers: { registerPropertyPurchase: propertyPurchasesHandlers.success({}) },
        },
    },
} satisfies Meta<typeof RegisterPropertyPurchasesFormV3>;

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

/** チーム・駅選択・送信 → 確認ダイアログ → 登録完了ダイアログの流れを検証する。 */
export const SubmitSuccess: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByLabelText("チーム"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "チームA" }));

        await userEvent.click(canvas.getByLabelText("今いる駅"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "STATION_A" }));

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await expect(await body.findByText(/物件駅の購入情報を登録します/)).toBeInTheDocument();
        await userEvent.click(body.getByRole("button", { name: "ＯＫ" }));

        await expect(await body.findByText("登録完了")).toBeInTheDocument();
    },
};

/** 同じチーム・駅で購入済みの場合、重複エラーダイアログが表示される。 */
export const DuplicateEntry: Story = {
    parameters: {
        msw: {
            handlers: {
                registerPropertyPurchase: propertyPurchasesHandlers.error(409, "Duplicate entry for TEAM_A/STATION_A"),
            },
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByLabelText("チーム"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "チームA" }));

        await userEvent.click(canvas.getByLabelText("今いる駅"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "STATION_A" }));

        await userEvent.click(canvas.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await userEvent.click(await body.findByRole("button", { name: "ＯＫ" }));

        await expect(await body.findByText("エラー")).toBeInTheDocument();
    },
};
