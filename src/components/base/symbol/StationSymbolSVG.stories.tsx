import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import StationSymbolSVG from "./StationSymbolSVG";

/**
 * `<symbol>`要素として定義を出力するのみのコンポーネントのため、それ単体では何も描画されない。
 * `<svg><use href="#..." /></svg>`で参照して初めて見える。
 */
const meta = {
    title: "Base/Symbols/StationSymbolSVG",
    component: StationSymbolSVG,
    tags: ["autodocs"],
} satisfies Meta<typeof StationSymbolSVG>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <svg viewBox="0 0 511.998 511.998" width={100} height={100}>
            <StationSymbolSVG />
            <use href="#station-symbol" />
        </svg>
    ),
};
