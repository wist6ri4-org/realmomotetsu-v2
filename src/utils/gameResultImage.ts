import { Member } from "@/features/init/types";
import { Converter } from "@/utils/converter";
import { RankedTeam } from "@/utils/pointsUtils";

/** 結果画像の幅（px） */
export const GAME_RESULT_IMAGE_WIDTH = 1080;
/** 結果画像の高さ（px） */
export const GAME_RESULT_IMAGE_HEIGHT = 1920;

const PADDING = 36;
const FOOTER_HEIGHT = 30;
const CARD_GAP = 18;
const CARD_RADIUS = 16;
/** カードの左に置く順位欄の幅 */
const RANK_COLUMN_WIDTH = 130;
const WINNER_AREA_HEIGHT = 480;
const MAX_ROW_HEIGHT = 200;

/** ヘッダー画像のうち使う範囲の高さ（下側の菜の花を少し切る） */
const HEADER_SOURCE_HEIGHT = 600;
/** ヘッダー画像の元のサイズ（「決算」の位置を合わせるのに使う） */
const HEADER_SOURCE_WIDTH = 1280;
/** ヘッダー画像上で元の「決算」の各文字があった中心座標 */
const HEADER_TITLE_CENTERS = [
    { char: "決", x: 437, y: 250 },
    { char: "算", x: 835, y: 250 },
];

/**
 * 結果画像の描画に必要なデータ
 * @property {string} eventName - イベント名
 * @property {RankedTeam[]} rankedTeams - 総資産の順位付きチーム（順位の昇順）
 * @property {Member[]} members - 参加者（優勝チームのメンバー名表示に使う）
 * @property {string} fontFamily - 描画に使うフォントファミリー
 * @property {HTMLImageElement} momotaroImage - 桃太郎の画像
 * @property {HTMLImageElement | null} headerImage - ヘッダー画像（読み込めない場合は null）
 * @property {HTMLImageElement | null} winnerMarkImage - 優勝の印の金の桃の画像（読み込めない場合は null）
 * @property {HTMLImageElement | null} backgroundImage - 背景画像（読み込めない場合は null）
 */
export type GameResultImageData = {
    eventName: string;
    rankedTeams: RankedTeam[];
    members: Member[];
    fontFamily: string;
    momotaroImage: HTMLImageElement;
    headerImage: HTMLImageElement | null;
    winnerMarkImage: HTMLImageElement | null;
    backgroundImage: HTMLImageElement | null;
};

/**
 * テキスト描画オプション
 * @property {number} size - フォントサイズ（px）
 * @property {CanvasTextAlign} [align] - 揃え
 * @property {number} [maxWidth] - 最大幅。超える場合はフォントサイズを縮小する
 * @property {string} [color] - 文字色
 * @property {number} [strokeWidth] - 縁取りの太さ（0 で縁取り無し）
 */
type TextOptions = {
    size: number;
    align?: CanvasTextAlign;
    maxWidth?: number;
    color?: string;
    strokeWidth?: number;
};

/**
 * ゲーム終了時の結果画像を描画する
 * @param {HTMLCanvasElement} canvas - 描画先のキャンバス
 * @param {GameResultImageData} data - 描画データ
 * @return {void}
 */
