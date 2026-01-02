---
generated: "2025-12-22"
epic: "epic-6"
epic_name: "事件詳情呈現"
status: "planning"
project: "jymap"
---

# Epic 6: 事件詳情呈現 - 開發規劃

## Epic 概述

**目標：** 使用者可以透過點擊地圖標記查看事件卡片，在卡片中查看歷史事件描述、小說情節摘要、相關人物資訊、資料來源連結，並可以展開「相關事件」區塊快速跳轉到其他相關事件。

**FRs covered:** FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR24, FR25, FR40, FR41

**技術需求：**
- 事件卡片組件開發（側邊抽屜）
- 事件卡片展開動畫
- 相關事件跳轉邏輯
- 事件標記高亮狀態
- 來源連結顯示與缺失標示

---

## 當前狀態分析

### 已完成的功能
1. ✅ 地圖標記點擊事件已實作（`MapContainerComponent.eventClick`）
2. ✅ 地圖標記高亮功能已部分實作（`highlightMarker` 方法用於搜尋結果）
3. ✅ NgRx 狀態管理架構已建立
4. ✅ 事件資料模型已定義（`Event` 介面）

### 需要新增的功能
1. ❌ 當前選中事件的 NgRx 狀態管理
2. ❌ 事件卡片組件（側邊抽屜）
3. ❌ 事件卡片展開/收起動畫
4. ❌ 相關事件跳轉邏輯
5. ❌ 事件標記高亮狀態（與當前選中事件同步）
6. ❌ 來源連結顯示與缺失標示

---

## 開發任務分解

### Story 6.1: NgRx 狀態擴展 - 當前選中事件管理

**目標：** 擴展 NgRx Store 以管理當前選中的事件狀態，支援事件卡片顯示與標記高亮。

**技術實作：**

1. **擴展 `TimeMapState` 介面**
   - 新增 `selectedEvent: ValidatedEvent | null` 欄位
   - 新增 `selectedEventId: string | null` 欄位（用於快速查找）

2. **新增 Actions**
   ```typescript
   // 選中事件
   export const selectEvent = createAction(
     '[TimeMap] Select Event',
     props<{ eventId: string }>()
   );
   
   // 清除選中事件
   export const clearSelectedEvent = createAction('[TimeMap] Clear Selected Event');
   ```

3. **更新 Reducer**
   - 處理 `selectEvent` action：根據 eventId 從 events 陣列中找到對應事件
   - 處理 `clearSelectedEvent` action：清除選中狀態

4. **新增 Selectors**
   ```typescript
   export const selectSelectedEvent = createSelector(
     selectTimeMapState,
     (state) => state.selectedEvent
   );
   
   export const selectSelectedEventId = createSelector(
     selectTimeMapState,
     (state) => state.selectedEventId
   );
   ```

**驗收標準：**
- ✅ NgRx Store 可以正確儲存當前選中的事件
- ✅ 可以透過 selector 訂閱選中事件變化
- ✅ 清除選中事件功能正常運作

---

### Story 6.2: 事件卡片組件開發（側邊抽屜）

**目標：** 建立事件卡片組件，使用 Angular Material Drawer 實作側邊抽屜，顯示事件詳細資訊。

**技術實作：**

1. **建立組件結構**
   ```
   src/app/features/event-detail/
     components/
       event-card.component.ts
       event-card.component.html
       event-card.component.scss
   ```

2. **組件功能需求**
   - 使用 Angular Material `MatDrawer` 或 `MatSidenav`
   - 從右側滑出（桌面）或從底部滑出（平板）
   - 訂閱 NgRx Store 的 `selectSelectedEvent` selector
   - 當有選中事件時自動打開抽屜
   - 當清除選中事件時自動關閉抽屜

3. **卡片內容區塊**
   - **標題區：** 事件標題、朝代、年份
   - **歷史事件描述：** 顯示 `description` 欄位（FR15）
   - **小說情節摘要：** 顯示 `summary` 欄位（FR16）
   - **相關人物：** 顯示 `characters` 陣列（FR17）
   - **資料來源：** 顯示 `sources` 陣列，包含連結與缺失標示（FR18, FR24, FR25）
   - **相關事件：** 可展開區塊，顯示相關事件列表（FR19）

4. **響應式設計**
   - 桌面（≥1024px）：右側抽屜，寬度約 400px
   - 平板（768-1023px）：底部抽屜，高度約 60vh
   - 使用 Angular Material BreakpointObserver

**驗收標準：**
- ✅ 點擊地圖標記時，事件卡片自動打開並顯示正確內容
- ✅ 卡片內容完整顯示所有必要資訊（標題、描述、摘要、人物、來源）
- ✅ 響應式設計在桌面與平板上正常運作
- ✅ 卡片可以手動關閉（關閉按鈕）

