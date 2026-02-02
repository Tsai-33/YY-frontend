import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import Alert from "./alert/alert";


// 公开路由列表 (不需要登录即可访问)
const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/forgot-password",
  "/auth/reset",
  "/auth/change-password",
  "/auth/reset-password",
  "/auth/logout",
];

// 所有已登入用戶都可訪問的路由 (不需要特定權限)
const AUTHENTICATED_ROUTES = [
  "/workspace",
];

// 需要特定权限的路由配置 (使用英文權限名稱)
const PERMISSION_ROUTES = {
  "/outboundExternal": "outboundExternal",
  "/outboundExternalNew": "outboundExternal",
  "/outboundInternal": "outboundInternal",
  "/shelfTransfer": "shelfTransfer",
  "/inbound": "inbound",
  "/stockQuery": "stockQuery",
  "/transfer": "transfer",
  "/inventory": "inventory",
};

// 權限名稱映射 (英文 -> 中文顯示名稱)
const PERMISSION_DISPLAY_NAMES = {
  "inbound": "入倉",
  "outboundExternal": "銷貨",
  "outboundInternal": "領用",
  "shelfTransfer": "理貨",
  "stockQuery": "庫存查詢",
  "transfer": "調撥",
  "inventory": "盤點",
};

export default function ProtectedRoute({ children, requiredPermission = null }) {
  const router = useRouter();
  const { isAuthenticated, permissions = {}, userRole } = useSelector(
    (s) => s.user
  );

  const alertShown = useRef(false);
  const pathname = router.pathname;

  // 公開路由檢查: "/" 必須精確比較; 其他路由可以使用 startsWith
  const isPublicRoute = PUBLIC_ROUTES.some((r) =>
    r === "/" ? pathname === "/" : pathname.startsWith(r)
  );

  useEffect(() => {
    // 切換路徑時重置 alert
    alertShown.current = false;

    // 1) 如果是公開路由: 允許進入; 但如果已登入且正在 /auth/login 則重定向到 workspace
    if (isPublicRoute) {
      if (isAuthenticated && pathname === "/auth/login") {
        router.replace("/workspace");
      }
      return;
    }

    // 2) 未登入 => 導向登入頁
    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    // 3) Admin / Manager => 全部 bypass
    if (userRole === "admin" || userRole === "manager") {
      return;
    }

    // 4) User => 先檢查 AUTHENTICATED_ROUTES, 再檢查 PERMISSION_ROUTES
    if (userRole === "user") {
      // 先檢查是否為所有已登入用戶都可訪問的路由
      const isAuthenticatedRoute = AUTHENTICATED_ROUTES.some((r) =>
        r === "/" ? pathname === "/" : pathname === r || pathname.startsWith(r + "/")
      );
      if (isAuthenticatedRoute) {
        return; // 允許訪問
      }

      // autoPermission: 如果傳入 requiredPermission 則優先使用, 否則在 map 中尋找
      // 注意: PERMISSION_ROUTES 可以使用精確 key 或前綴; 這裡我們支援前綴 (startsWith)
      const autoPermissionKey = requiredPermission
        ? requiredPermission
        : (() => {
            // 在 PERMISSION_ROUTES 中尋找 pathname 以 key 開頭的 key
            for (const k in PERMISSION_ROUTES) {
              if (k === "/") {
                if (pathname === "/") return PERMISSION_ROUTES[k];
              } else if (pathname === k || pathname.startsWith(k + "/") || pathname.startsWith(k)) {
                // 支援精確匹配和子路徑
                return PERMISSION_ROUTES[k];
              }
            }
            return null;
          })();

      // 如果路由未宣告 => 阻擋 user
      if (!autoPermissionKey) {
        if (!alertShown.current) {
          alertShown.current = true;
          Alert({
            title: "限制訪問",
            html: "此頁面僅限管理員或管理人員訪問",
            confirmButtonColor: "#b32627",
            onConfirm: () => router.replace("/workspace"),
          });
        }
        router.replace("/workspace");
        return;
      }

      // 如果路由有映射但 user 沒有權限 => 阻擋
      const hasPerm = !!permissions[autoPermissionKey];
      if (!hasPerm) {
        if (!alertShown.current) {
          alertShown.current = true;
          const display = PERMISSION_DISPLAY_NAMES[autoPermissionKey] || autoPermissionKey;
          Alert({
            title: "權限不足",
            html: `您沒有「${display}」權限，無法訪問此頁面`,
            confirmButtonColor: "#b32627",
            onConfirm: () => router.replace("/workspace"),
          });
        }
        router.replace("/workspace");
        return;
      }

      // 如果有權限 => 允許進入 (nothing to do here)
      return;
    }

    // Fallback: 如果 userRole 不是 admin/manager/user, 預設阻擋
    router.replace("/workspace");
  }, [pathname, isPublicRoute, isAuthenticated, userRole, permissions, requiredPermission, router]);

  // RENDER LOGIC — 完全透明，不渲染 Loading
  // 1) Public route → render
  if (isPublicRoute) return <>{children}</>;

  // 2) 如果未登入 => null (redirect 已執行)
  if (!isAuthenticated) return null;

  // 3) Admin/Manager => render
  if (userRole === "admin" || userRole === "manager") return <>{children}</>;

  // 4) User: 先檢查 AUTHENTICATED_ROUTES, 再檢查 PERMISSION_ROUTES
  const isAuthenticatedRoute = AUTHENTICATED_ROUTES.some((r) =>
    r === "/" ? pathname === "/" : pathname === r || pathname.startsWith(r + "/")
  );
  if (isAuthenticatedRoute) {
    return <>{children}</>;
  }

  const autoPermissionKey = requiredPermission
    ? requiredPermission
    : (() => {
        for (const k in PERMISSION_ROUTES) {
          if (k === "/") {
            if (pathname === "/") return PERMISSION_ROUTES[k];
          } else if (pathname === k || pathname.startsWith(k + "/") || pathname.startsWith(k)) {
            return PERMISSION_ROUTES[k];
          }
        }
        return null;
      })();

  if (autoPermissionKey && permissions[autoPermissionKey]) {
    return <>{children}</>;
  }

  // 5) 其他情況: 不渲染 (useEffect 會執行 redirect + alert)
  return null;
}