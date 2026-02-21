import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Stack } from "@mui/material";
import { DialogConstants } from "@/constants/dialogConstants";
import CustomButton from "./CustomButton";

/**
 * ConfirmDialogコンポーネントのプロパティ型定義
 * @param {boolean} isConfirmOpen - ダイアログの開閉状態
 * @param {string} title - ダイアログのタイトル（オプション）
 * @param {string} message - ダイアログのメッセージ
 * @param {() => void} onConfirm - 確認ボタンがクリックされたときのハンドラー
 * @param {() => void} onCancel - キャンセルボタンがクリックされたときのハンドラー
 * @param {string} confirmText - 確認ボタンのテキスト（オプション）
 * @param {string} cancelText - キャンセルボタンのテキスト（オプション）
 */
interface ConfirmDialogProps {
    isConfirmOpen: boolean;
    title?: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}

/**
 * ConfirmDialogコンポーネント
 * @param {ConfirmDialogProps} props - ConfirmDialogのプロパティ
 * @returns {React.JSX.Element} - ConfirmDialogコンポーネント
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isConfirmOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = DialogConstants.TEXT.OK,
    cancelText = DialogConstants.TEXT.CANCEL,
}: ConfirmDialogProps): React.JSX.Element => {
    /**
     * 確認ボタンがクリックされたときのハンドラー
     */
    const handleConfirm = () => {
        onConfirm();
    };

    /**
     * キャンセルボタンがクリックされたときのハンドラー
     */
    const handleCancel = () => {
        onCancel();
    };

    return (
        <Dialog
            open={isConfirmOpen}
            onClose={handleCancel}
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            sx={{ zIndex: 1000 }}
            maxWidth="lg"
            fullWidth
        >
            {title && <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>}
            <DialogContent>
                <DialogContentText id="confirm-dialog-description" whiteSpace="pre-wrap">
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Stack
                    direction="column"
                    spacing={1.5}
                    sx={{ width: "100%" }}
                >
                    <CustomButton
                        onClick={handleCancel}
                        color="primary"
                        variant="outlined"
                        fullWidth
                    >
                        {cancelText}
                    </CustomButton>
                    <CustomButton
                        onClick={handleConfirm}
                        color="success"
                        variant="contained"
                        fullWidth
                    >
                        {confirmText}
                    </CustomButton>
                </Stack>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
