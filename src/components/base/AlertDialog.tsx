import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import { DialogConstants } from "@/constants/dialogConstants";

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
        >
            {title && <DialogTitle id="alert-dialog-title">{title}</DialogTitle>}
            <DialogContent>
                <DialogContentText id="alert-dialog-description" whiteSpace="pre-wrap">
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleOk} color="primary" variant="contained">
                    {okText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AlertDialog;
