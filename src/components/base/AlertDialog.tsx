import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { DialogConstants } from "@/constants/dialogConstants";
import CustomButton from "./CustomButton";
import { ColorNames } from "@/theme/colors";

/**
 * AlertDialogコンポーネントのプロパティ型定義
 * @param {boolean} isAlertOpen - ダイアログの開閉状態
 * @param {string} [title] - ダイアログのタイトル（オプション）
 * @param {string} message - ダイアログのメッセージ
 * @param {() => void} onOk - OKボタンがクリックされたときのハンドラー
 * @param {string} [okText] - OKボタンのテキスト（オプション）
 */
interface AlertDialogProps {
    isAlertOpen: boolean;
    title?: string;
    message: string;
    buttonColor?: ColorNames;
    onOk: () => void;
    okText?: string;
}

/**
 * AlertDialogコンポーネント
 * @param {AlertDialogProps} props - AlertDialogのプロパティ
 * @returns {React.JSX.Element} - AlertDialogコンポーネント
 */
const AlertDialog: React.FC<AlertDialogProps> = ({
    isAlertOpen,
    title,
    message,
    buttonColor = "error",
    onOk,
    okText = DialogConstants.TEXT.CLOSE,
}: AlertDialogProps): React.JSX.Element => {
    const handleOk = () => {
        onOk();
    };

    return (
        <Dialog
            open={isAlertOpen}
            onClose={handleOk}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            sx={{ zIndex: 1000 }}
            maxWidth="lg"
            fullWidth
        >
            {title && <DialogTitle id="alert-dialog-title">{title}</DialogTitle>}
            <DialogContent>
                <DialogContentText id="alert-dialog-description" whiteSpace="pre-wrap">
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <CustomButton
                    onClick={handleOk}
                    color={buttonColor}
                    variant="contained"
                    fullWidth
                >
                    {okText}
                </CustomButton>
            </DialogActions>
        </Dialog>
    );
};

export default AlertDialog;
