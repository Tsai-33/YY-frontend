import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

// 共用 Toast 設定
const Toast = Swal.mixin({
  toast: true,
  position: "top-end", 
  showConfirmButton: false,
  timer: 3000, // 不要自動關閉
  customClass: {
    popup: "my-toast-popup",
    title: "my-toast-title",
    timerProgressBar: "my-toast-bar"
  }
});

// 成功訊息
export const successAlert = (message) => {
  Toast.fire({
    icon: "success",
    title: message
  });
};

// 錯誤訊息
export const errorAlert = (message) => {
  Toast.fire({
    icon: "error",
    title: message
  });
};

// 警告訊息
export const showWarning = (message) => {
  Toast.fire({
    icon: "warning",
    title: message
  });
};

