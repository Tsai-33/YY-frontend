import mapDataRaw from "./map.json";

// Hàm xử lý để chỉ lấy pointCode, x, y
const processMapData = (data) => {
  return data.pointList.map(({ pointCode, x, y }) => ({
    pointCode,
    x,
    y
  }));
};

export const mapData = { pointList: processMapData(mapDataRaw) };   