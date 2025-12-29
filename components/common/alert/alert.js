// components/Alert.js
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function Alert({
  title,
  html = ``,
  showConfirm = true,
  confirmButtonText = "確定",
  confirmButtonColor = "#008b48",
  showCancel = false,
  cancelButtonText = "取消",
  cancelButtonColor = "#d33",
  timer = null,
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
    
    // --- 關鍵修改 1: 重新啟用 Focus ---
    focusConfirm: true, // 讓 Enter 鍵能對準確認按鈕
    
    // 移除 didOpen 裡面的 blur，讓按鈕可以被選中
    didOpen: () => {
       // 如果不需要特定的 didOpen 行為，可以直接拿掉或留空
    },
  };

  const root = document.getElementById("__next");
  
  // 🔹 關鍵修改 2: 不要立即 inert
  // inert 會讓所有鍵盤事件被阻擋，包括 Enter 鍵
  // 我們改用 SweetAlert2 的事件生命週期
  
  return MySwal.fire({
    ...options,
    didOpen: () => {
      // 彈窗打開後，只把背景設為 inert，Swal 的容器本身不在 __next 裡面
      if (root) root.setAttribute('aria-hidden', 'true');
    },
    willClose: () => {
      if (root) root.removeAttribute('aria-hidden');
    }
  }).then((result) => {
    if (result.isConfirmed && onConfirm) onConfirm();
    if (result.isDismissed && (result.dismiss === Swal.DismissReason.cancel) && onCancel) onCancel();
  });
}