# 使用指南：ProtectedRoute & LogUserAction

## 目錄
1. [ProtectedRoute Component](#protectedroute-component)
2. [LogUserAction Middleware](#loguseraction-middleware)

---

## ProtectedRoute Component

### 📍 檔案位置
```
YY-frontend/components/common/ProtectedRoute.js
```

### 🎯 目的
`ProtectedRoute` 是一個確保只有已登入且具有適當權限的使用者才能存取受保護的頁面。

### 🔧 運作方式

#### 1. **檢查公開路由**
- 元件會檢查當前路由是否在 `PUBLIC_ROUTES` 清單中
- 公開路由包括：
  - `/` (首頁)
  - `/auth/login`
  - `/auth/forgot-password`
  - `/auth/reset`
  - `/auth/change-password`
  - `/auth/reset-password`
  - `/auth/logout`
- 如果是公開路由 → 允許存取
- 如果已登入且正在 `/auth/login` → 自動重定向到 `/workspace`

#### 2. **檢查身份驗證**
- 如果不是公開路由且未登入 → 重定向到 `/auth/login`

#### 3. **檢查基於角色的存取控制**
- **Admin/Manager**: 擁有存取所有路由的權限（繞過權限檢查）
- **User**: 必須根據 `PERMISSION_ROUTES` 映射檢查特定權限

#### 4. **檢查權限（針對 User）**
- 元件會自動將當前路由映射到 `PERMISSION_ROUTES` 中的權限鍵
- 如果路由不在映射中 → 顯示警告 "限制訪問" 並重定向到 `/workspace`
- 如果路由有映射但使用者沒有權限 → 顯示警告 "權限不足" 並顯示權限名稱，然後重定向到 `/workspace`
- 如果使用者有權限 → 允許存取

### 📋 路由與權限配置

#### 公開路由
```javascript
const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/forgot-password",
  "/auth/reset",
  "/auth/change-password",
  "/auth/reset-password",
  "/auth/logout",
];
```

#### 權限路由映射
```javascript
const PERMISSION_ROUTES = {
  "/outboundExternal": "outboundExternal",
  "/outboundInternal": "outboundInternal",
  "/shelfTransfer": "shelfTransfer",
  "/inbound": "inbound",
  "/stockQuery": "stockQuery",
  "/transfer": "transfer",
  "/inventory": "inventory",
};
```

#### 權限顯示名稱（用於警告訊息）
```javascript
const PERMISSION_DISPLAY_NAMES = {
  "inbound": "入倉",
  "outboundExternal": "銷貨",
  "outboundInternal": "領用",
  "shelfTransfer": "理貨",
  "stockQuery": "庫存查詢",
  "transfer": "調撥",
  "inventory": "盤點",
};
```

### 💻 使用方法

#### 方法 1：在 Layout 中使用（建議）
在 Layout 元件中包裹所有頁面：

```javascript
// YY-frontend/components/layout/layout.js
import ProtectedRoute from "../common/ProtectedRoute";

export default function Layout({ children }) {
  return (
    <div>
      {/* Header, Navigation, etc. */}
      <main>
        <ProtectedRoute>{children}</ProtectedRoute>
      </main>
    </div>
  );
}
```

#### 方法 2：在個別頁面中使用
包裹特定頁面的內容：

```javascript
// pages/inbound/index.js
import ProtectedRoute from "@/components/common/ProtectedRoute";

export default function InboundPage() {
  return (
    <ProtectedRoute>
      <div>入倉頁面內容</div>
    </ProtectedRoute>
  );
}
```

#### 方法 3：指定特定權限
如果路由不在 `PERMISSION_ROUTES` 映射中，您可以直接指定：

```javascript
<ProtectedRoute requiredPermission="inbound">
  <div>頁面內容</div>
</ProtectedRoute>
```

### 📝 Props

| Prop | Type | Required | Default | 說明 |
|------|------|----------|---------|------|
| `children` | ReactNode | ✅ | - | 需要被保護的內容 |
| `requiredPermission` | string | ❌ | `null` | 特定權限鍵（如果沒有提供，會自動從路由偵測） |

### 🔄 處理流程

```
使用者存取路由
    ↓
是否為公開路由？
    ├─ YES → 允許存取
    └─ NO → 是否已登入？
            ├─ NO → 重定向到 /auth/login
            └─ YES → 角色是什麼？
                    ├─ Admin/Manager → 允許存取
                    └─ User → 路由是否在 PERMISSION_ROUTES 中？
                              ├─ NO → 警告 "限制訪問" + 重定向
                              └─ YES → 使用者是否有權限？
                                        ├─ NO → 警告 "權限不足" + 重定向
                                        └─ YES → 允許存取
```

### ⚠️ 重要注意事項

1. **需要 Redux Store**: 元件需要 Redux store，其中包含 `user` 狀態：
   - `isAuthenticated`: boolean
   - `permissions`: 包含權限鍵的物件
   - `userRole`: "admin" | "manager" | "user"

2. **路由匹配**: 元件支援：
   - 精確匹配：`/inbound` === `/inbound`（允許）
   - 前綴匹配：`/inbound/create` startsWith `/inbound`（允許，子路由會繼承父路由的權限）
   - 特殊情況：`/` 必須精確匹配（不支援前綴匹配）


33. **自動重定向**: 當沒有權限時，元件會自動重定向到 `/workspace`

### 📚 實際範例

#### 範例 1：在 Layout 中使用
```javascript
// components/layout/layout.js
import ProtectedRoute from "../common/ProtectedRoute";

export default function Layout({ children }) {
  return (
    <div className="flex flex-col h-screen">
      <header>...</header>
      <main>
        <ProtectedRoute>{children}</ProtectedRoute>
      </main>
    </div>
  );
}
```

#### 範例 2：新增路由到權限映射
如果您想新增一個需要權限的新路由：

1. 新增到 `PERMISSION_ROUTES`：
```javascript
const PERMISSION_ROUTES = {
  // ... existing routes
  "/newFeature": "newFeature",  // 新增這一行
};
```

2. 新增顯示名稱（如果想在警告中顯示中文）：
```javascript
const PERMISSION_DISPLAY_NAMES = {
  // ... existing names
  "newFeature": "新功能",  // 新增這一行
};
```

3. 確保後端在使用者權限物件中返回 `newFeature` 權限

---
## 寫入LOG ====================================================================================================================================
## LogUserAction Middleware

### 📍 檔案位置
```
YY-backend/middlewares/logUserAction.js
```

### 🎯 目的
`LogUserAction` 是一個用於自動將使用者操作記錄到資料庫中。此中介軟體會記錄有關請求、回應、使用者和其他元資料的詳細資訊。

### 🔧 運作方式

#### 1. **接收操作名稱**
- 中介軟體接收一個 `actionName`（操作名稱）作為參數
- 將操作名稱儲存到 `req._actionName` 以供後續使用

#### 2. **攔截回應**
- 中介軟體覆寫 `res.json()` 以捕獲回應資料
- 回應資料儲存到 `res.locals.responseData`

#### 3. **在回應完成時記錄日誌**
- 使用事件監聽器 `res.on("finish")` 等待回應完成
- 收集以下資訊：
  - **UserId**: 來自 `req.person.userId`
  - **UserName**: 來自 `req.person.username` 或 `req.person.userName`
  - **Action**: 傳入的操作名稱
  - **Module**: 來自 `req.baseUrl`
  - **Route**: 來自 `req.originalUrl`
  - **Method**: HTTP 方法 (GET, POST, PUT, DELETE, etc.)
  - **RequestData**: `req.body` 的 JSON 字串
  - **ResponseData**: 回應資料的 JSON 字串
  - **IpAddress**: 來自 `req.realIp`、`req.headers["x-forwarded-for"]` 或 `req.ip`
  - **UserAgent**: 來自 `req.headers["user-agent"]`
  - **Success**: 如果狀態碼 < 400 則為 `true`，如果 >= 400 則為 `false`

#### 4. **寫入資料庫**
- 將日誌插入到 SQL Server 中的 `dbo.UserLogs` 表
- 使用參數化查詢以避免 SQL 注入
- 如果有錯誤，只記錄到控制台，不會中斷請求

### 📋 資料庫架構

`dbo.UserLogs` 表需要以下欄位：

| 欄位 | 資料類型 | 說明 |
|------|----------|------|
| `UserId` | BigInt | 使用者 ID |
| `UserName` | NVarChar | 使用者名稱 |
| `Action` | NVarChar | 操作名稱 |
| `Module` | NVarChar | 模組/基礎 URL |
| `Route` | NVarChar | 完整路由路徑 |
| `Method` | NVarChar | HTTP 方法 |
| `RequestData` | NVarChar | 請求主體的 JSON 字串 |
| `ResponseData` | NVarChar | 回應資料的 JSON 字串 |
| `IpAddress` | NVarChar | 客戶端的 IP 位址 |
| `UserAgent` | NVarChar | User agent 字串 |
| `Success` | Bit | 成功狀態 (1) 或失敗 (0) |

### 💻 使用方法

#### 方法 1：與路由處理器一起使用
將中介軟體放在路由處理器之前：

```javascript
const express = require("express");
const router = express.Router();
const { LogUserAction } = require("../middlewares/logUserAction");
const { authenticationToken } = require("../middlewares/authentication");//搭配authenticationToken middleware 因爲要從中取得資訊

// 對所有路由應用身份驗證
router.use(authenticationToken);

// 使用 LogUserAction 並指定操作名稱
router.get(
  "/stats",
  LogUserAction("取得用戶統計信息"),
  asyncHandler(async (req, res) => {
    // 路由處理器邏輯
    res.json({ data: "..." });
  })
);
```

#### 方法 2：與多個路由一起使用
```javascript
// routes/users.js
const { LogUserAction } = require("../middlewares/logUserAction");

router.use(authenticationToken);

// GET - 取得統計資訊
router.get(
  "/stats",
  LogUserAction("取得用戶統計信息"),
  asyncHandler(userController.getUserStats)
);

// GET - 匯出 Excel
router.get(
  "/logs/export",
  LogUserAction("取得用戶操作日誌Excel"),
  asyncHandler(userController.exportUserLogs)
);

// PUT - 更新使用者
router.put(
  "/:id",
  LogUserAction("更新用戶資料"),
  asyncHandler(userController.updateUser)
);

// DELETE - 刪除使用者
router.delete(
  "/:id",
  LogUserAction("刪除用戶"),
  asyncHandler(userController.deleteUser)
);

// DELETE - 批次刪除使用者
router.delete(
  "/batch",
  LogUserAction("批量刪除用戶"),
  asyncHandler(userController.batchDeleteUsers)
);
```

#### 方法 3：與 POST 路由一起使用
```javascript
// routes/auth.js
router.post(
  "/register",
  LogUserAction("創建新用戶"),
  asyncHandler(async (req, res) => {
    // 註冊邏輯
    const newUser = await createUser(req.body);
    res.json({ success: true, user: newUser });
  })
);
```

### 📝 參數

| 參數 | Type | Required | 說明 |
|------|------|----------|------|
| `actionName` | string | ✅ | 要記錄到日誌的操作名稱（通常是中文或英文描述操作） |

### 🔄 處理流程

```
請求到達路由
    ↓
呼叫 LogUserAction 中介軟體
    ↓
將 actionName 儲存到 req._actionName
    ↓
覆寫 res.json() 以捕獲回應
    ↓
呼叫 next() → 轉移到路由處理器
    ↓
路由處理器處理並呼叫 res.json()
    ↓
回應發送到客戶端
    ↓
觸發 res.on("finish") 事件
    ↓
收集日誌資訊
    ↓
插入到資料庫（非同步，不阻塞回應）
```

### ⚠️ 重要注意事項

1. **需要身份驗證**: 中介軟體需要 `req.person` 物件（通常由身份驗證中介軟體設定）。確保將 `authenticationToken` 中介軟體放在 `LogUserAction` 之前。

2. **資料庫連線**: 中介軟體需要已配置並連接到 SQL Server 的 `sqlConnection` 模組。

3. **錯誤處理**: 如果記錄日誌失敗，中介軟體只會將錯誤記錄到控制台，不會中斷請求/回應流程。

4. **非同步操作**: 日誌記錄在事件監聽器中非同步執行，不會阻塞回應。

5. **操作名稱慣例**: 應使用清晰的操作名稱，準確描述正在執行的操作（例如："取得用戶統計信息"、"更新用戶資料"、"刪除用戶"）。

### 📚 實際範例

#### 範例 1：帶有日誌記錄的 GET 路由
```javascript
// routes/products.js
const { LogUserAction } = require("../middlewares/logUserAction");
const { authenticationToken } = require("../middlewares/authentication");

router.use(authenticationToken);

router.get(
  "/list",
  LogUserAction("取得產品列表"),
  asyncHandler(async (req, res) => {
    const products = await productService.getAll();
    res.json({ success: true, data: products });
  })
);
```

#### 範例 2：帶有日誌記錄的 POST 路由
```javascript
router.post(
  "/create",
  LogUserAction("創建新產品"),
  asyncHandler(async (req, res) => {
    const product = await productService.create(req.body);
    res.json({ success: true, data: product });
  })
);
```

#### 範例 3：帶有日誌記錄的 PUT 路由
```javascript
router.put(
  "/:id",
  LogUserAction("更新產品資料"),
  asyncHandler(async (req, res) => {
    const product = await productService.update(req.params.id, req.body);
    res.json({ success: true, data: product });
  })
);
```

#### 範例 4：帶有日誌記錄的 DELETE 路由
```javascript
router.delete(
  "/:id",
  LogUserAction("刪除產品"),
  asyncHandler(async (req, res) => {
    await productService.delete(req.params.id);
    res.json({ success: true, message: "產品已刪除" });
  })
);
```

### 🔍 從資料庫查詢日誌

日誌寫入資料庫後，您可以查詢查看：

```sql
-- 查看所有日誌
SELECT * FROM dbo.UserLogs ORDER BY CreatedAt DESC;

-- 查看特定使用者的日誌
SELECT * FROM dbo.UserLogs 
WHERE UserId = 123 
ORDER BY CreatedAt DESC;

-- 查看特定操作的日誌
SELECT * FROM dbo.UserLogs 
WHERE Action = '取得用戶統計信息'
ORDER BY CreatedAt DESC;

-- 查看失敗的日誌
SELECT * FROM dbo.UserLogs 
WHERE Success = 0
ORDER BY CreatedAt DESC;

-- 查看特定時間範圍內的日誌
SELECT * FROM dbo.UserLogs 
WHERE CreatedAt >= '2024-01-01' AND CreatedAt < '2024-02-01'
ORDER BY CreatedAt DESC;
```

---

## 總結

### ProtectedRoute
- ✅ 基於身份驗證和權限保護路由
- ✅ 支援基於角色的存取控制 (Admin/Manager/User)
- ✅ 當沒有權限時自動重定向並顯示警告
- ✅ 易於配置新增路由和權限

### LogUserAction
- ✅ 自動將所有使用者操作記錄到資料庫
- ✅ 完整捕獲資訊：請求、回應、使用者、IP、user agent
- ✅ 不會中斷請求/回應流程
- ✅ 易於與任何路由一起使用

### 最佳實踐

1. **ProtectedRoute**:
   - 始終在 Layout 中使用以保護所有路由
   - 新增路由時更新 `PERMISSION_ROUTES`
   - 確保 Redux store 包含完整的使用者資訊

2. **LogUserAction**:
   - 始終放在身份驗證中介軟體之後
   - 使用清晰的操作名稱，準確描述操作
   - 無需擔心錯誤處理 - 中介軟體會自動處理
