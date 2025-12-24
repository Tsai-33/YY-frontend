import React from "react";
import { Stage, Layer, Rect } from "react-konva";

const statusColor = {
  empty: "#e0e0e0",
  full: "#3498db",
  reserved: "#f1c40f",
  error: "#e74c3c",
  selected: "#9b59b6",
};

function generateGrid(rows, cols, startX, startY, size = 18, gap = 3) {
  const arr = [];
  let id = 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      arr.push({
        id: "BIN-" + id,
        x: startX + c * (size + gap),
        y: startY + r * (size + gap),
        status: "empty",
      });
      id++;
    }
  }

  return arr;
}

export default function WarehouseMap() {
  const bins = generateGrid(33, 25, 10, 10); // 825 ô

  return (
    <Stage width={1200} height={700}>
      <Layer>
        {bins.map((bin) => (
          <Rect
            key={bin.id}
            x={bin.x}
            y={bin.y}
            width={18}
            height={18}
            fill={statusColor[bin.status]}
            stroke="black"
            strokeWidth={0.5}
            cornerRadius={2}
          />
        ))}
      </Layer>
    </Stage>
  );
}

// import React from "react";
// import { Stage, Layer, Rect, Text, Group } from "react-konva";
// import { mapData } from "./map";


// export default function WarehouseMap() {
//   // 1. Cấu hình hiển thị
//   const SCALE = 0.06; // Tỉ lệ thu nhỏ (1000mm thực tế = 60px trên màn hình)
//   const PADDING = 50;  // Khoảng cách lề
//   const BIN_SIZE = 20; // Kích thước ô vuông hiển thị

//   // 2. Tìm giới hạn tọa độ để tính toán khung hình
//   const xs = mapData.pointList.map(p => p.x);
//   const ys = mapData.pointList.map(p => p.y);
//   const minX = Math.min(...xs);
//   const maxY = Math.max(...ys);

//   // 3. Hàm chuyển đổi tọa độ thực -> tọa độ màn hình
//   const getScreenCoords = (realX, realY) => {
//     return {
//       // (x - minX) để đưa điểm trái nhất về 0
//       x: (realX - minX) * SCALE + PADDING,
//       // (maxY - y) để đảo ngược trục Y (điểm Y lớn nhất sẽ nằm ở trên cùng màn hình)
//       y: (maxY - realY) * SCALE + PADDING
//     };
//   };

//   return (
//     <div style={{ background: "#f0f2f5", padding: "20px" }}>
//       <h3>Quicktron Map Monitor - Real-time Coordinates</h3>
//       <Stage width={800} height={750} style={{ background: "white", border: "1px solid #ccc" }}>
//         <Layer>
//           {mapData.pointList.map((point) => {
//             const { x, y } = getScreenCoords(point.x       , point.y);
            
//             return (
//               <Group key={point.pointCode}>
//                 {/* Vẽ điểm QR Code */}
//                 <Rect
//                   x={x - BIN_SIZE / 2}
//                   y={y - BIN_SIZE / 2}
//                   width={BIN_SIZE}
//                   height={BIN_SIZE}
//                   fill="#ffffff"
//                   stroke="#3498db"
//                   strokeWidth={2}
//                   cornerRadius={3}
//                   shadowBlur={2}
//                 />
                
//                 {/* Hiển thị mã Point Code nhỏ bên dưới (Tùy chọn) */}
//                 <Text
//                   text={point.pointCode}
//                   x={x - 10}
//                   y={y + 12}
//                   fontSize={8}
//                   fill="#7f8c8d"
//                 />
//               </Group>
//             );
//           })}
//         </Layer>
//       </Stage>
//     </div>
//   );
// }