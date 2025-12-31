# Warehouse Map - Logic Tính Toán Vị Trí Ô Vuông

## 📋 Tổng Quan

File này giải thích chi tiết các phép toán được sử dụng để tính vị trí và kích thước của các ô vuông (shelves) trên bản đồ kho hàng.

## 🎯 Mục Đích

Chuyển đổi tọa độ thực tế từ database (có thể rất lớn, ví dụ: 4050, 5220) thành tọa độ màn hình (fit vào Stage có kích thước giới hạn, ví dụ: 1200×800px) một cách tự động và tỷ lệ.

---

## 🔢 Các Bước Tính Toán

### **Bước 1: Tính Bounds (Giới Hạn) Từ Dữ Liệu Thực Tế**

#### 1.1. Lọc và Parse Tọa Độ Hợp Lệ

```javascript
const validXs = shelvesData
  .map((s) => parseFloat(s.dockX))  // Chuyển string → number
  .filter((x) => !isNaN(x));         // Bỏ qua giá trị không hợp lệ

const validYs = shelvesData
  .map((s) => parseFloat(s.dockY))
  .filter((y) => !isNaN(y));
```

**Ví dụ:**
```
Input: [
  {dockX: "4050", dockY: "5220"},
  {dockX: "100", dockY: "200"},
  {dockX: "invalid", dockY: "300"}
]

→ validXs = [4050, 100]  // Bỏ qua "invalid"
→ validYs = [5220, 200, 300]
```

#### 1.2. Tìm Min/Max Tọa Độ

```javascript
const minX = Math.min(...validXs);  // Tọa độ X nhỏ nhất
const maxX = Math.max(...validXs);  // Tọa độ X lớn nhất
const minY = Math.min(...validYs);  // Tọa độ Y nhỏ nhất
const maxY = Math.max(...validYs);  // Tọa độ Y lớn nhất
```

**Ví dụ:**
```
minX = 100, maxX = 4050
minY = 200, maxY = 5220
```

#### 1.3. Tính Width và Height Thực Tế

```javascript
const width = maxX - minX;   // Chiều rộng thực tế của tất cả shelves
const height = maxY - minY;  // Chiều cao thực tế của tất cả shelves
```

**Ví dụ:**
```
width = 4050 - 100 = 3950
height = 5220 - 200 = 5020
```

**Giải thích:** Đây là kích thước thực tế của "bounding box" chứa tất cả shelves.

---

### **Bước 2: Tính Scale và Offset Để Fit Vào Stage**

#### 2.1. Tính Kích Thước Stage Có Thể Sử Dụng

```javascript
const margin = 50;  // Khoảng cách lề (padding)
const availableWidth = stageSize.width - 2 * margin;   // Chiều rộng có thể dùng
const availableHeight = stageSize.height - 2 * margin; // Chiều cao có thể dùng
```

**Ví dụ (Stage = 1200×800):**
```
availableWidth = 1200 - 2×50 = 1100
availableHeight = 800 - 2×50 = 700
```

**Giải thích:** Trừ margin để không vẽ sát mép Stage.

#### 2.2. Tính Scale Để Fit Cả 2 Chiều

```javascript
let scale = 1;
if (width > 0 && height > 0) {
  scale = Math.min(availableWidth / width, availableHeight / height, 1);
} else if (width > 0) {
  scale = Math.min(availableWidth / width, 1);
} else if (height > 0) {
  scale = Math.min(availableHeight / height, 1);
}

// Đảm bảo scale hợp lệ
scale = isNaN(scale) || scale <= 0 ? 1 : scale;
```

**Công thức:**
```
scaleX = availableWidth / width
scaleY = availableHeight / height
scale = min(scaleX, scaleY, 1)  // Chọn scale nhỏ hơn để fit cả 2 chiều
```

**Ví dụ:**
```
scaleX = 1100 / 3950 = 0.278
scaleY = 700 / 5020 = 0.139
scale = min(0.278, 0.139, 1) = 0.139
```

**Giải thích:** 
- Chọn scale nhỏ hơn để đảm bảo fit cả chiều ngang và dọc
- Giới hạn `scale ≤ 1` để không phóng to (chỉ thu nhỏ)

#### 2.3. Tính Offset Để Center

```javascript
const offsetX = margin - minX * scale;
const offsetY = margin - minY * scale;
```

**Công thức:**
```
offsetX = margin - (minX × scale)
offsetY = margin - (minY × scale)
```

**Ví dụ:**
```
offsetX = 50 - (100 × 0.139) = 50 - 13.9 = 36.1
offsetY = 50 - (200 × 0.139) = 50 - 27.8 = 22.2
```

**Giải thích:** 
- Dịch chuyển để điểm nhỏ nhất (minX, minY) sau khi scale nằm ở vị trí margin
- Đảm bảo tất cả shelves nằm trong Stage (không bị cắt)

---

### **Bước 3: Áp Dụng Vào Từng Shelf**

#### 3.1. Parse Tọa Độ Thực Tế

```javascript
const parsedDockX = parseFloat(shelf.dockX);  // "4050" → 4050
const parsedDockY = parseFloat(shelf.dockY);  // "5220" → 5220
```

#### 3.2. Áp Dụng Scale và Offset

```javascript
const dockX = parsedDockX * bounds.scale + bounds.offsetX;
const dockY = parsedDockY * bounds.scale + bounds.offsetY;
```

**Công thức:**
```
screenX = (realX × scale) + offsetX
screenY = (realY × scale) + offsetY
```