export const drawGameResultImage = (canvas: HTMLCanvasElement, data: GameResultImageData): void => {
    canvas.width = GAME_RESULT_IMAGE_WIDTH;
    canvas.height = GAME_RESULT_IMAGE_HEIGHT;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Canvas 2D context is not available.");
    }

    ctx.textBaseline = "middle";

    drawBackground(ctx, data.backgroundImage);
    let y = drawHeader(ctx, data) + CARD_GAP;

    const winners = data.rankedTeams.filter((rankedTeam) => rankedTeam.rank === 1);
    const others = data.rankedTeams.filter((rankedTeam) => rankedTeam.rank !== 1);

    // カードは順位欄の右側に置く
    const cardX = PADDING + RANK_COLUMN_WIDTH;
    const cardWidth = GAME_RESULT_IMAGE_WIDTH - PADDING - cardX;

    // 優勝チーム（同額で複数いる場合は優勝枠を分け合う）
    if (winners.length > 0) {
        const momotaroHeight = Math.min(WINNER_AREA_HEIGHT * 0.62, 340);
        const momotaroWidth = (data.momotaroImage.naturalWidth / data.momotaroImage.naturalHeight) * momotaroHeight;
        const winnerCardHeight = (WINNER_AREA_HEIGHT - CARD_GAP * (winners.length - 1)) / winners.length;
        // 文字は桃太郎と重ならない幅に収める
        const textWidth = cardWidth - momotaroWidth - 40;

        winners.forEach((winner, index) => {
            const cardY = y + index * (winnerCardHeight + CARD_GAP);
            drawWinnerLabel(ctx, data, PADDING, cardY, RANK_COLUMN_WIDTH, winnerCardHeight);
            drawWinnerCard(ctx, data, winner, cardX, cardY, cardWidth, winnerCardHeight, textWidth);
        });

        // 桃太郎は優勝カードの右下に重ねる
        ctx.drawImage(
            data.momotaroImage,
            GAME_RESULT_IMAGE_WIDTH - PADDING - momotaroWidth,
            y + WINNER_AREA_HEIGHT - momotaroHeight - 10,
            momotaroWidth,
            momotaroHeight
        );

        y += WINNER_AREA_HEIGHT + CARD_GAP * 2;
    }

    // 2位以下のチーム
    if (others.length > 0) {
        const availableHeight = GAME_RESULT_IMAGE_HEIGHT - FOOTER_HEIGHT - y;
        const rowHeight = Math.min(MAX_ROW_HEIGHT, (availableHeight - CARD_GAP * (others.length - 1)) / others.length);
        // チーム数が少なく余白が出る場合は、残りの領域の中央に寄せる
        const rowsHeight = rowHeight * others.length + CARD_GAP * (others.length - 1);
        const rowsY = y + (availableHeight - rowsHeight) / 2;

        others.forEach((rankedTeam, index) => {
            const rowY = rowsY + index * (rowHeight + CARD_GAP);
            drawRankLabel(ctx, data.fontFamily, rankedTeam.rank, PADDING, rowY, RANK_COLUMN_WIDTH, rowHeight);
            drawTeamRow(ctx, data, rankedTeam, cardX, rowY, cardWidth, rowHeight);
        });
    }
};

/**
 * 背景を描画する（ホーム画面と同じ背景画像を全面に敷く）
 * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
 * @param {HTMLImageElement | null} image - 背景画像
 * @return {void}
 */
const drawBackground = (ctx: CanvasRenderingContext2D, image: HTMLImageElement | null): void => {
    ctx.fillStyle = "#4a6fa5";
    ctx.fillRect(0, 0, GAME_RESULT_IMAGE_WIDTH, GAME_RESULT_IMAGE_HEIGHT);

    if (!image) {
        return;
    }

    // object-fit: cover 相当で描画する
    const scale = Math.max(GAME_RESULT_IMAGE_WIDTH / image.naturalWidth, GAME_RESULT_IMAGE_HEIGHT / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx.drawImage(image, (GAME_RESULT_IMAGE_WIDTH - width) / 2, (GAME_RESULT_IMAGE_HEIGHT - height) / 2, width, height);
};

/**
 * ヘッダー（ヘッダー画像・「決算」・イベント名）を描画する
 * ヘッダー画像は元の「決算」を消してあるため、同じ位置に DotGothic16 で書き直す。
 * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
 * @param {GameResultImageData} data - 描画データ
 * @return {number} ヘッダーの下端のY座標
 */
const drawHeader = (ctx: CanvasRenderingContext2D, data: GameResultImageData): number => {
    const scale = GAME_RESULT_IMAGE_WIDTH / HEADER_SOURCE_WIDTH;
    const headerHeight = HEADER_SOURCE_HEIGHT * scale;

    if (data.headerImage) {
        ctx.drawImage(
            data.headerImage,
            0,
            0,
            HEADER_SOURCE_WIDTH,
            HEADER_SOURCE_HEIGHT,
            0,
            0,
            GAME_RESULT_IMAGE_WIDTH,
            headerHeight
        );
        // 下のカード部分との境目
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, headerHeight - 6, GAME_RESULT_IMAGE_WIDTH, 6);
    }

    HEADER_TITLE_CENTERS.forEach(({ char, x, y }) => {
        drawTitleChar(ctx, data.fontFamily, char, x * scale, y * scale, 260);
    });

    drawText(ctx, data.fontFamily, data.eventName, GAME_RESULT_IMAGE_WIDTH / 2, 30, {
        size: 36,
        align: "center",
        maxWidth: GAME_RESULT_IMAGE_WIDTH - PADDING * 2,
        strokeWidth: 9,
    });

    return headerHeight;
};

