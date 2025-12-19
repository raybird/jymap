# Epic 1-4 測試執行指南

## 快速開始

### 方法 1: 使用瀏覽器控制台（推薦）

1. 打開 http://localhost:4200
2. 打開瀏覽器開發工具（F12）
3. 切換到 Console 標籤
4. 複製 `docs/execute-tests.js` 的內容並貼上執行
5. 執行以下命令：

```javascript
// 執行單個測試
await testTimelineDragSync();
await testMarkerAnimation();
await testTimeRangeSelection();
await testSyncPerformance();

// 或執行所有測試
await runAllTests();
```

### 方法 2: 使用 chrome-mcp-server

如果您有配置 chrome-mcp-server，可以使用以下步驟：

1. **導航到頁面**
   ```json
   {
     "tool": "chrome_navigate",
     "arguments": {
       "url": "http://localhost:4200",
       "width": 1280,
       "height": 720
     }
   }
   ```

2. **等待頁面載入**（3-5 秒）

3. **執行測試**
   
   使用 `chrome_inject_script` 工具，從 `docs/test-scripts.js` 複製對應的測試腳本：
   
   ```json
   {
     "tool": "chrome_inject_script",
     "arguments": {
       "url": "http://localhost:4200",
       "type": "MAIN",
       "jsScript": "<從 test-scripts.js 複製對應的測試腳本>"
     }
   }
   ```

## 測試說明

### 測試 1: 時間軸拖曳與地圖同步

**目標：**
- 驗證拖曳時間軸時地圖標記是否即時更新
- 測量同步延遲（目標 < 200ms）

**預期結果：**
- `scrollWorked`: true
- `syncTime`: < 200ms
- `meetsRequirement`: true

### 測試 2: 標記淡入淡出動畫

**目標：**
- 驗證時間軸變化時標記是否淡入淡出
- 測量動畫時間（目標 < 200ms）
- 測量 FPS（目標 ≥ 30fps）

**預期結果：**
- `animationDuration`: < 200ms
- `fps`: ≥ 30
- `meetsDurationRequirement`: true
- `meetsFPSRequirement`: true

### 測試 3: 時間範圍選擇與地圖過濾

**目標：**
- 驗證 Shift + 拖曳是否正確選擇時間範圍
- 驗證選擇範圍時是否正確過濾地圖標記

**預期結果：**
- `timeSelectionVisible`: true
- `timeSelectionText`: 包含年份範圍
- `markersFiltered`: true（如果時間範圍過濾了標記）

### 測試 4: 效能測試 - 同步延遲

**目標：**
- 使用 Performance API 測量同步延遲
- 驗證同步延遲是否符合要求（< 200ms）

**預期結果：**
- `syncDuration`: < 200ms
- `meetsRequirement`: true

## 測試結果記錄

執行測試後，請將結果記錄到 `docs/epic1-4-test-results-final.md` 中。

## 故障排除

### 問題：找不到時間軸容器

**解決方案：**
- 確認頁面已完全載入
- 等待 3-5 秒後再執行測試
- 檢查控制台是否有錯誤訊息

### 問題：測試結果不符合預期

**解決方案：**
- 檢查瀏覽器控制台是否有錯誤
- 確認 NgRx DevTools 是否正常運作
- 檢查網路請求是否成功

### 問題：動畫測試超時

**解決方案：**
- 增加超時時間（在測試腳本中修改）
- 檢查動畫 CSS 是否正確應用
- 確認 requestAnimationFrame 是否正常運作

## 相關文檔

- `docs/epic1-4-test-results-final.md` - 測試結果文檔
- `docs/epic1-4-test-chrome-mcp-server.md` - chrome-mcp-server 測試指南
- `docs/test-scripts.js` - 測試腳本集合
- `docs/execute-tests.js` - 可直接執行的測試腳本

