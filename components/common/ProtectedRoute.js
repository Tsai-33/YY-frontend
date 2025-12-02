import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import Loading from "./loading/loading";

/**
 * 受保护路由组件 (Protected Route Component)
 * 用于保护需要登录才能访问的页面
 * 
 * 使用方法:
 * import ProtectedRoute from "@/components/common/ProtectedRoute";
 * 
 * export default function MyPage() {
 *   return (
 *     <ProtectedRoute>
 *       <div>受保护的内容</div>
 *     </ProtectedRoute>
 *   );
 * }
 * 
 * 或者使用 HOC 方式:
 * export default withAuth(MyPage);
 */

// 公开路由列表 (不需要登录即可访问)
const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// 需要特定权限的路由配置
const PERMISSION_ROUTES = {
  "/inbound": "入庫",
  "/outbound": "出庫",
  "/shelfTransfer": "調撥",
  "/inventory": "盤點",
  "/stockQuery": "庫存查詢",
};

/**
 * Protected Route Component
 */
export default function ProtectedRoute({ children, requiredPermission = null }) {
  const router = useRouter();
  const { isAuthenticated, permissions, userRole } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    // 检查是否是公开路由
    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
      router.pathname.startsWith(route)
    );

    // 如果不是公开路由且未登录，立即重定向到登录页
    if (!isPublicRoute && !isAuthenticated) {
      console.warn("未登录，重定向到登录页");
      router.replace("/auth/login"); // 使用 replace 而不是 push
      return;
    }

    // 如果已登录但访问登录页，重定向到工作站
    if (isAuthenticated && router.pathname === "/auth/login") {
      router.replace("/workspace");
      return;
    }

    // 自动检测权限：如果未指定 requiredPermission，则从 PERMISSION_ROUTES 自动检测
    const autoDetectedPermission = requiredPermission || PERMISSION_ROUTES[router.pathname];
    
    // 检查权限（管理员跳过权限检查）
    if (isAuthenticated && userRole !== "admin" && autoDetectedPermission) {
      const hasPermission = permissions[autoDetectedPermission];
      if (!hasPermission) {
        console.warn(`缺少权限: ${autoDetectedPermission}`);
        router.replace("/workspace");
        return;
      }
    }
  }, [isAuthenticated, router, requiredPermission, permissions, userRole]);

  // 如果是公开路由，直接渲染
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    router.pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return <>{children}</>;
  }

  // 如果未登录，显示加载中 (useEffect sẽ redirect)
  if (!isAuthenticated) {
    return <Loading />;
  }

  // 自动检测权限：如果未指定 requiredPermission，则从 PERMISSION_ROUTES 自动检测
  const autoDetectedPermission = requiredPermission || PERMISSION_ROUTES[router.pathname];
  
  // 检查权限
  if (userRole !== "admin" && autoDetectedPermission) {
    const hasPermission = permissions[autoDetectedPermission];
    if (!hasPermission) {
      return <Loading />;
    }
  }

  // 已登录且有权限，渲染子组件
  return <>{children}</>;
}

/**
 * HOC: 高阶组件方式使用
 * 
 * 使用方法:
 * function MyPage() {
 *   return <div>受保护的内容</div>;
 * }
 * 
 * export default withAuth(MyPage);
 * 或带权限检查:
 * export default withAuth(MyPage, "入库");
 */
export function withAuth(Component, requiredPermission = null) {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute requiredPermission={requiredPermission}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Hook: 在组件内部使用权限检查
 * 
 * 使用方法:
 * const { hasPermission, isAdmin } = usePermission();
 * 
 * if (hasPermission("入库")) {
 *   // 显示入库相关功能
 * }
 */
export function usePermission() {
  const { permissions, userRole } = useSelector((state) => state.user);

  const hasPermission = (permissionName) => {
    // 管理员拥有所有权限
    if (userRole === "admin") return true;
    // 检查用户是否有该权限
    return permissions[permissionName] === true;
  };

  const isAdmin = userRole === "admin";
  const isManager = userRole === "manager";

  return {
    hasPermission,
    isAdmin,
    isManager,
    permissions,
  };
}