/**
 * タイトルの1文字を、金色の文字に赤と白の縁取りを重ねた立体的な装飾で描画する
 * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
 * @param {string} fontFamily - フォントファミリー
 * @param {string} char - 文字
 * @param {number} x - 中心のX座標
 * @param {number} y - 中心のY座標
 * @param {number} size - フォントサイズ
 * @return {void}
 */
const drawTitleChar = (
    ctx: CanvasRenderingContext2D,
    fontFamily: string,
    char: string,
    x: number,
    y: number,
    size: number
): void => {
    ctx.save();
    ctx.font = `${size}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.lineJoin = "round";

    // 影
    ctx.lineWidth = size * 0.26;
    ctx.strokeStyle = "rgba(60, 0, 0, 0.55)";
    ctx.strokeText(char, x + size * 0.03, y + size * 0.05);

    // 外側の白縁
    ctx.lineWidth = size * 0.24;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeText(char, x, y);

    // 赤縁
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = "#d50000";
    ctx.strokeText(char, x, y);

    // 金文字の厚み（下にずらした濃い金色）
    ctx.lineWidth = size * 0.05;
    ctx.strokeStyle = "#8c4a00";
    ctx.strokeText(char, x, y + size * 0.025);
    ctx.fillStyle = "#8c4a00";
    ctx.fillText(char, x, y + size * 0.025);

    // 金文字の縁
    ctx.lineWidth = size * 0.04;
    ctx.strokeStyle = "#e09000";
    ctx.strokeText(char, x, y);

    // 金文字（上が明るいグラデーション）
    const gradient = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
    gradient.addColorStop(0, "#fffbd0");
    gradient.addColorStop(0.35, "#ffe14a");
    gradient.addColorStop(0.65, "#f5b400");
    gradient.addColorStop(1, "#c77800");
    ctx.fillStyle = gradient;
    ctx.fillText(char, x, y);

    ctx.restore();
};

/**
 * カードの左に優勝の印（金の桃。読み込めない場合は縦書きの「優勝」）を描画する
 * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
 * @param {GameResultImageData} data - 描画データ
 * @param {number} x - 順位欄の左端のX座標
 * @param {number} y - 順位欄の上端のY座標
 * @param {number} width - 順位欄の幅
 * @param {number} height - 順位欄の高さ
 * @return {void}
 */
const drawWinnerLabel = (
    ctx: CanvasRenderingContext2D,
    data: GameResultImageData,
    x: number,
    y: number,
    width: number,
    height: number
): void => {
    const { fontFamily, winnerMarkImage } = data;

    if (winnerMarkImage) {
        const imageWidth = Math.min(width - 8, ((height - 16) * winnerMarkImage.naturalWidth) / winnerMarkImage.naturalHeight);
        const imageHeight = (imageWidth * winnerMarkImage.naturalHeight) / winnerMarkImage.naturalWidth;
        ctx.drawImage(winnerMarkImage, x + (width - imageWidth) / 2, y + (height - imageHeight) / 2, imageWidth, imageHeight);
        return;
    }

    const size = Math.min(width * 0.8, (height - 20) / 2.2);
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const options: TextOptions = { size, align: "center", strokeWidth: size * 0.22 };

    drawText(ctx, fontFamily, "優", centerX, centerY - size * 0.55, options);
    drawText(ctx, fontFamily, "勝", centerX, centerY + size * 0.55, options);
};

/**
 * カードの左に順位（黒文字の数字＋小さな「位」）を描画する
 * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
 * @param {string} fontFamily - フォントファミリー
 * @param {number} rank - 順位
 * @param {number} x - 順位欄の左端のX座標
 * @param {number} y - 順位欄の上端のY座標
 * @param {number} width - 順位欄の幅
 * @param {number} height - 順位欄の高さ
 * @return {void}
 */
const drawRankLabel = (
    ctx: CanvasRenderingContext2D,
    fontFamily: string,
    rank: number,
    x: number,
    y: number,
    width: number,
    height: number
): void => {
    const rankText = String(rank);
    const unitText = "位";
    const centerY = y + height / 2;

    // 欄の幅に収まるように数字の大きさを決める
    let numberSize = Math.min(72, height * 0.6);
    let unitSize = numberSize * 0.45;
    ctx.font = `${numberSize}px ${fontFamily}`;
    const numberWidth = ctx.measureText(rankText).width;
    ctx.font = `${unitSize}px ${fontFamily}`;
    const unitWidth = ctx.measureText(unitText).width;
    const totalWidth = numberWidth + unitWidth + 4;
    const maxWidth = width - 16;
    const ratio = totalWidth > maxWidth ? maxWidth / totalWidth : 1;
    numberSize *= ratio;
    unitSize *= ratio;

    const startX = x + (width - totalWidth * ratio) / 2;
    drawText(ctx, fontFamily, rankText, startX, centerY, { size: numberSize, color: "#000000" });
    // 「位」は数字の下端に揃える
    drawText(ctx, fontFamily, unitText, startX + (numberWidth + 4) * ratio, centerY + (numberSize - unitSize) * 0.4, {
        size: unitSize,
        color: "#000000",
    });
};

/**
 * 優勝チームのカードを描画する
 * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
 * @param {GameResultImageData} data - 描画データ
 * @param {RankedTeam} rankedTeam - 優勝チーム
 * @param {number} x - 左上のX座標
 * @param {number} y - 左上のY座標
 * @param {number} width - 幅
 * @param {number} height - 高さ
 * @param {number} textWidth - 文字を描画する幅（桃太郎と重ならない幅）
 * @return {void}
 */
const drawWinnerCard = (
    ctx: CanvasRenderingContext2D,
    data: GameResultImageData,
    rankedTeam: RankedTeam,
    x: number,
    y: number,
    width: number,
    height: number,
    textWidth: number
): void => {
    const { fontFamily } = data;
    const innerX = x + 24;
    const innerWidth = textWidth;
    // 優勝チームが複数の場合はカードが低くなるので文字も縮める
    const scale = Math.min(1, Math.max(0.55, height / WINNER_AREA_HEIGHT));

    drawCard(ctx, x, y, width, height, rankedTeam.team.teamColor);

    let cursorY = y + 70 * scale;
    drawText(ctx, fontFamily, rankedTeam.team.teamName, innerX, cursorY, {
        size: 90 * scale,
        maxWidth: innerWidth,
        strokeWidth: 16 * scale,
    });

    // 総資産（ホーム画面の持ち金欄と同じ半透明の黒帯）
    cursorY += 60 * scale;
    const bandHeight = 110 * scale;
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(innerX, cursorY, innerWidth, bandHeight);
    drawText(ctx, fontFamily, "総資産", innerX + 14, cursorY + bandHeight / 2, { size: 36 * scale });
    drawText(ctx, fontFamily, formatYen(rankedTeam.totalAssets), innerX + innerWidth - 14, cursorY + bandHeight / 2, {
        size: 64 * scale,
        align: "right",
        maxWidth: innerWidth - 160 * scale,
    });

    // メンバー名
    cursorY += bandHeight + 46 * scale;
    const memberNames = data.members
        .filter((member) => member.teamCode === rankedTeam.team.teamCode && member.nickname)
        .map((member) => member.nickname as string);
    if (memberNames.length === 0) {
        return;
    }

    drawText(ctx, fontFamily, "メンバー", innerX, cursorY, { size: 36 * scale });
    cursorY += 56 * scale;

    const memberFontSize = 48 * scale;
    const lineHeight = memberFontSize * 1.4;
    const lines = wrapWords(ctx, fontFamily, memberNames, memberFontSize, innerWidth);
    const maxLines = Math.max(1, Math.floor((y + height - 24 - cursorY + lineHeight / 2) / lineHeight));
    lines.slice(0, maxLines).forEach((line, index) => {
        const isLastVisible = index === maxLines - 1 && lines.length > maxLines;
        drawText(ctx, fontFamily, isLastVisible ? line + " …" : line, innerX, cursorY + index * lineHeight, {
            size: memberFontSize,
            maxWidth: innerWidth,
        });
    });
};

/**
 * 2位以下のチームの行を描画する
 * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
 * @param {GameResultImageData} data - 描画データ
 * @param {RankedTeam} rankedTeam - チーム
 * @param {number} x - 左上のX座標
 * @param {number} y - 左上のY座標
 * @param {number} width - 幅
 * @param {number} height - 高さ
 * @return {void}
 */
const drawTeamRow = (
    ctx: CanvasRenderingContext2D,
    data: GameResultImageData,
    rankedTeam: RankedTeam,
    x: number,
    y: number,
    width: number,
    height: number
): void => {
    const { fontFamily } = data;
    const centerY = y + height / 2;
    const fontSize = Math.min(64, height * 0.44);
    const assetsWidth = width * 0.44;
    const nameX = x + 24;

    drawCard(ctx, x, y, width, height, rankedTeam.team.teamColor);

    drawText(ctx, fontFamily, rankedTeam.team.teamName, nameX, centerY, {
        size: fontSize,
        maxWidth: x + width - assetsWidth - 32 - nameX,
        strokeWidth: fontSize * 0.2,
    });

    // 総資産（半透明の黒帯）
    const bandMargin = Math.min(16, height * 0.12);
    const bandX = x + width - assetsWidth - bandMargin;
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(bandX, y + bandMargin, assetsWidth, height - bandMargin * 2);
    drawText(ctx, fontFamily, formatYen(rankedTeam.totalAssets), bandX + assetsWidth - 14, centerY, {
        size: fontSize * 0.8,
        align: "right",
        maxWidth: assetsWidth - 28,
    });
};

/**
 * ポイントを円表記の文字列にする
 * @param {number} points - ポイント
 * @return {string} 円表記の文字列（例: 3 億 5000 万円）
 */
const formatYen = (points: number): string => `${Converter.convertPointsToYenV3(points)}円`;

/**
 * チームカラーの角丸カードを描画する
 * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
 * @param {number} x - 左上のX座標
 * @param {number} y - 左上のY座標
 * @param {number} width - 幅
 * @param {number} height - 高さ
 * @param {string} color - 塗りつぶし色
 * @return {void}
 */
const drawCard = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string
): void => {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, CARD_RADIUS);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, CARD_RADIUS);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
    ctx.stroke();
    ctx.restore();
};

/**
 * テキストを描画する（最大幅を超える場合はフォントサイズを縮小する）
 * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
 * @param {string} fontFamily - フォントファミリー
 * @param {string} text - テキスト
 * @param {number} x - X座標
 * @param {number} y - Y座標（中央）
 * @param {TextOptions} options - 描画オプション
 * @return {void}
 */
const drawText = (
    ctx: CanvasRenderingContext2D,
    fontFamily: string,
    text: string,
    x: number,
    y: number,
    options: TextOptions
): void => {
    const { align = "left", maxWidth, color = "#ffffff", strokeWidth = 0 } = options;

    let size = options.size;
    ctx.font = `${size}px ${fontFamily}`;
    if (maxWidth) {
        const width = ctx.measureText(text).width;
        if (width > maxWidth) {
            size = Math.max(12, (size * maxWidth) / width);
            ctx.font = `${size}px ${fontFamily}`;
        }
    }

    ctx.textAlign = align;

    if (strokeWidth > 0) {
        ctx.lineJoin = "round";
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = "#000000";
        ctx.strokeText(text, x, y);
    }

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
};

/**
 * 単語（メンバー名）を最大幅で折り返して行に分ける
 * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
 * @param {string} fontFamily - フォントファミリー
 * @param {string[]} words - 単語のリスト
 * @param {number} size - フォントサイズ
 * @param {number} maxWidth - 最大幅
 * @return {string[]} 行のリスト
 */
const wrapWords = (
    ctx: CanvasRenderingContext2D,
    fontFamily: string,
    words: string[],
    size: number,
    maxWidth: number
): string[] => {
    const separator = "　";
    ctx.font = `${size}px ${fontFamily}`;

    const lines: string[] = [];
    let current = "";
    words.forEach((word) => {
        const candidate = current ? current + separator + word : word;
        if (current && ctx.measureText(candidate).width > maxWidth) {
            lines.push(current);
            current = word;
        } else {
            current = candidate;
        }
    });
    if (current) {
        lines.push(current);
    }
    return lines;
};
