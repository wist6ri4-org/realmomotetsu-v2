/**
 * 結果画像出力フォーム
 */
"use client";

import AlertDialog from "@/components/base/AlertDialog";
import CustomButton from "@/components/base/CustomButton";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { DialogConstants } from "@/constants/dialogConstants";
import { getMessage } from "@/constants/messages";
import { Member } from "@/features/init/types";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { TeamData } from "@/types/TeamData";
import { drawGameResultImage } from "@/utils/gameResultImage";
import { PointsUtils } from "@/utils/pointsUtils";
import { Box } from "@mui/material";
import React, { useEffect, useState } from "react";

const MOMOTARO_IMAGE_SRC = "/goal_momotaro.png";
const HEADER_IMAGE_SRC = "/kessan_header.jpg";
const WINNER_MARK_IMAGE_SRC = "/gold_peach.png";
const BACKGROUND_IMAGE_SRC = "/background.jpg";
const DOT_GOTHIC_FONT_VARIABLE = "--font-dot-gothic";
const DOT_GOTHIC_FONT_FALLBACK = '"DotGothic16", monospace';

/**
 * GameResultImageFormコンポーネントのプロパティ型定義
 * @property {TeamData[]} teamData - チームデータのリスト
 * @property {Member[]} members - 参加者のリスト
 * @property {string} eventName - イベント名
 * @property {string} eventCode - イベントコード（ファイル名に使う）
 */
interface GameResultImageFormProps {
    teamData: TeamData[];
    members: Member[];
    eventName: string;
    eventCode: string;
}

/**
 * 生成済みの結果画像
 * @property {File} file - 画像ファイル
 * @property {string} url - プレビュー用のオブジェクトURL
 */
type GeneratedImage = {
    file: File;
    url: string;
};

/**
 * 画像を読み込む
 * @param {string} src - 画像のURL
 * @return {Promise<HTMLImageElement>} 読み込み済みの画像
 */
const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        image.src = src;
    });

/**
 * 結果画像出力フォームコンポーネント
 * @returns {JSX.Element} - GameResultImageFormコンポーネント
 */
const GameResultImageForm: React.FC<GameResultImageFormProps> = ({
    teamData,
    members,
    eventName,
    eventCode,
}): React.JSX.Element => {
    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);

    /**
     * 画像を差し替えた時・アンマウント時にオブジェクトURLを解放する
     */
    useEffect(() => {
        return () => {
            if (generatedImage) {
                URL.revokeObjectURL(generatedImage.url);
            }
        };
    }, [generatedImage]);

    /**
     * 結果画像を生成する
     * @return {Promise<void>} - 生成処理の完了を示すPromise
     */
    const generateImage = async (): Promise<void> => {
        if (teamData.length === 0) {
            await showAlertDialog({
                title: DialogConstants.TITLE.ERROR,
                message: getMessage("GAME_RESULT_IMAGE_NO_TEAMS"),
            });
            return;
        }

        setIsLoading(true);

        try {
            const rankedTeams = PointsUtils.rankTeamsByTotalAssets(teamData);

            // DotGothic16 は next/font が html の CSS 変数に設定しているため、その指定をそのまま使う
            const fontFamily =
                getComputedStyle(document.documentElement).getPropertyValue(DOT_GOTHIC_FONT_VARIABLE).trim() ||
                DOT_GOTHIC_FONT_FALLBACK;
            // 日本語のグリフは表示中の文字分しか読み込まれていないため、画像に描く文字を先に読み込む
            const glyphs = [
                eventName,
                "決算優勝メンバー総資産位兆億万円－…0123456789",
                ...teamData.map((team) => team.teamName),
                ...members.map((member) => member.nickname ?? ""),
            ].join("");
            await document.fonts.load(`40px ${fontFamily}`, glyphs);
            await document.fonts.ready;

            const [momotaroImage, headerImage, winnerMarkImage, backgroundImage] = await Promise.all([
                loadImage(MOMOTARO_IMAGE_SRC),
                // ヘッダー・優勝の印・背景は無くても画像は作れるので、失敗しても続行する
                loadImage(HEADER_IMAGE_SRC).catch(() => null),
                loadImage(WINNER_MARK_IMAGE_SRC).catch(() => null),
                loadImage(BACKGROUND_IMAGE_SRC).catch(() => null),
            ]);

            const canvas = document.createElement("canvas");
            drawGameResultImage(canvas, {
                eventName,
                rankedTeams,
                members,
                fontFamily,
                momotaroImage,
                headerImage,
                winnerMarkImage,
                backgroundImage,
            });

            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
            if (!blob) {
                throw new Error("Failed to convert canvas to blob.");
            }

            const file = new File([blob], `result_${eventCode}.png`, { type: "image/png" });
            setGeneratedImage({ file, url: URL.createObjectURL(blob) });
        } catch (error) {
            console.error(error);
            await showAlertDialog({
                title: DialogConstants.TITLE.ERROR,
                message: getMessage("GAME_RESULT_IMAGE_FAILED"),
            });
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 結果画像を共有・保存する
     * 共有シートが使える端末（主にスマホ）では共有シートを開き、使えない場合はダウンロードする。
     * iOS では共有はユーザー操作の直後に呼ぶ必要があるため、画像は事前に生成しておく。
     * @return {Promise<void>} - 共有処理の完了を示すPromise
     */
    const shareImage = async (): Promise<void> => {
        if (!generatedImage) {
            return;
        }

        const shareData = { files: [generatedImage.file] };
        if (typeof navigator.canShare === "function" && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                // ユーザーが共有をキャンセルした場合はエラーにしない
                if (error instanceof DOMException && error.name === "AbortError") {
                    return;
                }
                console.error(error);
                await showAlertDialog({
                    title: DialogConstants.TITLE.ERROR,
                    message: getMessage("GAME_RESULT_IMAGE_SHARE_FAILED"),
                });
            }
            return;
        }

        const link = document.createElement("a");
        link.href = generatedImage.url;
        link.download = generatedImage.file.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <>
            <FormTitle title="結果画像の出力" />
            <FormDescription>
                ゲーム終了時に公開する、各チームの順位と総資産の画像を生成する。
                <br />
                生成した画像は「共有/保存」ボタン、または画像の長押しで保存できる。
            </FormDescription>
            <Box
                border={1}
                borderRadius={1}
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    margin: 2,
                    padding: 2,
                    backgroundColor: "white",
                }}
            >
                {generatedImage && (
                    <Box sx={{ marginBottom: 2, textAlign: "center" }}>
                        {/* 生成した画像のオブジェクトURLを表示するため next/image は使わない */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={generatedImage.url}
                            alt="結果画像"
                            style={{ width: "100%", maxWidth: 360, height: "auto", border: "1px solid #ccc" }}
                        />
                    </Box>
                )}
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <CustomButton
                        type="button"
                        color={generatedImage ? "light" : "success"}
                        onClick={generateImage}
                        disabled={isLoading}
                        loading={isLoading}
                        sx={{ marginRight: generatedImage ? 1 : 0 }}
                    >
                        {generatedImage ? "再生成" : "画像を生成"}
                    </CustomButton>
                    {generatedImage && (
                        <CustomButton type="button" color="success" onClick={shareImage} disabled={isLoading}>
                            共有/保存
                        </CustomButton>
                    )}
                </Box>
            </Box>
            <AlertDialog
                isAlertOpen={isAlertOpen}
                title={alertOptions.title}
                message={alertOptions.message}
                onOk={handleAlertOk}
                okText={alertOptions.okText}
            />
        </>
    );
};

export default GameResultImageForm;
