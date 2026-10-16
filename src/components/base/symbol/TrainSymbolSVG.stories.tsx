import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TrainSymbolSVG from "./TrainSymbolSVG";

/**
 * `<symbol>`要素として定義を出力するのみのコンポーネントのため、それ単体では何も描画されない。
 * `<svg><use href="#..." /></svg>`で参照して初めて見える。`styles/Routemap.module.css`のクラスに依存する。
 */
const meta = {
    title: "Base/Symbols/TrainSymbolSVG",
    component: TrainSymbolSVG,
    tags: ["autodocs"],
} satisfies Meta<typeof TrainSymbolSVG>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <svg viewBox="0 0 341.283 149.526" width={300} height={130}>
            <TrainSymbolSVG />
            <use href="#train-symbol" />
        </svg>
    ),
};
