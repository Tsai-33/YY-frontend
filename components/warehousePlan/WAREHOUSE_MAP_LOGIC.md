# Warehouse Map - 计算方块位置的逻辑

## 📋 概述

本文档详细解释了用于计算仓库地图上方块（货架）位置和大小的数学运算。

## 🎯 目的

将数据库中的实际坐标（可能非常大，例如：4050, 5220）自动按比例转换为屏幕坐标（适配到有限大小的 Stage，例如：1200×800px）。

---

## 🔢 计算步骤

### **步骤 1: 从实际数据计算边界（Bounds）**

#### 1.1. 过滤和解析有效坐标

```javascript
const validXs = shelvesData
  .map((s) => parseFloat(s.dockX))  // 将字符串转换为数字
  .filter((x) => !isNaN(x));         // 过滤掉无效值

const validYs = shelvesData
  .map((s) => parseFloat(s.dockY))
  .filter((y) => !isNaN(y));
```

**示例:**
```
Input: [
  {dockX: "4050", dockY: "5220"},
  {dockX: "100", dockY: "200"},
  {dockX: "invalid", dockY: "300"}
]

→ validXs = [4050, 100]  // 跳过 "invalid"
→ validYs = [5220, 200, 300]
```

#### 1.2. 查找最小/最大坐标

```javascript
const minX = Math.min(...validXs);  // X坐标最小值
const maxX = Math.max(...validXs);  // X坐标最大值
const minY = Math.min(...validYs);  // Y坐标最小值
const maxY = Math.max(...validYs);  // Y坐标最大值
```

**示例:**
```
minX = 100, maxX = 4050
minY = 200, maxY = 5220
```

#### 1.3. 计算实际宽度和高度

```javascript
const width = maxX - minX;   // 所有货架的实际宽度
const height = maxY - minY;  // 所有货架的实际高度
```

**示例:**
```
width = 4050 - 100 = 3950
height = 5220 - 200 = 5020
```

**解释:** 这是包含所有货架的"边界框"的实际大小。

---

### **步骤 2: 计算缩放比例和偏移量以适配 Stage**

#### 2.1. 计算可用 Stage 大小

```javascript
const margin = 50;  // 边距（内边距）
const availableWidth = stageSize.width - 2 * margin;   // 可用宽度
const availableHeight = stageSize.height - 2 * margin; // 可用高度
```

**示例 (Stage = 1200×800):**
```
availableWidth = 1200 - 2×50 = 1100
availableHeight = 800 - 2×50 = 700
```

**解释:** 减去边距以避免紧贴 Stage 边缘绘制。

#### 2.2. 计算缩放比例以适配两个方向

```javascript
let scale = 1;
if (width > 0 && height > 0) {
  scale = Math.min(availableWidth / width, availableHeight / height, 1);
} else if (width > 0) {
  scale = Math.min(availableWidth / width, 1);
} else if (height > 0) {
  scale = Math.min(availableHeight / height, 1);
}

// 确保缩放比例有效
scale = isNaN(scale) || scale <= 0 ? 1 : scale;
```

**公式:**
```
scaleX = availableWidth / width
scaleY = availableHeight / height
scale = min(scaleX, scaleY, 1)  // 选择较小的缩放比例以适配两个方向
```

**示例:**
```
scaleX = 1100 / 3950 = 0.278
scaleY = 700 / 5020 = 0.139
scale = min(0.278, 0.139, 1) = 0.139
```

**解释:** 
- 选择较小的缩放比例以确保同时适配横向和纵向
- 限制 `scale ≤ 1` 以避免放大（仅缩小）

#### 2.3. 计算偏移量以居中

```javascript
const offsetX = margin - minX * scale;
const offsetY = margin - minY * scale;
```

**公式:**
```
offsetX = margin - (minX × scale)
offsetY = margin - (minY × scale)
```

**示例:**
```
offsetX = 50 - (100 × 0.139) = 50 - 13.9 = 36.1
offsetY = 50 - (200 × 0.139) = 50 - 27.8 = 22.2
```

**解释:** 
- 平移使缩放后的最小点（minX, minY）位于边距位置
- 确保所有货架都在 Stage 内（不被裁剪）

---

### **步骤 3: 应用到每个货架**

#### 3.1. 解析实际坐标

```javascript
const parsedDockX = parseFloat(shelf.dockX);  // "4050" → 4050
const parsedDockY = parseFloat(shelf.dockY);  // "5220" → 5220
```

#### 3.2. 应用缩放比例和偏移量

```javascript
const dockX = parsedDockX * bounds.scale + bounds.offsetX;
const dockY = parsedDockY * bounds.scale + bounds.offsetY;
```

**公式:**
```
screenX = (realX × scale) + offsetX
screenY = (realY × scale) + offsetY
```

