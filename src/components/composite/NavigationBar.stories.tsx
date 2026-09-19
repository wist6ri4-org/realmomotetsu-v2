import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { NavigationBar } from "./NavigationBar";
import { MockEventProvider } from "@/stories/screens/helpers/MockEventProvider";
import { buildEventWithRelations } from "@/stories/mocks/fixtures";

/**
 * `useEventContext`（`event`, `versionPath`）と`next/navigation`（`usePathname`）に依存するため、
 * `MockEventProvider`でcontextを注入し、`parameters.nextjs.navigation`で現在パスを指定する。
 */
const meta = {
    title: "Composite/NavigationBar",
    component: NavigationBar,
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <MockEventProvider value={{ event: buildEventWithRelations({ eventCode: "TEST_EVENT" }) }}>
                <Story />
            </MockEventProvider>
        ),
    ],
    parameters: {
        nextjs: {
            navigation: {
                pathname: "/events/v03/TEST_EVENT/home",
            },
        },
    },
} satisfies Meta<typeof NavigationBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** パス名から"home"タブがアクティブと判定される。 */
export const HomeActive: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const homeTab = canvas.getByRole("button", { name: "ホーム" });
        await expect(homeTab).toHaveClass("Mui-selected");
    },
};

/** `currentTab` propで明示的にタブを指定した場合。 */
export const RouletteActiveViaProp: Story = {
    args: { currentTab: "roulette" },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const rouletteTab = canvas.getByRole("button", { name: "ルーレット" });
        await expect(rouletteTab).toHaveClass("Mui-selected");
    },
};
