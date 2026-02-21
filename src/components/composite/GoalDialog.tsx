import { Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, Typography } from '@mui/material';
import Confetti from 'react-canvas-confetti';
import React, { useRef, useCallback, useEffect } from "react";
import CustomButton from '../base/CustomButton';
import Image from 'next/image';


/**
 * GoalDialogコンポーネントのプロパティ型定義
 * @property {string} goalStationName - 目的駅の名前
 * @property {boolean} isOpen - ダイアログの開閉状態
 * @property {() => void} handleClose - ダイアログを閉じるハンドラー
 * @property {() => void} handlePurchaseStation - 駅購入ページへ遷移するハンドラー
 */
interface GoalDialogProps {
    goalStationName: string;
    isOpen: boolean;
    handleClose: () => void;
    handlePurchaseStation: () => void;
}

/**
 * ゴールダイアログコンポーネント
 * @param {GoalDialogProps} props - GoalDialogのプロパティ
 * @returns {JSX.Element} - GoalDialogコンポーネント
 */
const GoalDialog: React.FC<GoalDialogProps> = ({ goalStationName, isOpen, handleClose, handlePurchaseStation }: GoalDialogProps): React.JSX.Element => {

    // Confettiの型定義
    type ConfettiOnInit = NonNullable<React.ComponentProps<typeof Confetti>['onInit']>;
    type ConfettiInstance = Parameters<ConfettiOnInit>[0]['confetti'];
    type ConfettiOptions = Parameters<ConfettiInstance>[0];

    // Confettiインスタンスを保持するためのref
    const confettiRef = useRef<ConfettiInstance | null>(null);

    // コンポーネントのマウント時にConfettiインスタンスを初期化
    const makeShot = useCallback((particleRatio: number, opts: ConfettiOptions) => {
        if (confettiRef.current) {
            confettiRef.current({
                ...opts,
                origin: { y: 0.7 },
                particleCount: Math.floor(150 * particleRatio),
                colors: ['#FFD700', '#FF6347', '#00BFFF', '#32CD32', '#FF69B4'],
            });
        }
    }, []);

    // ゴールダイアログが開いたときにコンフェッティを発射するエフェクト
    const fireConfetti = useCallback(() => {
        makeShot(0.25, { spread: 26, startVelocity: 55 });
        makeShot(0.2, { spread: 60 });
        makeShot(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        makeShot(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        makeShot(0.1, { spread: 120, startVelocity: 45 });
    }, [makeShot]);

    // ゴールダイアログが開いたときにコンフェッティを発射するエフェクト
    useEffect(() => {
        if (isOpen) {
            const timeoutId = window.setTimeout(fireConfetti, 300);
            const intervalId = window.setInterval(fireConfetti, 800);
            const stopId = window.setTimeout(() => {
                window.clearInterval(intervalId);
            }, 3000);
            return () => {
                window.clearTimeout(timeoutId);
                window.clearInterval(intervalId);
                window.clearTimeout(stopId);
            };
        }
        return undefined;
    }, [isOpen, fireConfetti]);

    // ゴールダイアログが閉じられたときにConfettiインスタンスをリセット
    const onInit = useCallback<ConfettiOnInit>(({ confetti }) => {
        confettiRef.current = confetti;
    }, []);

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            aria-labelledby="goal-dialog-title"
            aria-describedby="goal-dialog-description"
            sx={{ zIndex: 1000 }}
            maxWidth="lg"
            fullWidth
        >
            <Confetti
                onInit={onInit} style={{
                    position: 'fixed',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    zIndex: 2000,
                    pointerEvents: 'none',
                }} />
            <DialogTitle
                id="goal-dialog-title"
                sx={{ textAlign: "center" }}
                variant='h4'
            >
                目的地到着！！
            </DialogTitle>
            <DialogContent>
                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                    padding: 3,
                    overflow: "hidden",
                    "&::before": {
                        content: '""',
                        position: "absolute",
                        inset: 0,
                        backgroundImage: "url(/goal_background.png)",
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        filter: "blur(2px)",
                        zIndex: 0,
                    },
                    "& > *": {
                        position: "relative",
                        zIndex: 1,
                    },
                }}>
                    <Box
                        sx={{
                            "@keyframes dropFromTop": {
                                "0%": {
                                    transform: "translateY(-60px) scale(1.3)",
                                    opacity: 0,
                                },
                                "60%": {
                                    transform: "translateY(6px) scale(0.95)",
                                    opacity: 1,
                                },
                                "80%": {
                                    transform: "translateY(-3px) scale(1.02)",
                                },
                                "100%": {
                                    transform: "translateY(0) scale(1)",
                                    opacity: 1,
                                },
                            },
                            animation: isOpen ? "dropFromTop 0.8s ease-out 0.3s both" : "none",
                            textAlign: "center",
                            mb: 1,
                        }}
                    >
                        <Typography
                            component="p"
                            sx={{
                                fontSize: "clamp(1.8rem, 8vw, 3rem)",
                                fontWeight: 900,
                                letterSpacing: "0.5rem",
                                color: "#FFD700",
                                textShadow: "0.3rem 0.3rem 0 #FF6347, 0.5rem 0.7rem 0 rgba(0,0,0,0.3)",
                                lineHeight: 1.2,
                            }}
                        >
                            ゴール
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            width: { xs: "55%", sm: "50%", md: "45%" },
                            "@keyframes popFromBottom": {
                                "0%": {
                                    transform: "translateY(60px) scale(0.3)",
                                    opacity: 0,
                                },
                                "60%": {
                                    transform: "translateY(-8px) scale(1.08)",
                                    opacity: 1,
                                },
                                "80%": {
                                    transform: "translateY(4px) scale(0.97)",
                                },
                                "100%": {
                                    transform: "translateY(0) scale(1)",
                                    opacity: 1,
                                },
                            },
                            animation: isOpen ? "popFromBottom 0.9s ease-out 1s both" : "none",
                        }}>
                        <Image
                            src="/goal_momotaro.png"
                            alt="桃太郎"
                            width={1000}
                            height={1000}
                            priority
                        />
                    </Box>
                </Box>
                <DialogContentText id="goal-dialog-description" whiteSpace="pre-wrap" sx={{ mt: 1 }}>
                    目的地の
                    <Typography
                        variant={"h5"}
                        component={"span"}
                        sx={{
                            fontWeight: 700,
                            mx: 1.5,
                        }}
                    >
                        {goalStationName}
                    </Typography>
                    に一番乗りで～～～～～す！
                    <br />
                    駅を購入しますか？
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Stack
                    direction="column"
                    spacing={1}
                    sx={{ width: "100%" }}
                >
                    <CustomButton
                        onClick={handleClose}
                        color="primary"
                        variant="outlined"
                        fullWidth
                    >
                        キャンセル
                    </CustomButton>
                    <CustomButton
                        onClick={handlePurchaseStation}
                        color="warning"
                        variant="contained"
                        fullWidth
                    >
                        購入する
                    </CustomButton>
                </Stack>

            </DialogActions>
        </Dialog>
    );
}

export default GoalDialog