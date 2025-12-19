# 快速測試指南

## 方法 1: 使用測試執行器頁面（最簡單）

1. 打開 http://localhost:4200
2. 在新分頁打開 `file:///home/kevin/Documents/RCodes/jymap/docs/test-runner.html`
3. 點擊「執行所有測試」按鈕
4. 查看測試結果

## 方法 2: 直接在瀏覽器控制台執行

1. 打開 http://localhost:4200
2. 按 F12 打開開發工具
3. 切換到 Console 標籤
4. 複製 `docs/execute-tests.js` 的全部內容並貼上執行
5. 執行 `await runAllTests();`

## 方法 3: 執行單個測試

在瀏覽器控制台執行：

```javascript
// 測試 1
await testTimelineDragSync();

// 測試 2
await testMarkerAnimation();

// 測試 3
await testTimeRangeSelection();

// 測試 4
await testSyncPerformance();
```

## 預期結果

- ✅ 測試通過：結果顯示 `meetsRequirement: true`
- ❌ 測試失敗：結果顯示 `meetsRequirement: false` 或 `error`

