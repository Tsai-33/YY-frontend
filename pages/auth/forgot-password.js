import { useState } from "react";
import { useRouter } from "next/router";
import { forgotPassword as forgotPasswordAPI } from "../api/authService";
import InputFrame from "@/components/common/input/inputFrame";
import Loading from "@/components/common/loading/loading";
import Alert from "@/components/common/alert/alert";
import Link from "next/link";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // 处理发送重置链接
  const handleSendResetLink = async (e) => {
    e.preventDefault();

    // 验证输入
    if (!email) {
      Alert({
        title: "錯誤",
        text: "請輸入帳號",
        confirmButtonColor: "#b32627",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPasswordAPI(email);

      if (response.success) {
        setEmailSent(true);
        Alert({
          title: "郵件已發送",
          text: "如果該郵箱已註冊，您將收到密碼重置鏈接",
          confirmButtonColor: "#008b48",
        });
      } else {
        // Validation errors (格式錯誤，缺少欄位) → 顯示錯誤訊息
        Alert({
          title: "錯誤",
          text: response.message || "發送失敗，請重試",
          confirmButtonColor: "#b32627",
        });
      }
    } catch (error) {
      console.warn("发送重置链接错误:", error);
      // 为了安全，即使出错也显示成功消息 (network error, server error)
      setEmailSent(true);
      Alert({
        title: "郵件已發送",
        text: "如果該郵箱已註冊，您將收到密碼重置鏈接",
        confirmButtonColor: "#008b48",
      });
    } finally {
      setLoading(false);
    }
  };

  // 按Enter键发送
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSendResetLink(e);
    }
  };

  return (
    <>
      {loading && <Loading />}

      <div className="flex items-center justify-center flex-1 min-h-0">
        <div className="w-full max-w-md">
          {/* 表单 */}
          <div>
            {!emailSent ? (
              <>
                {/* 标题 */}
                <h2 className="text-2xl font-bold text-black mb-8 text-center">
                  忘記密碼 Forgot your password
                </h2>

                <form onSubmit={handleSendResetLink} className="space-y-5">
                  {/* 帳號输入 */}
                  <div>
                    <InputFrame
                      type="text"
                      name="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="輸入您的郵箱 Email"
                      borderColor=""
                      className="text-base w-full"
                    />
                  </div>

                  {/* 按钮 - 送出 */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-[#008b48] hover:bg-[#007a3f] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      送出
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                {/* 邮件已发送提示 */}
                <div className="text-center">
                  <div className="text-6xl mb-4">📧</div>
                  <h2 className="text-2xl font-bold text-black mb-4">
                    郵件已發送
                  </h2>
                  <p className="text-gray-600 mb-6 text-sm">
                    如果該郵箱已註冊，您將收到密碼重置鏈接。
                    <br />
                    請檢查您的郵箱（包括垃圾郵件文件夾）。
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setEmailSent(false);
                        setEmail("");
                      }}
                      className="w-full py-3 bg-[#008b48] hover:bg-[#007a3f] text-white font-medium rounded-lg transition-colors">
                      重新發送
                    </button>

                    <Link href="/auth/login">
                      <button className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors">
                        返回登入
                      </button>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

