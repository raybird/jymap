# 執行測試指南

## 使用 chrome-mcp-server 執行測試

### 步驟 1: 導航到頁面

```bash
# 使用 chrome_navigate 工具
{
  "url": "http://localhost:4200",
  "width": 1280,
  "height": 720
}
```

### 步驟 2: 等待頁面載入

等待 3-5 秒讓頁面完全載入。

### 步驟 3: 執行測試

#### 測試 1: 時間軸拖曳與地圖同步

使用 `chrome_inject_script` 工具：

```json
{
  "url": "http://localhost:4200",
  "type": "MAIN",
  "jsScript": "<從 test-scripts.js 複製 testTimelineDragSync>"
}
```

#### 測試 2: 標記淡入淡出動畫

```json
{
  "url": "http://localhost:4200",
  "type": "MAIN",
  "jsScript": "<從 test-scripts.js 複製 testMarkerAnimation>"
}
```

#### 測試 3: 時間範圍選擇與地圖過濾

```json
{
  "url": "http://localhost:4200",
  "type": "MAIN",
  "jsScript": "<從 test-scripts.js 複製 testTimeRangeSelection>"
}
```

#### 測試 4: 效能測試 - 同步延遲

```json
{
  "url": "http://localhost:4200",
  "type": "MAIN",
  "jsScript": "<從 test-scripts.js 複製 testSyncPerformance>"
}
```

## 預期結果

### 測試 1: 時間軸拖曳與地圖同步
- `scrollWorked`: true
- `syncTime`: < 200ms
- `meetsRequirement`: true

### 測試 2: 標記淡入淡出動畫
- `animationDuration`: < 200ms
- `fps`: ≥ 30
- `meetsDurationRequirement`: true
- `meetsFPSRequirement`: true

### 測試 3: 時間範圍選擇與地圖過濾
- `timeSelectionVisible`: true
- `timeSelectionText`: 包含年份範圍
- `markersFiltered`: true（如果時間範圍過濾了標記）

### 測試 4: 效能測試 - 同步延遲
- `syncDuration`: < 200ms
- `meetsRequirement`: true

