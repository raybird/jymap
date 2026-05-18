# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

jymap 是金庸世界時空地圖，將金庸 15 部小說的事件整合於互動式地圖與時間軸上。SPA 應用，部署至 Cloudflare Pages。

## 開發指令

所有指令須在 `webapp/` 目錄下執行：

```bash
cd webapp
npm install           # 安裝依賴
npm start             # 啟動開發伺服器（http://localhost:4200）
ng build              # 生產建置
ng test               # 執行所有測試（Karma + Jasmine）
ng test --include='**/some.spec.ts'  # 執行單一測試檔
```

## 技術棧

| 層級 | 技術 |
|------|------|
| 框架 | Angular 18 Standalone Components |
| 狀態管理 | NgRx 18（Store + Effects + Selectors） |
| 地圖 | Leaflet 1.9（原生整合，非 Angular 包裝器） |
| 搜尋 | Fuse.js 7 |
| UI | Angular Material 18（MatSidenav 等） |
| 測試 | Karma + Jasmine |

## 架構重點

### NgRx 狀態結構

唯一的 feature slice 是 `timeMap`（`TimeMapState`）。關鍵設計決策：

- **`visibleEvents` 在 reducer 計算**：`setTimeRange`、`clearTimeRange`、`setNovelFilter`、`loadEventsSuccess` 都會呼叫 `applyFilters()` 重算 `visibleEvents`，而非在 selector 動態過濾。這樣 selector 直接取 `state.visibleEvents` 即可，避免重複運算。
- **`selectedEventVersion` 計數器**：每次 dispatch `selectEvent` 時遞增，確保即使選擇同一個 eventId，selector 也會重新發射，讓 UI 強制重新渲染。

### 資料流

```
/assets/data/events.json  ─▶  DataService.loadEvents()
                               ├─ DataValidator.validateEvents()  (驗證座標、必填欄位)
                               └─ TimeMapEffects  ─▶  Store  ─▶  Selectors  ─▶  Components
```

靜態 JSON 資料存放於 `webapp/src/assets/data/`（`events.json`、`timeline.json`），在 Effects 中透過 HTTP 載入，經 `DataValidator` 驗證後進入 Store。

### 功能模組結構

```
core/
  models/         # Event、TimelineItem、MapMarker 介面定義
  services/       # DataService（資料載入）、SearchService（Fuse.js）、RelatedEventsService
  state/          # actions / reducer / selectors / effects（單一 timeMap slice）
  utils/          # DataValidator（驗證邏輯）、Logger

features/
  map/            # MapContainerComponent：Leaflet 地圖，直接訂閱 Store
  timeline/       # TimelineContainerComponent：水平時間軸，朝代視覺帶，範圍 -500～1800
  search/         # SearchBoxComponent + SearchResultsComponent
  novel-filter/   # NovelFilterComponent（小說篩選）
  event-detail/   # EventCardComponent（側邊抽屜）
```

### 組件與 Store 的互動模式

各 feature 組件直接注入 `Store<AppState>` 並：
- 用 `store.select(TimeMapSelectors.selectXxx)` 訂閱狀態
- 用 `store.dispatch(TimeMapActions.xxx())` 發送動作
- 皆使用 `takeUntil(this.destroy$)` 管理訂閱生命週期

### 效能考量

- 地圖標記同步延遲目標 `<200ms`（時間軸拖曳 → 地圖更新）
- 時間軸元件使用 `throttleTime` 控制事件發射頻率
- MapContainerComponent 直接操作原生 Leaflet API（非 Angular 包裝），避免 Change Detection 開銷