**示例 (货架 dockX=4050, dockY=5220):**
```
dockX = 4050 × 0.139 + 36.1 = 562.95 + 36.1 = 599.05
dockY = 5220 × 0.139 + 22.2 = 725.58 + 22.2 = 747.78
```

**解释:** 
- 乘以缩放比例以缩小实际坐标
- 加上偏移量以移动到 Stage 中的正确位置

#### 3.3. 计算方块大小

```javascript
const size = Math.max(Math.round(60 * bounds.scale), 4);
```

**公式:**
```
size = max(round(60 × scale), 4)
```

**示例:**
```
size = max(round(60 × 0.139), 4) = max(round(8.34), 4) = max(8, 4) = 8
```

**解释:**
- `60` 是当 scale = 1 时的基础大小（像素）
- 乘以 `scale` 以与地图成比例
- `Math.round()` 四舍五入为整数（避免模糊）
- `Math.max(..., 4)` 确保最小 4px（可见）

---

## 📐 综合公式

### **屏幕坐标:**
```
screenX = (realX × scale) + offsetX
screenY = (realY × scale) + offsetY
```

### **缩放比例:**
```
scale = min(
  (stageWidth - 2×margin) / (maxX - minX),
  (stageHeight - 2×margin) / (maxY - minY),
  1
)
```

### **偏移量:**
```
offsetX = margin - (minX × scale)
offsetY = margin - (minY × scale)
```

### **方块大小:**
```
size = max(round(60 × scale), 4)
```

---

## 📊 完整示例

### **输入:**
- **Stage:** 1200×800px
- **货架:**
  - 货架 1: `dockX = 100`, `dockY = 200`
  - 货架 2: `dockX = 4050`, `dockY = 5220`

### **计算:**

#### **1. 边界:**
```
minX = 100, maxX = 4050, width = 3950
minY = 200, maxY = 5220, height = 5020
```

#### **2. 缩放比例:**
```
availableWidth = 1200 - 2×50 = 1100
availableHeight = 800 - 2×50 = 700
scaleX = 1100 / 3950 = 0.278
scaleY = 700 / 5020 = 0.139
scale = min(0.278, 0.139, 1) = 0.139
```

#### **3. 偏移量:**
```
offsetX = 50 - (100 × 0.139) = 36.1
offsetY = 50 - (200 × 0.139) = 22.2
```

#### **4. 货架 1 (100, 200):**
```
screenX = 100 × 0.139 + 36.1 = 50
screenY = 200 × 0.139 + 22.2 = 50
```

#### **5. 货架 2 (4050, 5220):**
```
screenX = 4050 × 0.139 + 36.1 = 599
screenY = 5220 × 0.139 + 22.2 = 748
```

#### **6. 大小:**
```
size = max(round(60 × 0.139), 4) = 8px
```

### **结果:**
- 所有货架都适配到 Stage (1200×800)
- 比例正确，不变形
- 货架位于 Stage 内（不被裁剪）

---

## 🎨 渲染方块

```javascript
<Rect
  x={dockX}           // 缩放和偏移后的 X 坐标
  y={dockY}           // 缩放和偏移后的 Y 坐标
  width={size}         // 大小（始终等于 height 以创建正方形）
  height={size}        // 大小（始终等于 width 以创建正方形）
  fill={color}         // 根据 warehouseId 的颜色
  stroke="#666"        // 边框颜色
  strokeWidth={1}      // 边框宽度
  cornerRadius={0}     // 不圆角（完全正方形）
/>
```

---

## 🔍 重要注意事项

1. **缩放比例始终 ≤ 1:** 仅缩小，不放大
2. **偏移量确保:** 所有货架都在 Stage 内（不被裁剪）
3. **最小大小:** 4px 以确保可见
4. **Math.round():** 四舍五入以避免渲染时模糊
5. **cornerRadius = 0:** 确保完全正方形

---

## 📝 相关文件

- `YY-frontend/components/warehousePlan/warehouseMap.js` - 主要组件
- `YY-backend/services/warehousePlanService.js` - 从数据库获取数据的服务

---

## 🔄 响应式逻辑

当容器大小改变时，Stage 大小会自动更新：

```javascript
// 使用 ResizeObserver 监听容器
const resizeObserver = new ResizeObserver(() => {
  const rect = container.getBoundingClientRect();
  setStageSize({ width: rect.width, height: rect.height });
});
```

当 Stage 大小改变时：
1. `calculateBounds()` 自动重新计算缩放比例和偏移量
2. 所有货架自动以新比例重新绘制
3. 货架始终适配到新 Stage

---

## ✅ 结论

此逻辑确保：
- ✅ 自动将所有货架适配到 Stage（无论大小）
- ✅ 保持比例（不变形）
- ✅ 调整窗口/容器大小时响应式
- ✅ 性能良好（计算一次，多次渲染）
