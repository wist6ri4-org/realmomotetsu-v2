import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import ToolsPage from "@/app/events/v03/[eventCode]/operation/tools/page";
import { MockEventProvider } from "@/stories/screens/helpers/MockEventProvider";
import {
    buildEventWithRelations,
    buildStations,
    buildTeam,
    buildUsersWithRelations,
} from "@/stories/mocks/fixtures";
import { initOperationHandlers, pointsHandlers } from "@/stories/mocks/handlers";

const EVENT_CODE = "TEST_EVENT";

const teams = [buildTeam({ id: 1, teamCode: "TEAM_A", teamName: "チームA", eventCode: EVENT_CODE })];
const stations = buildStations(["STATION_A", "STATION_B"]);
// operationLevel: "participant" にすることで一般参加者でも操作可能（isOperating: true）にする。
const event = buildEventWithRelations({ eventCode: EVENT_CODE, operationLevel: "participant" });
const user = buildUsersWithRelations({}, [{ eventCode: EVENT_CODE, teamCode: "TEAM_A" }]);

/**
 * v03 GMツール画面（`src/app/events/v03/[eventCode]/operation/tools/page.tsx`）の画面レベル（結合）試験。
 * `GET /api/init-operation`をMSWでモックする。8種のフォームと情報ダイアログが並ぶ最も大きい画面のため、
 * ここでは画面自体の読み込みと、代表としてポイント登録フォーム1つの送信フローのみを検証する
 * （各フォーム個別の詳細な検証は`Composite/Form/*`のstoryを参照）。
 */
const meta = {
    title: "Screens/V03/OperationTools",
    component: ToolsPage,
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <MockEventProvider value={{ teams, stations, user, event }}>
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
                initOperation: initOperationHandlers.success({ teamData: [] }),
            },
        },
    },
} satisfies Meta<typeof ToolsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** データ取得成功 → 各フォームのタイトルと情報ダイアログのFabが表示される。 */
export const Data: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(canvas.getByText("目的駅登録")).toBeInTheDocument());

        await expect(canvas.getByText("目的駅到着処理")).toBeInTheDocument();
        await expect(canvas.getByText("ポイント登録")).toBeInTheDocument();
        await expect(canvas.getByLabelText("info")).toBeInTheDocument();
    },
};

/** APIエラー時、エラーメッセージと再試行ボタンが表示される。 */
export const Error: Story = {
    parameters: {
        msw: {
            handlers: {
                initOperation: initOperationHandlers.error(500, "Internal Server Error"),
            },
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole("button", { name: "再試行" })).toBeInTheDocument();
    },
};

/** ポイント登録フォーム（代表例）でチーム選択・送信 → 確認ダイアログ → 登録完了の流れを検証する。 */
export const SubmitPointsSuccess: Story = {
    parameters: {
        msw: {
            handlers: {
                initOperation: initOperationHandlers.success({ teamData: [] }),
                registerPoints: pointsHandlers.success({}),
            },
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(canvas.getByText("ポイント登録")).toBeInTheDocument());

        // ページ内に「チーム」ラベルのセレクトを持つフォームが複数あるため、
        // 「ポイント登録」の見出しを起点にそのフォームのDOM範囲だけに絞って操作する。
        const heading = canvas.getByText("ポイント登録");
        const formSection = heading.closest(".MuiBox-root")?.parentElement as HTMLElement;
        const pointsForm = within(formSection);

        await userEvent.click(pointsForm.getByLabelText("チーム"));
        await userEvent.click(await within(document.body).findByRole("option", { name: "チームA" }));

        await userEvent.click(pointsForm.getByRole("button", { name: "送信" }));

        const body = within(document.body);
        await expect(await body.findByText(/以下の内容でポイントを登録しますか？/)).toBeInTheDocument();
        await userEvent.click(body.getByRole("button", { name: "ＯＫ" }));

        await expect(await body.findByText("登録完了")).toBeInTheDocument();
    },
};
