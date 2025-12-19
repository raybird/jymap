# 使用 Chrome MCP Server 測試剩餘功能

## 概述

`chrome-mcp-server` 提供了比 `chrome-devtools` 更適合測試拖曳和互動操作的工具，特別是：

1. **`chrome_click_element`** - 支持座標點擊，可以模擬拖曳操作
2. **`chrome_inject_script`** - 可以在 MAIN world 中執行腳本，訪問頁面的實際 DOM 和事件
3. **`chrome_get_web_content`** - 獲取頁面內容，便於定位元素

## 剩餘需要測試的功能

### 1. 時間軸拖曳與地圖同步（Epic 4 Story 4.2）

**測試目標：**
- 拖曳時間軸時地圖標記是否即時更新
- 同步延遲是否 < 200ms
- 同步過程是否保持 ≥ 30fps

**使用 chrome-mcp-server 的測試方法：**

#### 方法 1: 使用 `chrome_click_element` 模擬拖曳

```javascript
// 1. 獲取時間軸容器的位置
const timelineContainer = document.querySelector("app-timeline-container .timeline-container");
const rect = timelineContainer.getBoundingClientRect();
const startX = rect.left + 100;
const startY = rect.top + 50;
const endX = rect.left + 500;
const endY = rect.top + 50;

// 2. 使用 chrome_click_element 點擊起始位置（mousedown）
// 3. 使用 chrome_click_element 點擊結束位置（mousemove + mouseup）
```

**測試腳本：**
```javascript
// 使用 chrome_inject_script 注入測試腳本
const testScript = `
  (async () => {
    const timelineContainer = document.querySelector("app-timeline-container .timeline-container");
    if (!timelineContainer) return { error: "Timeline container not found" };
    
    const rect = timelineContainer.getBoundingClientRect();
    const startX = rect.left + 100;
    const startY = rect.top + 50;
    const endX = rect.left + 500;
    const endY = rect.top + 50;
    
    // 記錄初始狀態
    const initialScroll = timelineContainer.scrollLeft;
    const initialMarkerCount = document.querySelectorAll("app-map-container .leaflet-marker-pane > div").length;
    const startTime = performance.now();
    
    // 模擬拖曳操作
    const mouseDown = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: startX,
      clientY: startY,
      button: 0
    });
    
    const mouseMove = new MouseEvent("mousemove", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: endX,
      clientY: endY,
      button: 0
    });
    
    const mouseUp = new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: endX,
      clientY: endY,
      button: 0
    });
    
    timelineContainer.dispatchEvent(mouseDown);
    document.dispatchEvent(mouseMove);
    document.dispatchEvent(mouseUp);
    
    // 等待 NgRx 處理和動畫完成
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const endTime = performance.now();
    const afterScroll = timelineContainer.scrollLeft;
    const afterMarkerCount = document.querySelectorAll("app-map-container .leaflet-marker-pane > div").length;
    
    return {
      initialScroll,
      afterScroll,
      scrollWorked: afterScroll !== initialScroll,
      initialMarkerCount,
      afterMarkerCount,
      syncTime: (endTime - startTime).toFixed(2) + "ms"
    };
  })();
`;
```

#### 方法 2: 使用 Performance API 測量同步延遲

```javascript
const performanceTest = `
  (async () => {
    const timelineContainer = document.querySelector("app-timeline-container .timeline-container");
    if (!timelineContainer) return { error: "Timeline container not found" };
    
    // 開始效能追蹤
    performance.mark("sync-start");
    
    // 觸發拖曳操作
    timelineContainer.scrollLeft = 2000;
    const scrollEvent = new Event("scroll", { bubbles: true });
    timelineContainer.dispatchEvent(scrollEvent);
    
    // 等待同步完成
    await new Promise(resolve => {
      const checkSync = () => {
        const markers = document.querySelectorAll("app-map-container .leaflet-marker-pane > div");
        // 檢查標記是否更新（可以通過檢查標記的 opacity 或其他屬性）
        performance.mark("sync-end");
        performance.measure("sync-duration", "sync-start", "sync-end");
        const measure = performance.getEntriesByName("sync-duration")[0];
        resolve(measure.duration);
      };
      setTimeout(checkSync, 200);
    });
    
    const measure = performance.getEntriesByName("sync-duration")[0];
    return {
      syncDuration: measure.duration.toFixed(2) + "ms",
      meetsRequirement: measure.duration < 200
    };
  })();
`;
```

### 2. 標記淡入淡出動畫（Epic 4 Story 4.3）

**測試目標：**
- 時間軸變化時標記是否淡入淡出
- 動畫是否流暢（60fps）
- 動畫時間是否符合 < 200ms 要求

**使用 chrome-mcp-server 的測試方法：**

