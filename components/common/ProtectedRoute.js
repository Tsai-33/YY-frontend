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
  "/workspace",
];

// 需要特定权限的路由配置 (使用英文權限名稱)
const PERMISSION_ROUTES = {
  "/outboundExternal": "outboundExternal",
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

/**
 * Protected Route Component
 */
// export default function ProtectedRoute({ children, requiredPermission = null }) {
//   const router = useRouter();
//   const { isAuthenticated, permissions, userRole } = useSelector(
//     (state) => state.user
//   );
//   const hasShownAlert = useRef(false); 
//   const lastPathname = useRef(router.pathname); 

//   useEffect(() => {
//     // Reset alert khi đổi route
//     if (lastPathname.current !== router.pathname) {
//       hasShownAlert.current = false;
//       lastPathname.current = router.pathname;
//     }

//     // Kiểm tra public route
//     const isPublicRoute = PUBLIC_ROUTES.some((route) =>
//       router.pathname.startsWith(route)
//     );

//     // Nếu không phải public và chưa login → quay lại login
//     if (!isPublicRoute && !isAuthenticated) {
//       router.replace("/auth/login");
//       return;
//     }

//     // Nếu đã login và cố vào /auth/login → redirect về workspace
//     if (isAuthenticated && router.pathname === "/auth/login") {
//       router.replace("/workspace");
//       return;
//     }

//     // Tự động tìm permission theo route
//     const autoDetectedPermission =
//       requiredPermission || PERMISSION_ROUTES[router.pathname];

//     // --- RULE 1: User cần permission ở các PERMISSION_ROUTES ---
//     if (
//       isAuthenticated &&
//       userRole !== "admin" &&
//       userRole !== "manager" && // manager cũng bypass PERMISSION
//       autoDetectedPermission
//     ) {
//       const hasPermission = permissions[autoDetectedPermission];
//       if (!hasPermission && !hasShownAlert.current) {
//         hasShownAlert.current = true;

//         const displayName =
//           PERMISSION_DISPLAY_NAMES[autoDetectedPermission] ||
//           autoDetectedPermission;

//         Alert({
//           title: "權限不足",
//           text: `您沒有「${displayName}」權限，無法訪問此頁面`,
//           confirmButtonColor: "#b32627",
//           onConfirm: () => router.replace("/workspace"),
//         });

//         router.replace("/workspace");
//         return;
//       }
//     }

//     // --- RULE 2: Các route KHÔNG khai báo → chỉ Admin & Manager ---
//     if (
//       isAuthenticated &&
//       !isPublicRoute &&
//       !autoDetectedPermission && // không có permission mapping
//       userRole === "user"        // user thì bị chặn
//     ) {
//       if (!hasShownAlert.current) {
//         hasShownAlert.current = true;

//         Alert({
//           title: "權限不足",
//           text: "此頁面僅限管理員或管理人員訪問",
//           confirmButtonColor: "#b32627",
//           onConfirm: () => router.replace("/workspace"),
//         });
//       }

//       router.replace("/workspace");
//       return;
//     }

//   }, [isAuthenticated, router, requiredPermission, permissions, userRole]);

//   // Public route → render ngay
//   const isPublicRoute = PUBLIC_ROUTES.some((route) =>
//     router.pathname.startsWith(route)
//   );
//   if (isPublicRoute) return <>{children}</>;

//   // Chưa login → show loading trong lúc useEffect redirect
//   if (!isAuthenticated) return <Loading />;

//   // Kiểm tra lại permission để component phần dưới an toàn
//   const autoDetectedPermission =
//     requiredPermission || PERMISSION_ROUTES[router.pathname];

//   if (
//     userRole === "user" &&
//     autoDetectedPermission &&
//     !permissions[autoDetectedPermission]
//   ) {
//     return <Loading />;
//   }

//   // --- RULE 2 MIRROR (UI-phase): route không khai báo → user bị cấm ---
//   if (
//     userRole === "user" &&
//     !isPublicRoute &&
//     !autoDetectedPermission
//   ) {
//     return <Loading />;
//   }

//   return <>{children}</>;
// }


export default function ProtectedRoute({ children, requiredPermission = null }) {
  const router = useRouter();
  const { isAuthenticated, permissions = {}, userRole } = useSelector(
    (s) => s.user
  );

  const alertShown = useRef(false);
  const pathname = router.pathname;

  // Public check: "/" phải so sánh chính xác; các route khác có thể dùng startsWith
  const isPublicRoute = PUBLIC_ROUTES.some((r) =>
    r === "/" ? pathname === "/" : pathname.startsWith(r)
  );

  useEffect(() => {
    // reset alert khi đổi đường dẫn
    alertShown.current = false;

    // 1) Nếu public route: cho vào; nhưng nếu already logged in và đang ở /auth/login thì redirect workspace
    if (isPublicRoute) {
      if (isAuthenticated && pathname === "/auth/login") {
        router.replace("/workspace");
      }
      return;
    }

    // 2) Chưa đăng nhập => bắt về login
    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    // 3) Admin / Manager => bypass hết
    if (userRole === "admin" || userRole === "manager") {
      return;
    }

    // 4) User => kiểm tra PERMISSION_ROUTES
    if (userRole === "user") {
      // autoPermission: nếu truyền requiredPermission thì ưu tiên, nếu không thì tìm trong map
      // Lưu ý: PERMISSION_ROUTES có thể dùng exact key hoặc prefix; ở đây ta hỗ trợ prefix (startsWith)
      const autoPermissionKey = requiredPermission
        ? requiredPermission
        : (() => {
            // tìm key trong PERMISSION_ROUTES mà pathname bắt đầu với key
            for (const k in PERMISSION_ROUTES) {
              if (k === "/") {
                if (pathname === "/") return PERMISSION_ROUTES[k];
              } else if (pathname === k || pathname.startsWith(k + "/") || pathname.startsWith(k)) {
                // hỗ trợ chính xác và các đường con
                return PERMISSION_ROUTES[k];
              }
            }
            return null;
          })();

      // Nếu route không được khai báo => chặn user
      if (!autoPermissionKey) {
        if (!alertShown.current) {
          alertShown.current = true;
          Alert({
            title: "限制訪問",
            text: "此頁面僅限管理員或管理人員訪問",
            confirmButtonColor: "#b32627",
            onConfirm: () => router.replace("/workspace"),
          });
        }
        router.replace("/workspace");
        return;
      }

      // Nếu route có mapping nhưng user không có quyền => chặn
      const hasPerm = !!permissions[autoPermissionKey];
      if (!hasPerm) {
        if (!alertShown.current) {
          alertShown.current = true;
          const display = PERMISSION_DISPLAY_NAMES[autoPermissionKey] || autoPermissionKey;
          Alert({
            title: "權限不足",
            text: `您沒有「${display}」權限，無法訪問此頁面`,
            confirmButtonColor: "#b32627",
            onConfirm: () => router.replace("/workspace"),
          });
        }
        router.replace("/workspace");
        return;
      }

      // nếu có permission => cho vào (nothing to do here)
      return;
    }

    // Fallback: nếu userRole không phải admin/manager/user, mặc định chặn
    router.replace("/workspace");
  }, [pathname, isPublicRoute, isAuthenticated, userRole, permissions, requiredPermission, router]);

  // RENDER LOGIC — hoàn toàn minh bạch, không render Loading
  // 1) Public route → render
  if (isPublicRoute) return <>{children}</>;

  // 2) Nếu chưa login => null (redirect đã thực hiện)
  if (!isAuthenticated) return null;

  // 3) Admin/Manager => render
  if (userRole === "admin" || userRole === "manager") return <>{children}</>;

  // 4) User: chỉ render khi route được mapped và user có permission
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

  // 5) Các trường hợp khác: không render (useEffect sẽ redirect + alert)
  return null;
}