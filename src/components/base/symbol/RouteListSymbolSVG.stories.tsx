import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RouteListSymbolSVG from "./RouteListSymbolSVG";

/**
 * `<symbol>`要素として定義を出力するのみのコンポーネントのため、それ単体では何も描画されない。
 * `<svg><use href="#..." /></svg>`で参照して初めて見える。
 */
const meta = {
    title: "Base/Symbols/RouteListSymbolSVG",
    component: RouteListSymbolSVG,
    tags: ["autodocs"],
} satisfies Meta<typeof RouteListSymbolSVG>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <svg viewBox="0 0 4000 2000" width={300} height={150}>
            <RouteListSymbolSVG />
            <use href="#route-list-symbol" />
        </svg>
    ),
};

export const Metro: Story = {
    render: () => (
        <svg viewBox="0 0 4640 1480" width={300} height={96}>
            <RouteListSymbolSVG variant="metro" />
            <use href="#route-list-symbol" width="4640" height="1480" />
        </svg>
    ),
};
