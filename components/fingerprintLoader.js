'use client';

import { useEffect } from 'react';
import fpPromise from '@fingerprintjs/fingerprintjs';

export default function FingerprintLoader() {
  useEffect(() => {
    const setFp = async () => {
      const fp = await fpPromise.load();
      const result = await fp.get();
      const visitorId = result.visitorId;

      // 1. 存入 localStorage
      localStorage.setItem('device_id', visitorId);
      
      // 2. 為了方便你開發，先印出來（之後可以移除）
    //   console.log("目前設備指紋 ID:", visitorId);
      
      // 如果你是開發環境，直接把 ID 顯示在 Console
    //   if (process.env.NODE_ENV === 'development') {
    //     window.alert("請複製此 ID 到白名單: " + visitorId);
    //   }
    };
    setFp();
  }, []);

  return null; // 此元件不渲染畫面
}