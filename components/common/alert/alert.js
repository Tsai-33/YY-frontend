// components/Alert.js
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

/**
 * 基本 SweetAlert2 共用函式
 * 會自動處理背景 focus / inert，避免 aria-hidden 警告
 */
export default function Alert({
  title, // 必傳標題
  html = ``, // 文字內容
  showConfirm = true, // 預設都有確認按鈕
  confirmButtonText = "確定", // 預設文字 "確定"
  confirmButtonColor = "#008b48",
  showCancel = false,
  cancelButtonText = "取消",
  cancelButtonColor = "#d33",
  timer = null, // 預設不自動消失
  onConfirm = null,
  onCancel = null,
}) {
  const options = {
    title,
    html,
    timer,
    showConfirmButton: showConfirm,
    showCancelButton: showCancel,
    confirmButtonText,
    confirmButtonColor,
    cancelButtonText,
    cancelButtonColor,
    allowOutsideClick: !showConfirm && !showCancel,
    focusCancel: false, // 防止 SweetAlert2 自動 focus 按鈕
    focusConfirm: false, // 同上
    didOpen: () => {
      // Modal 打開後立即 blur 所有焦點元素
      document.activeElement?.blur();
    },
  };

  // 🔹 取得 root，並設定 inert
  const root = document.getElementById("__next");
  const activeElement = document.activeElement; // 先記住目前 focus 元素
  if (activeElement) activeElement.blur(); // 先 blur 避免警告

  if (root) root.inert = true; // 阻止背景 focus / 點擊

  return MySwal.fire(options).then((result) => {
    // 結束後解除 inert
    if (root) root.inert = false;

    // 可選：恢復焦點
    if (activeElement) activeElement.focus();

    if (result.isConfirmed && onConfirm) onConfirm();
    if (result.isDismissed && onCancel) onCancel();
  });
}
