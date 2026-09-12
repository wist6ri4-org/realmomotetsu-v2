import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import BombiiSymbolSVG from "./BombiiSymbolSVG";

/**
 * `<symbol>`要素として定義を出力するのみのコンポーネントのため、それ単体では何も描画されない。
 * `<svg><use href="#..." /></svg>`で参照して初めて見える。路線図（`Routemap.tsx`）内で使われる想定。
 */
const meta = {
    title: "Base/Symbols/BombiiSymbolSVG",
    component: BombiiSymbolSVG,
    tags: ["autodocs"],
} satisfies Meta<typeof BombiiSymbolSVG>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <svg viewBox="0 0 750 750" width={150} height={150}>
            <BombiiSymbolSVG />
            <use href="#bombii-symbol" />
        </svg>
    ),
};