```javascript
const animationTest = `
  (async () => {
    const timelineContainer = document.querySelector("app-timeline-container .timeline-container");
    const markers = document.querySelectorAll("app-map-container .leaflet-marker-pane > div");
    
    if (!timelineContainer || markers.length === 0) {
      return { error: "Timeline or markers not found" };
    }
    
    // 記錄初始透明度
    const initialOpacities = Array.from(markers).map(m => 
      parseFloat(window.getComputedStyle(m).opacity)
    );
    
    // 觸發時間範圍變化
    const startTime = performance.now();
    timelineContainer.scrollLeft = 3000;
    
    // 監聽動畫變化
    const animationFrames = [];
    let frameCount = 0;
    
    const observeAnimation = () => {
      frameCount++;
      const currentOpacities = Array.from(markers).map(m => 
        parseFloat(window.getComputedStyle(m).opacity)
      );
      
      animationFrames.push({
        frame: frameCount,
        time: performance.now() - startTime,
        opacities: currentOpacities
      });
      
      // 檢查動畫是否完成（透明度穩定）
      const isStable = currentOpacities.every((op, i) => 
        Math.abs(op - initialOpacities[i]) < 0.01 || 
        Math.abs(op - 1) < 0.01
      );
      
      if (!isStable && frameCount < 60) {
        requestAnimationFrame(observeAnimation);
      } else {
        const endTime = performance.now();
        const duration = endTime - startTime;
        const fps = (frameCount / duration) * 1000;
        
        return {
          animationDuration: duration.toFixed(2) + "ms",
          frameCount,
          fps: fps.toFixed(2),
          meetsDurationRequirement: duration < 200,
          meetsFPSRequirement: fps >= 30,
          frames: animationFrames
        };
      }
    };
    
    requestAnimationFrame(observeAnimation);
    
    // 等待動畫完成
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      animationTested: true,
      // 返回觀察結果
    };
  })();
`;
```

### 3. 時間範圍選擇與地圖過濾（Epic 3 Story 3.4 + Epic 4 Story 4.2）

**測試目標：**
- Shift + 拖曳是否正確選擇時間範圍
- 選擇範圍時是否正確過濾地圖標記
- 清除選擇功能是否正常

**使用 chrome-mcp-server 的測試方法：**

```javascript
const timeRangeSelectionTest = `
  (async () => {
    const timelineTrack = document.querySelector("app-timeline-container .timeline-track");
    const timelineContainer = document.querySelector("app-timeline-container .timeline-container");
    
    if (!timelineTrack || !timelineContainer) {
      return { error: "Timeline elements not found" };
    }
    
    const rect = timelineTrack.getBoundingClientRect();
    const startX = rect.left + 200;
    const startY = rect.top + 50;
    const endX = rect.left + 600;
    const endY = rect.top + 50;
    
    // 記錄初始狀態
    const initialMarkerCount = document.querySelectorAll("app-map-container .leaflet-marker-pane > div").length;
    
    // 模擬 Shift + 拖曳
    const mouseDown = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: startX,
      clientY: startY,
      button: 0,
      shiftKey: true
    });
    
    const mouseMove = new MouseEvent("mousemove", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: endX,
      clientY: endY,
      button: 0,
      shiftKey: true
    });
    
    const mouseUp = new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: endX,
      clientY: endY,
      button: 0
    });
    
    timelineTrack.dispatchEvent(mouseDown);
    document.dispatchEvent(mouseMove);
    document.dispatchEvent(mouseUp);
    
    // 等待 NgRx 處理
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 檢查結果
    const timeSelection = document.querySelector("app-timeline-container .time-selection");
    const afterMarkerCount = document.querySelectorAll("app-map-container .leaflet-marker-pane > div").length;
    
    return {
      timeSelectionVisible: !!timeSelection,
      timeSelectionText: timeSelection?.textContent || null,
      initialMarkerCount,
      afterMarkerCount,
      markersFiltered: afterMarkerCount !== initialMarkerCount
    };
  })();
`;
```

## 使用 chrome-mcp-server 的優勢

1. **座標點擊支持** - `chrome_click_element` 支持座標點擊，可以更精確地模擬拖曳操作
2. **MAIN world 執行** - `chrome_inject_script` 可以在 MAIN world 中執行，可以訪問頁面的實際 DOM 和事件系統
3. **更好的事件模擬** - 可以更準確地模擬滑鼠事件序列（mousedown → mousemove → mouseup）

## 測試步驟建議

1. **準備階段**
   - 使用 `chrome_navigate` 導航到 `http://localhost:4200`
   - 使用 `chrome_get_web_content` 確認頁面已載入

2. **執行測試**
   - 使用 `chrome_inject_script` 注入測試腳本（type: "MAIN"）
   - 等待測試完成並獲取結果

3. **驗證結果**
   - 檢查返回的測試結果
   - 使用 `chrome_screenshot` 截圖驗證視覺效果（可選）

## 注意事項

1. **時序問題** - 需要適當的延遲來等待 NgRx 處理和動畫完成
2. **事件觸發** - 直接設置 `scrollLeft` 不會觸發 `scroll` 事件，需要手動觸發
3. **效能測量** - 使用 Performance API 可以更準確地測量同步延遲

## 結論

`chrome-mcp-server` 確實比 `chrome-devtools` 更適合測試剩餘的互動功能，特別是：
- ✅ 支持座標點擊，可以模擬拖曳操作
- ✅ 可以在 MAIN world 中執行，訪問實際的 DOM 和事件
- ✅ 可以注入複雜的測試腳本，測量效能指標

建議使用 `chrome-mcp-server` 來完成剩餘的測試任務。

