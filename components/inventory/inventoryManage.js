import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function InventoryManage({ isOpen, onClose }) {
  if (!isOpen) return null;

  const dispatch = useDispatch();
  const { stations } = useSelector((s) => s.workstation);
  const inventory = useSelector((s) => s.inventory);

  const [page, setPage] = useState(inventory.page || "");
  const [batchNo, setBatchNo] = useState(inventory.batchNo || "");
  const [stationScreens, setStationScreens] = useState({});

  // 初始化各站的 screen 狀態
  useEffect(() => {
    const screens = {};
    stations.forEach((station) => {
      if (inventory[station]) {
        try {
          const stationData = JSON.parse(inventory[station]);
          screens[station] = stationData.screen || "idle";
        } catch (e) {
          screens[station] = "idle";
        }
      }
    });
    setStationScreens(screens);
  }, [stations, inventory]);

  // 更新 page
  const handlePageChange = () => {
    dispatch({ type: "inventory/setPage", payload: page });
    alert(`Page 已更新為: ${page}`);
  };

  // 更新 batchNo
  const handleBatchNoChange = () => {
    dispatch({ type: "inventory/setBatchNo", payload: batchNo });
    alert(`BatchNo 已更新為: ${batchNo}`);
  };

  // 更新單一站的 screen
  const handleStationScreenChange = (station, newScreen) => {
    try {
      const rawData = inventory[station];

      let currentData =
        typeof rawData === "string" ? JSON.parse(rawData) : rawData || {};

      currentData = { ...currentData, screen: newScreen };

      dispatch({
        type: "inventory/setInventory",
        payload: {
          station,
          data: currentData,
        },
      });

      setStationScreens((prev) => ({
        ...prev,
        [station]: newScreen,
      }));

      alert(`${station} 的 screen 已更新為: ${newScreen}`);
    } catch (e) {
      alert(`更新失敗: ${e.message}`);
    }
  };

  // 重置所有站到 idle
  const handleResetAllStations = () => {
    if (!confirm("確定要將所有站點重置為 idle 狀態嗎?")) return;

    stations.forEach((station) => {
      try {
        const rawData = inventory[station];

        let currentData =
          typeof rawData === "string" ? JSON.parse(rawData) : rawData || {};

        currentData = { ...currentData, screen: newScreen };

        dispatch({
          type: "inventory/setInventory",
          payload: {
            station,
            data: currentData,
          },
        });
      } catch (e) {
        console.warn(`重置 ${station} 失敗:`, e);
      }
    });

    const resetScreens = {};
    stations.forEach((s) => (resetScreens[s] = "idle"));
    setStationScreens(resetScreens);

    alert("所有站點已重置為 idle");
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <h2 style={styles.title}>🛠️ 控制面板</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.content}>
          {/* Page 控制 */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>📄 Page 控制</h3>
            <div style={styles.inputGroup}>
              <select
                value={page}
                onChange={(e) => setPage(e.target.value)}
                style={styles.select}>
                <option value="">-- 請選擇 --</option>
                <option value="inventory-table">inventory-table</option>
                <option value="inventory-shelf">inventory-shelf</option>
              </select>
              <button onClick={handlePageChange} style={styles.btn}>
                更新 Page
              </button>
            </div>
            <div style={styles.currentValue}>
              目前值: <code>{inventory.page || "null"}</code>
            </div>
          </section>

          {/* BatchNo 控制 */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>🔢 BatchNo 控制</h3>
            <div style={styles.inputGroup}>
              <input
                type="text"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                placeholder="輸入 batchNo 值"
                style={styles.input}
              />
              <button onClick={handleBatchNoChange} style={styles.btn}>
                更新 BatchNo
              </button>
            </div>
            <div style={styles.currentValue}>
              目前值: <code>{inventory.batchNo || "null"}</code>
            </div>
          </section>

          {/* 各站 Screen 控制 */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>🖥️ 各站 Screen 控制</h3>
            <button
              onClick={handleResetAllStations}
              style={{ ...styles.btn, ...styles.resetBtn }}>
              重置所有站點為 idle
            </button>

            <div style={styles.stationGrid}>
              {stations.map((station) => (
                <div key={station} style={styles.stationCard}>
                  <div style={styles.stationHeader}>{station}</div>
                  <select
                    value={stationScreens[station] || "idle"}
                    onChange={(e) =>
                      handleStationScreenChange(station, e.target.value)
                    }
                    style={styles.select}>
                    <option value="idle">idle</option>
                    <option value="loading">loading</option>
                  </select>
                  <button
                    onClick={() => handleStationScreenChange(station, "idle")}
                    style={styles.quickResetBtn}>
                    重置
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  panel: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "800px",
    maxHeight: "90vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #e0e0e0",
    backgroundColor: "#f8f9fa",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "600",
    color: "#333",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "28px",
    cursor: "pointer",
    color: "#666",
    padding: "0",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
  },
  content: {
    padding: "24px",
    overflowY: "auto",
    flex: 1,
  },
  section: {
    marginBottom: "32px",
    padding: "20px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
  },
  sectionTitle: {
    margin: "0 0 16px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#333",
  },
  inputGroup: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    outline: "none",
  },
  btn: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  resetBtn: {
    backgroundColor: "#dc3545",
    marginBottom: "16px",
    width: "100%",
  },
  currentValue: {
    fontSize: "13px",
    color: "#666",
    padding: "8px 12px",
    backgroundColor: "#fff",
    borderRadius: "4px",
    border: "1px solid #e0e0e0",
  },
  stationGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
    marginTop: "16px",
  },
  stationCard: {
    padding: "16px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
  },
  stationHeader: {
    fontWeight: "600",
    fontSize: "16px",
    marginBottom: "12px",
    color: "#333",
  },
  select: {
    width: "100%",
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    marginBottom: "8px",
    backgroundColor: "#fff",
  },
  quickResetBtn: {
    width: "100%",
    padding: "8px",
    fontSize: "13px",
    backgroundColor: "#6c757d",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