**Ví dụ (Shelf có dockX=4050, dockY=5220):**
```
dockX = 4050 × 0.139 + 36.1 = 562.95 + 36.1 = 599.05
dockY = 5220 × 0.139 + 22.2 = 725.58 + 22.2 = 747.78
```

**Giải thích:** 
- Nhân với scale để thu nhỏ tọa độ thực tế
- Cộng với offset để dịch chuyển vào đúng vị trí trong Stage

#### 3.3. Tính Kích Thước Ô Vuông

```javascript
const size = Math.max(Math.round(60 * bounds.scale), 4);
```

**Công thức:**
```
size = max(round(60 × scale), 4)
```

**Ví dụ:**
```
size = max(round(60 × 0.139), 4) = max(round(8.34), 4) = max(8, 4) = 8
```

**Giải thích:**
- `60` là kích thước cơ sở (pixel) khi scale = 1
- Nhân với `scale` để tỷ lệ với bản đồ
- `Math.round()` để làm tròn thành số nguyên (tránh blur)
- `Math.max(..., 4)` đảm bảo tối thiểu 4px (có thể nhìn thấy)

---

## 📐 Công Thức Tổng Hợp

### **Tọa Độ Màn Hình:**
```
screenX = (realX × scale) + offsetX
screenY = (realY × scale) + offsetY
```

### **Scale:**
```
scale = min(
  (stageWidth - 2×margin) / (maxX - minX),
  (stageHeight - 2×margin) / (maxY - minY),
  1
)
```

### **Offset:**
```
offsetX = margin - (minX × scale)
offsetY = margin - (minY × scale)
```

### **Kích Thước Ô:**
```
size = max(round(60 × scale), 4)
```

---

## 📊 Ví Dụ Hoàn Chỉnh

### **Input:**
- **Stage:** 1200×800px
- **Shelves:**
  - Shelf 1: `dockX = 100`, `dockY = 200`
  - Shelf 2: `dockX = 4050`, `dockY = 5220`

### **Tính Toán:**

#### **1. Bounds:**
```
minX = 100, maxX = 4050, width = 3950
minY = 200, maxY = 5220, height = 5020
```

#### **2. Scale:**
```
availableWidth = 1200 - 2×50 = 1100
availableHeight = 800 - 2×50 = 700
scaleX = 1100 / 3950 = 0.278
scaleY = 700 / 5020 = 0.139
scale = min(0.278, 0.139, 1) = 0.139
```

#### **3. Offset:**
```
offsetX = 50 - (100 × 0.139) = 36.1
offsetY = 50 - (200 × 0.139) = 22.2
```

#### **4. Shelf 1 (100, 200):**
```
screenX = 100 × 0.139 + 36.1 = 50
screenY = 200 × 0.139 + 22.2 = 50
```

#### **5. Shelf 2 (4050, 5220):**
```
screenX = 4050 × 0.139 + 36.1 = 599
screenY = 5220 × 0.139 + 22.2 = 748
```

#### **6. Size:**
```
size = max(round(60 × 0.139), 4) = 8px
```

### **Kết Quả:**
- Tất cả shelves được fit vào Stage (1200×800)
- Tỷ lệ đúng, không bị méo
- Shelves nằm trong Stage (không bị cắt)

---

## 🎨 Render Ô Vuông

```javascript
<Rect
  x={dockX}           // Tọa độ X sau khi scale + offset
  y={dockY}           // Tọa độ Y sau khi scale + offset
  width={size}         // Kích thước (luôn = height để tạo hình vuông)
  height={size}        // Kích thước (luôn = width để tạo hình vuông)
  fill={color}         // Màu sắc theo warehouseId
  stroke="#666"        // Màu viền
  strokeWidth={1}      // Độ dày viền
  cornerRadius={0}     // Không bo góc (hình vuông hoàn toàn)
/>
```

---

## 🔍 Lưu Ý Quan Trọng

1. **Scale luôn ≤ 1:** Chỉ thu nhỏ, không phóng to
2. **Offset đảm bảo:** Tất cả shelves nằm trong Stage (không bị cắt)
3. **Size tối thiểu:** 4px để đảm bảo có thể nhìn thấy
4. **Math.round():** Làm tròn để tránh blur khi render
5. **cornerRadius = 0:** Đảm bảo hình vuông hoàn toàn

---

## 📝 File Liên Quan

- `YY-frontend/components/warehousePlan/warehouseMap.js` - Component chính
- `YY-backend/services/warehousePlanService.js` - Service lấy dữ liệu từ database

---

## 🔄 Responsive Logic

Stage size được tự động cập nhật khi container thay đổi kích thước:

```javascript
// Sử dụng ResizeObserver để theo dõi container
const resizeObserver = new ResizeObserver(() => {
  const rect = container.getBoundingClientRect();
  setStageSize({ width: rect.width, height: rect.height });
});
```

Khi Stage size thay đổi:
1. `calculateBounds()` tự động tính lại scale và offset
2. Tất cả shelves tự động được vẽ lại với tỷ lệ mới
3. Shelves luôn fit vào Stage mới

---

## ✅ Kết Luận

Logic này đảm bảo:
- ✅ Tự động fit tất cả shelves vào Stage (bất kể kích thước)
- ✅ Giữ nguyên tỷ lệ (không bị méo)
- ✅ Responsive khi resize window/container
- ✅ Hiệu suất tốt (tính toán một lần, render nhiều lần)