---

### Story 6.3: 事件卡片展開動畫

**目標：** 實作流暢的事件卡片展開/收起動畫，提升使用者體驗。

**技術實作：**

1. **使用 Angular Animations**
   - 定義 `@Component` 的 `animations` 屬性
   - 使用 `trigger`, `state`, `transition` 定義動畫狀態

2. **動畫效果**
   - **展開：** 從右側滑入（桌面）或從底部滑入（平板）
   - **收起：** 滑出並淡出
   - **動畫時間：** 300ms（符合 NFR5: 卡片載入 < 500ms）
   - **動畫曲線：** `ease-in-out`

3. **內容淡入效果**
   - 卡片打開後，內容區塊依次淡入（stagger animation）
   - 提升視覺層次感

**驗收標準：**
- ✅ 卡片展開動畫流暢（60fps，無卡頓）
- ✅ 動畫時間符合 < 500ms 要求
- ✅ 內容淡入效果自然
- ✅ 動畫在 Chrome 和 Safari 中正常運作

---

### Story 6.4: 相關事件跳轉邏輯

**目標：** 實作相關事件跳轉功能，使用者可以從事件卡片中的「相關事件」區塊快速跳轉到其他相關事件。

**技術實作：**

1. **相關事件判斷邏輯**
   - **地點關聯：** 相同或相近地點的事件（經緯度距離 < 50km）
   - **人物關聯：** 包含相同人物的事件
   - **時間關聯：** 相同朝代或相近年份的事件（±50 年）
   - **小說關聯：** 相同小說作品的事件
   - **標籤關聯：** 包含相同標籤的事件

2. **建立相關事件服務**
   ```
   src/app/core/services/related-events.service.ts
   ```
   - `findRelatedEvents(event: ValidatedEvent, allEvents: ValidatedEvent[]): ValidatedEvent[]`
   - 實作多種關聯邏輯，返回相關事件列表（最多 10 個）
   - 按相關性排序（地點 > 人物 > 時間 > 小說 > 標籤）

3. **事件卡片中的相關事件顯示**
   - 在事件卡片中顯示「相關事件」區塊（可展開/收起）
   - 顯示相關事件列表（標題、朝代、年份、小說）
   - 每個相關事件可點擊

4. **跳轉邏輯**
   - 點擊相關事件時，dispatch `selectEvent` action
   - 自動更新時間軸位置（跳轉到相關事件的年份）
   - 自動更新地圖視角（飛到相關事件的位置）
   - 高亮相關事件的標記

**驗收標準：**
- ✅ 相關事件判斷邏輯正確（地點、人物、時間、小說、標籤）
- ✅ 相關事件列表正確顯示在事件卡片中
- ✅ 點擊相關事件時，正確跳轉到對應事件（FR20, FR40）
- ✅ 時間軸與地圖同步更新（FR38）
- ✅ 相關事件標記正確高亮（FR21）

---

### Story 6.5: 事件標記高亮狀態

**目標：** 實作事件標記高亮狀態，當選中事件時，對應的地圖標記自動高亮顯示。

**技術實作：**

1. **擴展 `MapContainerComponent`**
   - 訂閱 `selectSelectedEventId` selector
   - 當選中事件變化時，更新標記高亮狀態

2. **標記高亮邏輯**
   - 找到對應的標記（根據 `eventId`）
   - 應用高亮樣式：
     - 放大標記（scale 1.5）
     - 添加高亮邊框（box-shadow）
     - 提高 z-index
   - 清除之前高亮的標記樣式

3. **高亮樣式設計**
   - 使用中國水墨風格的高亮效果
   - 符合 Old Maps 視覺風格
   - 確保對比度符合 WCAG 2.1 AA 標準

4. **地圖視角自動調整**
   - 當選中事件時，如果標記不在視窗內，自動飛到標記位置
   - 適當縮放級別（至少 zoom 8）

**驗收標準：**
- ✅ 選中事件時，對應標記自動高亮（FR21）
- ✅ 高亮效果清晰可見，符合設計要求
- ✅ 清除選中事件時，高亮效果正確移除
- ✅ 地圖視角自動調整到標記位置
- ✅ 高亮效果在 Chrome 和 Safari 中正常運作

---

### Story 6.6: 來源連結顯示與缺失標示

**目標：** 在事件卡片中顯示資料來源連結，並標示缺少來源的事件。

**技術實作：**

1. **來源連結顯示**
   - 在事件卡片中顯示「資料來源」區塊
   - 顯示所有來源連結（`sources` 陣列）
   - 每個連結可點擊，在新分頁開啟（FR18, FR24）

