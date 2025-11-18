import Mask from "@/components/common/modal/modal";
import InputFrame from "../input/inputFrame";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function AddUserModal({ open, onClose, onConfirm }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <Mask showModal={open} title="增加使用者" onClose={onClose} onConfirm={onConfirm} width="60vw">
      <div className="flex justify-between">
        <div className="text-[var(--black)] font-bold flex flex-col gap-4">
          <div className="flex">
            <label id="username" className="text-[length:var(--font-size-4xl)]">
              用戶名稱：
            </label>
            <InputFrame type="text" id="username" placeholder="USER NAME" />
          </div>

          <div className="flex">
            <label id="email" className="text-[length:var(--font-size-4xl)]">
              信箱：
            </label>
            <InputFrame type="text" id="email" placeholder="EMAIL" />
          </div>

          <div className="flex">
            <label id="account" className="text-[length:var(--font-size-4xl)]">
              帳號：
            </label>
            <InputFrame type="text" id="account" placeholder="ACCOUNT" />
          </div>

          <div className="flex relative">
            <label id="password" className="text-[length:var(--font-size-4xl)]">
              密碼：
            </label>
            {showPassword ? <InputFrame type="text" id="password" placeholder="PASSWORD" /> : <InputFrame type="password" id="password" placeholder="PASSWORD" />}
            {/* 眼睛 icon */}
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </div>
        <div className="text-[var(--black)] font-bold flex flex-col gap-4">
          <div className="flex">
            <label id="username" className="text-[length:var(--font-size-4xl)]">
              用戶名稱：
            </label>
            <InputFrame type="text" id="username" placeholder="USER NAME" />
          </div>
          <div className="flex">
            <label id="username" className="text-[length:var(--font-size-4xl)]">
              用戶名稱：
            </label>
            <InputFrame type="text" id="username" placeholder="USER NAME" />
          </div>{" "}
          <div className="flex">
            <label id="username" className="text-[length:var(--font-size-4xl)]">
              用戶名稱：
            </label>
            <InputFrame type="text" id="username" placeholder="USER NAME" />
          </div>
        </div>
      </div>
    </Mask>
  );
}

export function CountAbnormalModal({ open, onClose, onConfirm }) {
  return (
    <Mask showModal={open} title="數量異常" onClose={onClose} onConfirm={onConfirm}>
      <div className="text-[var(--black)] font-bold flex flex-col gap-4">
        <div className="flex">
          <label id="boxcount" className="text-[length:var(--font-size-4xl)]">
            更正箱數：
          </label>
          <InputFrame type="number" id="boxcount" placeholder="0" />
        </div>

        <div className="flex">
          <label id="bagcount" className="text-[length:var(--font-size-4xl)]">
            更正包數：
          </label>
          <InputFrame type="number" id="bagcount" placeholder="0" />
        </div>

      </div>
    </Mask>
  );
}
