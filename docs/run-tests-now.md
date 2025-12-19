# 執行測試 - 立即執行指南

## 快速執行方法

### 步驟 1: 打開瀏覽器並載入頁面
1. 確保開發伺服器正在運行（`npm start` 在 `webapp` 目錄）
2. 打開瀏覽器訪問 http://localhost:4200
3. 等待頁面完全載入（約 3-5 秒）

### 步驟 2: 打開瀏覽器控制台
1. 按 `F12` 或右鍵選擇「檢查」
2. 切換到 `Console` 標籤

### 步驟 3: 複製並執行測試腳本

**方法 A: 執行單個測試**

複製以下代碼到控制台並執行：

```javascript
// 測試 1: 時間軸拖曳與地圖同步
(async () => {
  const timelineContainer = document.querySelector('app-timeline-container .timeline-container');
  if (!timelineContainer) return { error: 'Timeline container not found' };
  
  const rect = timelineContainer.getBoundingClientRect();
  const startX = rect.left + 100;
  const startY = rect.top + 50;
  const endX = rect.left + 500;
  const endY = rect.top + 50;
  
  const initialScroll = timelineContainer.scrollLeft;
  const initialMarkerCount = document.querySelectorAll('app-map-container .leaflet-marker-pane > div').length;
  const startTime = performance.now();
  
  const mouseDown = new MouseEvent('mousedown', {
    bubbles: true, cancelable: true, view: window,
    clientX: startX, clientY: startY, button: 0
  });
  
  const mouseMove = new MouseEvent('mousemove', {
    bubbles: true, cancelable: true, view: window,
    clientX: endX, clientY: endY, button: 0
  });
  
  const mouseUp = new MouseEvent('mouseup', {
    bubbles: true, cancelable: true, view: window,
    clientX: endX, clientY: endY, button: 0
  });
  
  timelineContainer.dispatchEvent(mouseDown);
  document.dispatchEvent(mouseMove);
  document.dispatchEvent(mouseUp);
  
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const endTime = performance.now();
  const afterScroll = timelineContainer.scrollLeft;
  const afterMarkerCount = document.querySelectorAll('app-map-container .leaflet-marker-pane > div').length;
  const syncTime = endTime - startTime;
  
  const result = {
    test: 'timeline-drag-sync',
    initialScroll,
    afterScroll,
    scrollWorked: afterScroll !== initialScroll,
    initialMarkerCount,
    afterMarkerCount,
    syncTime: syncTime.toFixed(2) + 'ms',
    meetsRequirement: syncTime < 200
  };
  
  console.log('✅ 測試結果:', result);
  return result;
})();
```

**方法 B: 載入完整測試腳本**

1. 打開 `docs/execute-tests.js` 文件
2. 複製全部內容
3. 貼到瀏覽器控制台並執行
4. 然後執行：
   ```javascript
   await runAllTests();
   ```

## 預期輸出

測試執行後，控制台會顯示：
- 每個測試的詳細結果
- 是否符合要求的標記（✅ 或 ❌）
- 測試結果摘要

## 記錄測試結果

執行測試後，請將結果記錄到 `docs/epic1-4-test-results-final.md` 中。