2. **來源缺失標示**
   - 如果 `sources` 陣列為空或所有連結無效，顯示「來源缺失」標示（FR25）
   - 使用視覺標記（例如：警告圖示 + 文字）
   - 符合 WCAG 2.1 AA 對比度標準

3. **來源連結驗證（可選）**
   - 驗證來源連結格式（URL 格式）
   - 標示無效連結（格式錯誤）

4. **來源連結樣式**
   - 使用 Old Maps + 水墨風格設計
   - 連結樣式清晰可辨識
   - 懸停效果

**驗收標準：**
- ✅ 事件卡片正確顯示所有來源連結（FR18, FR24）
- ✅ 來源連結可點擊，在新分頁開啟
- ✅ 缺少來源時正確顯示「來源缺失」標示（FR25）
- ✅ 來源連結樣式符合設計要求
- ✅ 來源連結在 Chrome 和 Safari 中正常運作

---

## 技術架構設計

### 組件結構

```
src/app/features/event-detail/
  components/
    event-card.component.ts          # 事件卡片主組件
    event-card.component.html        # 事件卡片模板
    event-card.component.scss        # 事件卡片樣式
    related-events.component.ts       # 相關事件子組件（可選）
    related-events.component.html
    related-events.component.scss
  event-detail.routes.ts             # 路由配置（如需要）
```

### 服務擴展

```
src/app/core/services/
  related-events.service.ts          # 相關事件查找服務
```

### NgRx 狀態擴展

```
src/app/core/state/
  time-map.actions.ts                # 新增 selectEvent, clearSelectedEvent
  time-map.reducer.ts                # 新增 selectedEvent 狀態
  time-map.selectors.ts              # 新增 selectSelectedEvent, selectSelectedEventId
```

### 組件整合

- `MapContainerComponent`: 訂閱選中事件，更新標記高亮
- `EventCardComponent`: 訂閱選中事件，顯示事件詳情
- `AppComponent`: 整合事件卡片組件到主頁面

---

## 依賴關係

### 前置條件
- ✅ Epic 1: 資料模型已定義
- ✅ Epic 2: 地圖標記點擊事件已實作
- ✅ Epic 4: NgRx 狀態管理已建立

### 後續 Epic
- Epic 7: 資料關聯與探索（依賴 Epic 6 的相關事件功能）

---

## 效能考量

1. **卡片載入時間：** < 500ms（NFR5）
2. **動畫流暢度：** 60fps（NFR8）
3. **相關事件查找：** 使用 memoized selector 避免重複計算
4. **標記高亮更新：** 使用 requestAnimationFrame 確保流暢

---

## 無障礙考量

1. **鍵盤操作：** 事件卡片可透過鍵盤打開/關閉
2. **ARIA 標示：** 為事件卡片添加適當的 ARIA 標籤
3. **焦點管理：** 打開卡片時，焦點自動移動到卡片內
4. **螢幕閱讀器：** 卡片內容可透過螢幕閱讀器完整讀取

---

## 測試策略

### 單元測試
- 相關事件查找邏輯測試
- NgRx reducer 測試（選中事件狀態管理）
- 組件邏輯測試

### 整合測試
- 地圖標記點擊 → 事件卡片打開
- 相關事件跳轉 → 時間軸與地圖同步更新
- 標記高亮狀態同步

### E2E 測試
- 完整的使用者流程：點擊標記 → 查看卡片 → 跳轉相關事件

---

## 開發時程估算

| Story | 預估時間 | 優先級 |
|-------|---------|--------|
| Story 6.1: NgRx 狀態擴展 | 2-3 小時 | 高 |
| Story 6.2: 事件卡片組件 | 4-6 小時 | 高 |
| Story 6.3: 展開動畫 | 2-3 小時 | 中 |
| Story 6.4: 相關事件跳轉 | 4-6 小時 | 高 |
| Story 6.5: 標記高亮 | 2-3 小時 | 高 |
| Story 6.6: 來源連結顯示 | 2-3 小時 | 中 |
| **總計** | **16-24 小時** | |

---

## 下一步行動

1. ✅ 開始 Story 6.1: NgRx 狀態擴展
2. 實作 Story 6.2: 事件卡片組件
3. 實作 Story 6.3: 展開動畫
4. 實作 Story 6.4: 相關事件跳轉
5. 實作 Story 6.5: 標記高亮
6. 實作 Story 6.6: 來源連結顯示

---

## 備註

- 事件卡片設計需符合 Old Maps + 水墨風格
- 相關事件邏輯可後續優化（使用更複雜的關聯演算法）
- 來源連結驗證可考慮使用後端服務（Post-MVP）

