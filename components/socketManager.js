import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Swal from "sweetalert2";
import { setInbound } from "@/redux/reducer/reducerInbound";
import { setTransfer } from "@/redux/reducer/reducerTransfer";
import { setOutboundExternal } from "@/redux/reducer/reducerOutboundExternal";
import { setShelfTransfer } from "@/redux/reducer/reducerShelfTransfer";
import { setInventory } from "@/redux/reducer/reducerInventory";

export default function SocketManager() {
  const dispatch = useDispatch();
  const socketRef = useRef(null); // socket連線
  const retryTimeoutRef = useRef(null); // 重試秒數
  const isConnectingRef = useRef(false);

  // socket連線
  const connectWebSocket = () => {
    // 清除之前的重試計時器
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // 如果正在連線中，直接返回
    if (isConnectingRef.current) {
      console.log("已經在連線中，跳過");
      return;
    }

    if (socketRef.current) {
      const state = socketRef.current.readyState;
      if (state === WebSocket.CONNECTING || state === WebSocket.OPEN) {
        console.log("Socket 已經在連線中或已開啟，跳過重複連線");
        return;
      }
    }

    try {
      isConnectingRef.current = true;
      // const newSocket = new WebSocket(`${process.env.NEXT_PUBLIC_SOCKET_URL}?nocache=${Date.now()}`);
      const newSocket = new WebSocket(process.env.NEXT_PUBLIC_SOCKET_URL);

      newSocket.onopen = () => {
        console.log(`SOCKET 已連線`);
      };

      newSocket.onerror = (error) => {
        console.warn("❌ SOCKET 連線失敗", error);
        isConnectingRef.current = false;
      };

      newSocket.onmessage = async (event) => {
        if (!event.data) {
          console.log("Received empty message from WebSocket.");
          Swal.fire("socket未挾帶資料");
          return;
        }
        const eventData = JSON.parse(event.data);
        console.log("socket接收到的資料 :", eventData);

        const command = eventData?.command?.toUpperCase(); // 忽略大小寫
        if (eventData?.action === "taskdone" && command !== "RETURN" && command !== "CANCEL") {
          if (eventData?.PURPOSE === 0) {
            // 出庫
            dispatch(
              setOutboundExternal({
                station: eventData.STATION,
                screen: "working",
                shelf: eventData,
                shelfItem: eventData?.ITEMS,
                step: 3,
              })
            );
            // 理貨
            dispatch(
              setShelfTransfer({
                station: eventData.STATION,
                screen: "working",
                shelf: eventData,
                shelfItem: eventData?.ITEMS,
                step: 3,
              })
            );
          } else if (eventData?.PURPOSE === 1) {
            // 入庫
            dispatch(setInbound({ station: eventData.STATION, shelf: eventData, shelfItem: eventData?.ITEMS, screen: "working", step: 3 }));

          } else if (eventData?.PURPOSE === 2) {
            // 盤點
            dispatch(
              setInventory({
                station: eventData?.STATION,
                data: {
                  screen: "IDLE",
                  shelf: {
                    SHELVE_ID: eventData?.SHELVE_ID,
                  },
                  shelfItem: eventData?.ITEMS,
                },
              })
            );
          } else if (eventData?.PURPOSE === 3) {
            // 調撥
            dispatch(
              setTransfer({
                station: eventData.STATION,
                screen: "working",
                shelf: eventData,
                shelfItem: eventData?.ITEMS,
                job: eventData?.Job,
                step: 3,
              })
            );
          }
        }
        if (eventData?.action === "push_button") {
        }
        if (eventData?.action === "show_msg") {
        }
        if (eventData?.action === "taskdone" && command === "RETURN" && eventData?.PURPOSE === 0) {
          dispatch(setShelfTransfer({ shelf: eventData, isReturn: true }));
        }
      };

      newSocket.onclose = (event) => {
        console.log("❌ Disconnected from WebSocket server", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });

        // 清空 socketRef，允許重新連線
        socketRef.current = null;
        isConnectingRef.current = false;

        // 無條件重連（因為組件不會卸載）
        // console.log("🔁 將在 3 秒後重新連線...");
        retryTimeoutRef.current = setTimeout(() => {
          console.log("執行重新連線...");
          connectWebSocket();
        }, 3000);
      };

      // 將新的 socket 儲存到 ref
      socketRef.current = newSocket;
    } catch (err) {
      console.log("websocket Error");
      socketRef.current = null;
      isConnectingRef.current = false;

      // 發生錯誤也要重試
      console.log("🔁 發生錯誤，將在 3 秒後重試...");
      retryTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    }
  };

  useEffect(() => {
    // console.log("SocketManager 初始化");
    connectWebSocket();

    // 清理函數
    return () => {
      // console.log("SocketManager 卸載，關閉連線");

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  return null; // 不渲染 UI
}
