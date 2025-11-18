// components/Alert.js
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

/**
 * 基本 SweetAlert2 共用函式
 * 最常用的情況已經設定預設值
 */
export default function Alert({
  title,                     // 必傳標題
  text = "",                  // 文字內容
  showConfirm = true,         // 預設都有確認按鈕
  confirmButtonText = "確定", // 預設文字 "確定"
  confirmButtonColor = "#008b48",
  showCancel = false,
  cancelButtonText = "取消",
  cancelButtonColor = "#d33",
  timer = null,               // 預設不自動消失
  onConfirm = null,
  onCancel = null,
}) {
  const options = {
    title,
    text,
    timer,
    showConfirmButton: showConfirm,
    showCancelButton: showCancel,
    confirmButtonText,
    confirmButtonColor,
    cancelButtonText,
    cancelButtonColor,
    allowOutsideClick: !showConfirm && !showCancel,
  };

  return MySwal.fire(options).then((result) => {
    if (result.isConfirmed && onConfirm) onConfirm();
    if (result.isDismissed && onCancel) onCancel();
  });
}
