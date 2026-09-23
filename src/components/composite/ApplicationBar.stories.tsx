import type { User } from "@supabase/supabase-js";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import ApplicationBar from "./ApplicationBar";
import { MockEventProvider } from "@/stories/screens/helpers/MockEventProvider";
import { buildEventWithRelations, buildUsersWithRelations } from "@/stories/mocks/fixtures";

const sbUser: User = {
    id: "00000000-0000-0000-0000-000000000001",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
};

const event = buildEventWithRelations({ eventCode: "TEST_EVENT", eventName: "テストイベント" });
const user = buildUsersWithRelations({}, [{ eventCode: "TEST_EVENT", teamCode: "TEAM_A" }]);

/**
 * `useEventContext`（`user`, `event`, `versionPath`）・`useUserIcon`（グローバルデコレーターで提供）・
 * `next/navigation`の`useRouter`に依存する。`signOut`はSupabase認証への実通信を伴うため、
 * ここではメニューの開閉のみを検証し、サインアウトの実行結果までは検証しない。
 */
const meta = {
    title: "Composite/ApplicationBar",
    component: ApplicationBar,
    tags: ["autodocs"],
    args: {
        sbUser,
    },
    decorators: [
        (Story) => (
            <MockEventProvider value={{ event, user, isInitDataLoading: false }}>
                <Story />
            </MockEventProvider>
        ),
    ],
} satisfies Meta<typeof ApplicationBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText("テストイベント")).toBeInTheDocument();
    },
};

/** ユーザーメニューを開くと「ユーザー設定」「サインアウト」が表示される。 */
export const OpenUserMenu: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByLabelText("account of current user"));

        const body = within(document.body);
        await expect(await body.findByText("ユーザー設定")).toBeInTheDocument();
        await expect(body.getByText("サインアウト")).toBeInTheDocument();
    },
};

/** イベントメニューを開くと、閲覧可能な参加イベントの一覧が表示される。 */
export const OpenEventMenu: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByLabelText("menu"));

        const body = within(document.body);
        await expect(await body.findByRole("menuitem", { name: "テストイベント" })).toBeInTheDocument();
    },
};
