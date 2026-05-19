# 人物軌跡（Character Trajectory）實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 jymap 加入「人物模式」：使用者選一個人物後，地圖以虛線+箭頭呈現該人物參與事件的時間軌跡，側邊面板取代事件卡片顯示完整年表，時間軸自動覆蓋至活躍期。

**Architecture:** 沿用單一 `timeMap` NgRx slice，新增 `selectedCharacter / selectedCharacterVersion / preCharacterSnapshot` 三個欄位與 `selectCharacter / clearSelectedCharacter` 兩個 actions。Reducer 內 `selectEvent / setNovelFilter` 自動還原 snapshot。新增 `features/character-detail/` 模組與 `character-panel.component`。地圖透過新增的 `trajectoryLayer` 繪製折線，箭頭裝飾由 `leaflet-polylinedecorator` 提供（載入失敗退化為純虛線）。

**Tech Stack:** Angular 18 Standalone Components、NgRx 18、Leaflet 1.9、leaflet-polylinedecorator（新）、Fuse.js 7、Karma + Jasmine。

**Spec 來源：** `docs/superpowers/specs/2026-05-18-character-trajectory-design.md`

---

## File Structure

### 新增檔案

| 路徑 | 責任 |
|---|---|
| `webapp/src/app/features/character-detail/components/character-panel.component.ts` | 人物面板組件邏輯 |
| `webapp/src/app/features/character-detail/components/character-panel.component.html` | 人物面板模板 |
| `webapp/src/app/features/character-detail/components/character-panel.component.scss` | 人物面板樣式 |
| `webapp/src/app/core/state/time-map.reducer.spec.ts` | reducer 單元測試 |
| `webapp/src/app/core/state/time-map.selectors.spec.ts` | selectors 單元測試 |
| `webapp/src/types/leaflet-polylinedecorator.d.ts` | 第三方套件 type declaration |

### 修改檔案

| 路徑 | 改動 |
|---|---|
| `webapp/package.json` | 新增 `leaflet-polylinedecorator` 依賴 |
| `webapp/tsconfig.json`（或 `tsconfig.app.json`） | 把 `src/types` 納入 typeRoots（如需要） |
| `webapp/src/app/core/state/time-map.reducer.ts` | TimeMapState 新增欄位；新增 reducer handler；擴展 `selectEvent` / `setNovelFilter` |
| `webapp/src/app/core/state/time-map.actions.ts` | 新增 `selectCharacter` / `clearSelectedCharacter` actions |
| `webapp/src/app/core/state/time-map.selectors.ts` | 新增 6 個 selectors |
| `webapp/src/app/features/event-detail/components/event-card.component.ts` | 新增 `characterClick` Output 與 `onCharacterClick()` |
| `webapp/src/app/features/event-detail/components/event-card.component.html` | 人物 tag 改為 `<button>` |
| `webapp/src/app/features/event-detail/components/event-card.component.scss` | tag-character 按鈕樣式 |
| `webapp/src/app/features/map/components/map-container.component.ts` | `computeWeight()`、`trajectoryLayer`、`drawTrajectory()`、popup 人物快捷、`characterClick` Output |
| `webapp/src/app/features/search/components/search-box.component.ts` | 新增人物 autocomplete 邏輯 |
| `webapp/src/app/features/search/components/search-box.component.html`（非必要，autocomplete 在 app.component） | — |
| `webapp/src/app/app.component.ts` | 新增 `onCharacterClick` / `onCloseCharacterPanel` handlers、`selectedCharacter$` Observable |
| `webapp/src/app/app.component.html` | sidenav 在 character mode 顯示 character-panel；autocomplete 新增人物分組 |

---

## Phase 1：套件與型別

### Task 1：安裝 leaflet-polylinedecorator 並建立 type declaration

**Files:**
- Modify: `webapp/package.json`
- Create: `webapp/src/types/leaflet-polylinedecorator.d.ts`
- Modify (如需要): `webapp/tsconfig.app.json`

- [ ] **Step 1：在 webapp 安裝套件**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npm install leaflet-polylinedecorator@1.6.0
```

Expected：`package.json` 中 `dependencies` 出現 `"leaflet-polylinedecorator": "^1.6.0"`，無 peer dependency 警告。

- [ ] **Step 2：建立 type declaration 檔案**

```bash
mkdir -p /home/kevin/Documents/RCodes/jymap/webapp/src/types
```

寫入 `webapp/src/types/leaflet-polylinedecorator.d.ts`：

```typescript
import * as L from 'leaflet';

declare module 'leaflet' {
  interface PolylineDecoratorOptions {
    patterns: Array<{
      offset?: number | string;
      endOffset?: number | string;
      repeat: number | string;
      symbol: any;
    }>;
  }

  function polylineDecorator(
    paths: L.Polyline | L.Polyline[],
    options?: PolylineDecoratorOptions
  ): L.Layer;

  namespace Symbol {
    function arrowHead(options?: {
      pixelSize?: number;
      polygon?: boolean;
      pathOptions?: L.PathOptions;
    }): any;
    function dash(options?: any): any;
    function marker(options?: any): any;
  }
}

declare module 'leaflet-polylinedecorator';
```

- [ ] **Step 3：確認 tsconfig 將 src/types 納入編譯範圍**

讀取 `webapp/tsconfig.app.json`，若 `include` 已涵蓋 `src/**/*.ts` 則無需修改；若僅 `src/main.ts` 等具體路徑，將 `src/types/*.d.ts` 加入 `files` 或調整 `include`。

- [ ] **Step 4：驗證套件可以 import**

於 `webapp` 目錄執行：

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npx tsc --noEmit
```

Expected：無錯誤輸出。

- [ ] **Step 5：commit**

```bash
git add webapp/package.json webapp/package-lock.json webapp/src/types/leaflet-polylinedecorator.d.ts webapp/tsconfig.app.json
git commit -m "chore(webapp): 新增 leaflet-polylinedecorator 與 TypeScript 型別宣告"
```

---

## Phase 2：NgRx Actions

### Task 2：新增 selectCharacter / clearSelectedCharacter actions

**Files:**
- Modify: `webapp/src/app/core/state/time-map.actions.ts`

- [ ] **Step 1：在 time-map.actions.ts 末尾新增 actions**

在檔案最後（既有 `clearSelectedEvent` action 之後）加入：

```typescript
// 進入人物模式（選定某人物，觸發軌跡與年表呈現）
export const selectCharacter = createAction(
  '[TimeMap] Select Character',
  props<{ character: string }>()
);

// 退出人物模式（還原進入前的 timeRange / selectedNovel snapshot）
export const clearSelectedCharacter = createAction('[TimeMap] Clear Selected Character');
```

- [ ] **Step 2：型別檢查**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npx tsc --noEmit
```

Expected：無錯誤。

- [ ] **Step 3：commit**

```bash
git add webapp/src/app/core/state/time-map.actions.ts
git commit -m "feat(state): 新增 selectCharacter / clearSelectedCharacter actions"
```

---

## Phase 3：Reducer（TDD）

### Task 3：擴展 TimeMapState 介面與 initialState

**Files:**
- Modify: `webapp/src/app/core/state/time-map.reducer.ts`

- [ ] **Step 1：在 TimeMapState 介面新增三個欄位**

修改 `TimeMapState` 介面（位於 line 15-35），在 `validationStats` 之前加入：

```typescript
  selectedCharacter: string | null;
  selectedCharacterVersion: number;
  preCharacterSnapshot: {
    timeRange: TimeRange | null;
    selectedNovel: string | null;
  } | null;
```

- [ ] **Step 2：在 initialTimeMapState 補上初始值**

修改 `initialTimeMapState`（line 37-53），在 `validationStats: null` 之前加入：

```typescript
  selectedCharacter: null,
  selectedCharacterVersion: 0,
  preCharacterSnapshot: null,
```

- [ ] **Step 3：型別檢查**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npx tsc --noEmit
```

Expected：無錯誤。

- [ ] **Step 4：commit**

```bash
git add webapp/src/app/core/state/time-map.reducer.ts
git commit -m "feat(state): TimeMapState 新增 selectedCharacter / snapshot 欄位"
```

---

### Task 4：撰寫 selectCharacter reducer 的失敗測試

**Files:**
- Create: `webapp/src/app/core/state/time-map.reducer.spec.ts`

- [ ] **Step 1：建立測試檔案，覆蓋 5 個案例**

寫入 `webapp/src/app/core/state/time-map.reducer.spec.ts`：

```typescript
import { timeMapReducer, initialTimeMapState, TimeMapState } from './time-map.reducer';
import * as TimeMapActions from './time-map.actions';
import { ValidatedEvent } from '../utils/data-validator';

function makeEvent(overrides: Partial<ValidatedEvent>): ValidatedEvent {
  return {
    id: 'e1',
    title: 't',
    dynasty: '南宋',
    year: 1200,
    lat: 30,
    lng: 110,
    novel: '射鵰英雄傳',
    characters: [],
    sources: [],
    tags: [],
    description: '',
    summary: '',
    validationStatus: 'valid'
  } as ValidatedEvent;
}

describe('timeMapReducer - character mode', () => {
  const guoJing1 = makeEvent({ id: 'e1', year: 1199, characters: ['郭靖'] });
  const guoJing2 = makeEvent({ id: 'e2', year: 1250, characters: ['郭靖', '黃蓉'] });
  const yangGuo = makeEvent({ id: 'e3', year: 1260, characters: ['楊過'] });

  function stateWithEvents(extra: Partial<TimeMapState> = {}): TimeMapState {
    return {
      ...initialTimeMapState,
      events: [guoJing1, guoJing2, yangGuo],
      visibleEvents: [guoJing1, guoJing2, yangGuo],
      ...extra
    };
  }

  describe('selectCharacter', () => {
    it('保存當前 timeRange/novel 為 snapshot', () => {
      const before = stateWithEvents({
        currentTimeRange: { startYear: 1000, endYear: 1300 },
        selectedNovel: '神鵰俠侶'
      });
      const next = timeMapReducer(before, TimeMapActions.selectCharacter({ character: '郭靖' }));
      expect(next.preCharacterSnapshot).toEqual({
        timeRange: { startYear: 1000, endYear: 1300 },
        selectedNovel: '神鵰俠侶'
      });
    });

    it('擴展 timeRange 至人物活躍期 ±20 年', () => {
      const next = timeMapReducer(
        stateWithEvents(),
        TimeMapActions.selectCharacter({ character: '郭靖' })
      );
      expect(next.currentTimeRange).toEqual({ startYear: 1199 - 20, endYear: 1250 + 20 });
    });

    it('清空 selectedNovel 與 selectedEventId', () => {
      const before = stateWithEvents({ selectedNovel: '射鵰英雄傳', selectedEventId: 'e1' });
      const next = timeMapReducer(before, TimeMapActions.selectCharacter({ character: '郭靖' }));
      expect(next.selectedNovel).toBeNull();
      expect(next.selectedEventId).toBeNull();
    });

    it('設定 selectedCharacter 並遞增 version', () => {
      const next = timeMapReducer(
        stateWithEvents(),
        TimeMapActions.selectCharacter({ character: '郭靖' })
      );
      expect(next.selectedCharacter).toBe('郭靖');
      expect(next.selectedCharacterVersion).toBe(1);
    });

    it('連續切換人物：snapshot 不被覆蓋', () => {
      const before = stateWithEvents({
        currentTimeRange: { startYear: 1000, endYear: 1300 },
        selectedNovel: '神鵰俠侶'
      });
      const after1 = timeMapReducer(before, TimeMapActions.selectCharacter({ character: '郭靖' }));
      const after2 = timeMapReducer(after1, TimeMapActions.selectCharacter({ character: '楊過' }));
      expect(after2.preCharacterSnapshot).toEqual({
        timeRange: { startYear: 1000, endYear: 1300 },
        selectedNovel: '神鵰俠侶'
      });
      expect(after2.selectedCharacter).toBe('楊過');
    });

    it('空字串 character 不改變 state', () => {
      const before = stateWithEvents();
      const next = timeMapReducer(before, TimeMapActions.selectCharacter({ character: '  ' }));
      expect(next).toBe(before);
    });

    it('該人物 0 筆事件：不改變 state', () => {
      const before = stateWithEvents();
      const next = timeMapReducer(before, TimeMapActions.selectCharacter({ character: '不存在' }));
      expect(next).toBe(before);
    });

    it('visibleEvents 依新 range 重算（且不再套用 novel filter）', () => {
      const before = stateWithEvents({
        currentTimeRange: { startYear: 1000, endYear: 1100 },
        selectedNovel: '神鵰俠侶'
      });
      const next = timeMapReducer(before, TimeMapActions.selectCharacter({ character: '郭靖' }));
      const ids = next.visibleEvents.map(e => e.id).sort();
      expect(ids).toEqual(['e1', 'e2']);
    });
  });
});
```

- [ ] **Step 2：跑測試確認全部失敗（because reducer 還沒處理 action）**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npx ng test --watch=false --include='**/time-map.reducer.spec.ts'
```

Expected：8 個 spec 全部 FAIL，失敗訊息類似「Expected initialTimeMapState … to equal …」或 selectedCharacter 仍為 null。

---

### Task 5：實作 selectCharacter reducer

**Files:**
- Modify: `webapp/src/app/core/state/time-map.reducer.ts`

- [ ] **Step 1：在 reducer 末尾（`clearSelectedEvent` 之後）新增 handler**

在 `on(TimeMapActions.clearSelectedEvent, ...)` 之後、`);` 之前，插入：

```typescript
,

  // 進入人物模式
  on(TimeMapActions.selectCharacter, (state, { character }) => {
    const name = (character || '').trim();
    if (name === '') {
      return state;
    }

    const charEvents = state.events.filter(e => e.characters.includes(name));
    if (charEvents.length === 0) {
      return state;
    }

    const years = charEvents.map(e => e.year).sort((a, b) => a - b);
    const startYear = years[0] - 20;
    const endYear = years[years.length - 1] + 20;
    const newRange: TimeRange = { startYear, endYear };

    const snapshot = state.preCharacterSnapshot ?? {
      timeRange: state.currentTimeRange,
      selectedNovel: state.selectedNovel
    };

    return {
      ...state,
      preCharacterSnapshot: snapshot,
      currentTimeRange: newRange,
      selectedNovel: null,
      selectedEventId: null,
      selectedCharacter: name,
      selectedCharacterVersion: state.selectedCharacterVersion + 1,
      visibleEvents: applyFilters(state.events, newRange, null)
    };
  })
```

- [ ] **Step 2：跑測試確認 8 個都通過**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npx ng test --watch=false --include='**/time-map.reducer.spec.ts'
```

Expected：8 specs PASS。

- [ ] **Step 3：commit**

```bash
git add webapp/src/app/core/state/time-map.reducer.ts webapp/src/app/core/state/time-map.reducer.spec.ts
git commit -m "feat(state): selectCharacter reducer 與單元測試"
```

---

### Task 6：撰寫 clearSelectedCharacter 失敗測試

**Files:**
- Modify: `webapp/src/app/core/state/time-map.reducer.spec.ts`

- [ ] **Step 1：在 spec 內 `describe('timeMapReducer - character mode', ...)` 底下新增 describe block**

於 `describe('selectCharacter', ...)` 結束之後（仍在父 describe 內）加入：

```typescript
  describe('clearSelectedCharacter', () => {
    it('還原 snapshot 中的 timeRange 與 selectedNovel', () => {
      const inCharMode: TimeMapState = {
        ...stateWithEvents(),
        selectedCharacter: '郭靖',
        selectedCharacterVersion: 1,
        currentTimeRange: { startYear: 1179, endYear: 1270 },
        selectedNovel: null,
        preCharacterSnapshot: {
          timeRange: { startYear: 1000, endYear: 1300 },
          selectedNovel: '神鵰俠侶'
        }
      };
      const next = timeMapReducer(inCharMode, TimeMapActions.clearSelectedCharacter());
      expect(next.currentTimeRange).toEqual({ startYear: 1000, endYear: 1300 });
      expect(next.selectedNovel).toBe('神鵰俠侶');
      expect(next.selectedCharacter).toBeNull();
      expect(next.preCharacterSnapshot).toBeNull();
    });

    it('snapshot 為 null 時退化為清空 timeRange 與 novel', () => {
      const noSnapshot: TimeMapState = {
        ...stateWithEvents(),
        selectedCharacter: '郭靖',
        currentTimeRange: { startYear: 1179, endYear: 1270 },
        preCharacterSnapshot: null
      };
      const next = timeMapReducer(noSnapshot, TimeMapActions.clearSelectedCharacter());
      expect(next.currentTimeRange).toBeNull();
      expect(next.selectedNovel).toBeNull();
      expect(next.selectedCharacter).toBeNull();
    });

    it('visibleEvents 依還原後的 range 與 novel 重算', () => {
      const inCharMode: TimeMapState = {
        ...stateWithEvents(),
        selectedCharacter: '郭靖',
        currentTimeRange: { startYear: 1179, endYear: 1270 },
        preCharacterSnapshot: {
          timeRange: { startYear: 1255, endYear: 1300 },
          selectedNovel: null
        }
      };
      const next = timeMapReducer(inCharMode, TimeMapActions.clearSelectedCharacter());
      const ids = next.visibleEvents.map(e => e.id).sort();
      expect(ids).toEqual(['e3']);
    });
  });
```

- [ ] **Step 2：跑測試確認 3 個失敗**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npx ng test --watch=false --include='**/time-map.reducer.spec.ts'
```

Expected：原本 8 個仍 PASS，新增 3 個 FAIL（找不到 handler，state 沒變）。

---

### Task 7：實作 clearSelectedCharacter reducer

**Files:**
- Modify: `webapp/src/app/core/state/time-map.reducer.ts`

- [ ] **Step 1：在 `selectCharacter` handler 之後新增**

```typescript
,

  // 退出人物模式
  on(TimeMapActions.clearSelectedCharacter, (state) => {
    const snapshot = state.preCharacterSnapshot;
    const restoredRange = snapshot?.timeRange ?? null;
    const restoredNovel = snapshot?.selectedNovel ?? null;

    return {
      ...state,
      selectedCharacter: null,
      preCharacterSnapshot: null,
      currentTimeRange: restoredRange,
      selectedNovel: restoredNovel,
      visibleEvents: applyFilters(state.events, restoredRange, restoredNovel)
    };
  })
```

- [ ] **Step 2：跑測試確認 11 個全部通過**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npx ng test --watch=false --include='**/time-map.reducer.spec.ts'
```

Expected：11 specs PASS。

- [ ] **Step 3：commit**

```bash
git add webapp/src/app/core/state/time-map.reducer.ts webapp/src/app/core/state/time-map.reducer.spec.ts
git commit -m "feat(state): clearSelectedCharacter reducer 與還原 snapshot 測試"
```

---

### Task 8：撰寫 selectEvent / setNovelFilter 自動退出測試（失敗）

**Files:**
- Modify: `webapp/src/app/core/state/time-map.reducer.spec.ts`

- [ ] **Step 1：在父 describe 內最後新增 describe block**

```typescript
  describe('selectEvent in character mode auto-exits', () => {
    it('selectEvent 時若處於人物模式：還原 snapshot 並選中事件', () => {
      const inCharMode: TimeMapState = {
        ...stateWithEvents(),
        selectedCharacter: '郭靖',
        selectedCharacterVersion: 1,
        currentTimeRange: { startYear: 1179, endYear: 1270 },
        preCharacterSnapshot: {
          timeRange: { startYear: 1000, endYear: 1300 },
          selectedNovel: '神鵰俠侶'
        }
      };
      const next = timeMapReducer(inCharMode, TimeMapActions.selectEvent({ eventId: 'e3' }));
      expect(next.selectedCharacter).toBeNull();
      expect(next.preCharacterSnapshot).toBeNull();
      expect(next.currentTimeRange).toEqual({ startYear: 1000, endYear: 1300 });
      expect(next.selectedNovel).toBe('神鵰俠侶');
      expect(next.selectedEventId).toBe('e3');
    });

    it('setNovelFilter 時若處於人物模式：先還原 snapshot 再套用 novel filter', () => {
      const inCharMode: TimeMapState = {
        ...stateWithEvents(),
        selectedCharacter: '郭靖',
        selectedCharacterVersion: 1,
        currentTimeRange: { startYear: 1179, endYear: 1270 },
        preCharacterSnapshot: {
          timeRange: { startYear: 1000, endYear: 1300 },
          selectedNovel: null
        }
      };
      const next = timeMapReducer(
        inCharMode,
        TimeMapActions.setNovelFilter({ novel: '神鵰俠侶' })
      );
      expect(next.selectedCharacter).toBeNull();
      expect(next.preCharacterSnapshot).toBeNull();
      expect(next.currentTimeRange).toEqual({ startYear: 1000, endYear: 1300 });
      expect(next.selectedNovel).toBe('神鵰俠侶');
    });

    it('非人物模式時 selectEvent 保持原行為', () => {
      const normal: TimeMapState = {
        ...stateWithEvents(),
        currentTimeRange: { startYear: 1000, endYear: 1300 }
      };
      const next = timeMapReducer(normal, TimeMapActions.selectEvent({ eventId: 'e1' }));
      expect(next.currentTimeRange).toEqual({ startYear: 1000, endYear: 1300 });
      expect(next.selectedEventId).toBe('e1');
    });
  });
```

- [ ] **Step 2：跑測試確認 3 個 FAIL（前兩個失敗、第三個 PASS）**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npx ng test --watch=false --include='**/time-map.reducer.spec.ts'
```

Expected：2 個新測試 FAIL（因 selectEvent 還沒擴展行為）；舊測試與第三個新測試 PASS。

---

### Task 9：擴展既有 selectEvent 與 setNovelFilter handler

**Files:**
- Modify: `webapp/src/app/core/state/time-map.reducer.ts`

- [ ] **Step 1：用以下程式碼取代既有 `selectEvent` handler**

找到 line 136-140：

```typescript
  on(TimeMapActions.selectEvent, (state, { eventId }) => ({
    ...state,
    selectedEventId: eventId,
    selectedEventVersion: state.selectedEventVersion + 1
  })),
```

替換為：

```typescript
  on(TimeMapActions.selectEvent, (state, { eventId }) => {
    if (state.selectedCharacter !== null) {
      const snapshot = state.preCharacterSnapshot;
      const restoredRange = snapshot?.timeRange ?? null;
      const restoredNovel = snapshot?.selectedNovel ?? null;
      return {
        ...state,
        selectedCharacter: null,
        preCharacterSnapshot: null,
        currentTimeRange: restoredRange,
        selectedNovel: restoredNovel,
        visibleEvents: applyFilters(state.events, restoredRange, restoredNovel),
        selectedEventId: eventId,
        selectedEventVersion: state.selectedEventVersion + 1
      };
    }
    return {
      ...state,
      selectedEventId: eventId,
      selectedEventVersion: state.selectedEventVersion + 1
    };
  }),
```

- [ ] **Step 2：用以下程式碼取代既有 `setNovelFilter` handler**

找到 line 122-127：

```typescript
  on(TimeMapActions.setNovelFilter, (state, { novel }) => ({
    ...state,
    selectedNovel: novel,
    visibleEvents: applyFilters(state.events, state.currentTimeRange, novel)
  })),
```

替換為：

```typescript
  on(TimeMapActions.setNovelFilter, (state, { novel }) => {
    if (state.selectedCharacter !== null) {
      const snapshot = state.preCharacterSnapshot;
      const restoredRange = snapshot?.timeRange ?? null;
      return {
        ...state,
        selectedCharacter: null,
        preCharacterSnapshot: null,
        currentTimeRange: restoredRange,
        selectedNovel: novel,
        visibleEvents: applyFilters(state.events, restoredRange, novel)
      };
    }
    return {
      ...state,
      selectedNovel: novel,
      visibleEvents: applyFilters(state.events, state.currentTimeRange, novel)
    };
  }),
```

- [ ] **Step 3：跑測試確認 14 個全部 PASS**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npx ng test --watch=false --include='**/time-map.reducer.spec.ts'
```

Expected：14 specs PASS。

- [ ] **Step 4：commit**

```bash
git add webapp/src/app/core/state/time-map.reducer.ts webapp/src/app/core/state/time-map.reducer.spec.ts
git commit -m "feat(state): 人物模式下 selectEvent / setNovelFilter 自動還原 snapshot"
```

---

## Phase 4：Selectors（TDD）

### Task 10：撰寫 selectors 失敗測試

**Files:**
- Create: `webapp/src/app/core/state/time-map.selectors.spec.ts`

- [ ] **Step 1：建立測試檔**

寫入 `webapp/src/app/core/state/time-map.selectors.spec.ts`：

```typescript
import * as Selectors from './time-map.selectors';
import { TimeMapState, initialTimeMapState } from './time-map.reducer';
import { ValidatedEvent } from '../utils/data-validator';
import { AppState } from './app.state';

function makeEvent(p: Partial<ValidatedEvent>): ValidatedEvent {
  return {
    id: 'e',
    title: 't',
    dynasty: '南宋',
    year: 1200,
    lat: 30,
    lng: 110,
    novel: '射鵰英雄傳',
    characters: [],
    sources: [],
    tags: [],
    description: '',
    summary: '',
    validationStatus: 'valid',
    ...p
  } as ValidatedEvent;
}

describe('character-mode selectors', () => {
  const events: ValidatedEvent[] = [
    makeEvent({ id: 'a', year: 1199, lat: 40, lng: 110, characters: ['郭靖'], novel: '射鵰英雄傳' }),
    makeEvent({ id: 'b', year: 1250, lat: 30, lng: 120, characters: ['郭靖', '黃蓉'], novel: '射鵰英雄傳' }),
    makeEvent({ id: 'c', year: 1260, lat: 25, lng: 115, characters: ['郭靖'], novel: '神鵰俠侶' }),
    makeEvent({ id: 'd', year: 1265, lat: NaN, lng: 100, characters: ['郭靖'], novel: '神鵰俠侶', validationStatus: 'invalid-coordinates' }),
    makeEvent({ id: 'e', year: 1100, lat: 35, lng: 110, characters: ['楊過'], novel: '神鵰俠侶' })
  ];

  function makeState(over: Partial<TimeMapState> = {}): AppState {
    return {
      timeMap: { ...initialTimeMapState, events, ...over }
    };
  }

  describe('selectSelectedCharacter / selectIsCharacterMode', () => {
    it('character null → 非人物模式', () => {
      expect(Selectors.selectSelectedCharacter(makeState())).toBeNull();
      expect(Selectors.selectIsCharacterMode(makeState())).toBe(false);
    });

    it('character 設定 → 人物模式', () => {
      const s = makeState({ selectedCharacter: '郭靖' });
      expect(Selectors.selectSelectedCharacter(s)).toBe('郭靖');
      expect(Selectors.selectIsCharacterMode(s)).toBe(true);
    });
  });

  describe('selectCharacterEvents', () => {
    it('未進入人物模式時回傳空陣列', () => {
      expect(Selectors.selectCharacterEvents.projector(events, null)).toEqual([]);
    });

    it('過濾並依年份升冪', () => {
      const got = Selectors.selectCharacterEvents.projector(events, '郭靖');
      expect(got.map(e => e.id)).toEqual(['a', 'b', 'c', 'd']);
    });
  });

  describe('selectCharacterTrajectory', () => {
    it('未進入人物模式時回傳空陣列', () => {
      expect(Selectors.selectCharacterTrajectory.projector([])).toEqual([]);
    });

    it('過濾 invalid 並回傳 [lat,lng][]', () => {
      const charEvents = Selectors.selectCharacterEvents.projector(events, '郭靖');
      const traj = Selectors.selectCharacterTrajectory.projector(charEvents);
      expect(traj).toEqual([[40, 110], [30, 120], [25, 115]]);
    });
  });

  describe('selectCharacterNovels', () => {
    it('unique 並排序', () => {
      const charEvents = Selectors.selectCharacterEvents.projector(events, '郭靖');
      const novels = Selectors.selectCharacterNovels.projector(charEvents);
      expect(novels).toEqual(['射鵰英雄傳', '神鵰俠侶']);
    });
  });

  describe('selectCharacterDominantNovel', () => {
    it('回傳出現次數最多的小說', () => {
      const charEvents = Selectors.selectCharacterEvents.projector(events, '郭靖');
      expect(Selectors.selectCharacterDominantNovel.projector(charEvents)).toBe('射鵰英雄傳');
    });

    it('並列時取年份最早事件的小說（deterministic）', () => {
      const tied: ValidatedEvent[] = [
        makeEvent({ id: 'x', year: 1100, novel: '神鵰俠侶' }),
        makeEvent({ id: 'y', year: 1200, novel: '射鵰英雄傳' })
      ];
      expect(Selectors.selectCharacterDominantNovel.projector(tied)).toBe('神鵰俠侶');
    });

    it('空輸入回傳 null', () => {
      expect(Selectors.selectCharacterDominantNovel.projector([])).toBeNull();
    });
  });

  describe('selectAllCharacters', () => {
    it('蒐集所有事件的人物去重排序', () => {
      const list = Selectors.selectAllCharacters.projector(events);
      expect(list).toEqual(['楊過', '郭靖', '黃蓉'].sort((a, b) => a.localeCompare(b, 'zh-Hant')));
    });
  });
});
```

- [ ] **Step 2：跑測試確認失敗**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npx ng test --watch=false --include='**/time-map.selectors.spec.ts'
```

Expected：每個 spec 都因 `Selectors.xxx is undefined` 或編譯錯誤而 FAIL。

---

### Task 11：實作 character selectors

**Files:**
- Modify: `webapp/src/app/core/state/time-map.selectors.ts`

- [ ] **Step 1：在檔案末尾（既有 `selectSelectedEvent` 之後）新增**

```typescript

export const selectSelectedCharacter = createSelector(
  selectTimeMapState,
  (state) => state.selectedCharacter
);

export const selectSelectedCharacterVersion = createSelector(
  selectTimeMapState,
  (state) => state.selectedCharacterVersion
);

export const selectIsCharacterMode = createSelector(
  selectSelectedCharacter,
  (c) => c !== null
);

export const selectCharacterEvents = createSelector(
  selectAllEvents,
  selectSelectedCharacter,
  (events, character) => {
    if (!character) return [] as typeof events;
    return events
      .filter((e) => e.characters.includes(character))
      .slice()
      .sort((a, b) => a.year - b.year);
  }
);

export const selectCharacterTrajectory = createSelector(
  selectCharacterEvents,
  (charEvents) => charEvents
    .filter((e) => e.validationStatus === 'valid'
      && !isNaN(e.lat) && !isNaN(e.lng)
      && e.lat >= -90 && e.lat <= 90
      && e.lng >= -180 && e.lng <= 180)
    .map((e) => [e.lat, e.lng] as [number, number])
);

export const selectCharacterNovels = createSelector(
  selectCharacterEvents,
  (charEvents) => Array.from(new Set(charEvents.map((e) => e.novel))).sort()
);

export const selectCharacterDominantNovel = createSelector(
  selectCharacterEvents,
  (charEvents) => {
    if (charEvents.length === 0) return null;
    const counts = new Map<string, number>();
    for (const e of charEvents) {
      counts.set(e.novel, (counts.get(e.novel) ?? 0) + 1);
    }
    let bestCount = -1;
    let bestNovel: string | null = null;
    // 並列時：取「最早出現該小說的事件」中最早年份的小說
    // 因為 charEvents 已依年份升冪，第一個達到最高 count 的小說即可
    for (const e of charEvents) {
      const c = counts.get(e.novel) ?? 0;
      if (c > bestCount) {
        bestCount = c;
        bestNovel = e.novel;
      }
    }
    return bestNovel;
  }
);

export const selectAllCharacters = createSelector(
  selectAllEvents,
  (events) => {
    const set = new Set<string>();
    for (const e of events) {
      for (const c of e.characters) {
        if (c && c.trim() !== '') set.add(c);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-Hant'));
  }
);
```

- [ ] **Step 2：跑測試**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npx ng test --watch=false --include='**/time-map.selectors.spec.ts'
```

Expected：11 specs PASS。

> 補充：`selectCharacterDominantNovel` 的「並列時取年份最早事件」邏輯，需要先驗證輸入 `charEvents` 已升冪排序。spec 內 `tied` 測試的 `id: x year:1100` 排在第一個，因此會先把 `神鵰俠侶` 設為 bestNovel；之後 `射鵰英雄傳` count 同為 1，**不會**超過 bestCount，故維持神鵰俠侶。測試與實作一致。

- [ ] **Step 3：commit**

```bash
git add webapp/src/app/core/state/time-map.selectors.ts webapp/src/app/core/state/time-map.selectors.spec.ts
git commit -m "feat(state): 新增人物模式 selectors（events/trajectory/novels/dominant）"
```

---

## Phase 5：EventCard 改造（人物 tag → button）

### Task 12：人物 tag 改為按鈕並發射 characterClick

**Files:**
- Modify: `webapp/src/app/features/event-detail/components/event-card.component.ts`
- Modify: `webapp/src/app/features/event-detail/components/event-card.component.html`
- Modify: `webapp/src/app/features/event-detail/components/event-card.component.scss`

- [ ] **Step 1：在 ts 內新增 Output 與 handler**

修改 `event-card.component.ts`。在 `@Output() navigateToEvent` 下方新增：

```typescript
  @Output() characterClick = new EventEmitter<string>();
```

並在 class 底部（`getYearText` 之後）加入：

```typescript
  onCharacterClick(name: string): void {
    this.characterClick.emit(name);
  }
```

- [ ] **Step 2：修改 html 模板**

把 line 28-30：

```html
      <div class="characters">
        <span class="tag" *ngFor="let c of event.characters">{{ c }}</span>
      </div>
```

替換為：

```html
      <div class="characters">
        <button type="button" class="tag tag-character"
                *ngFor="let c of event.characters"
                (click)="onCharacterClick(c)"
                [attr.aria-label]="'查看 ' + c + ' 的軌跡'">
          {{ c }}
        </button>
      </div>
```

- [ ] **Step 3：修改 scss 讓 button 看起來像舊 tag、新增 hover**

在 event-card.component.scss 的 `.tag { ... }` 區塊（line 121-128）替換為：

```scss
    .tag {
      background: #f0e8d8;
      border: 1px solid #d4c9b8;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.85rem;
      color: #4a3d32;
      font-family: inherit;
      cursor: default;

      &.tag-character {
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s, transform 0.1s;

        &:hover {
          background: #f3e0a8;
          border-color: #c8a427;
        }

        &:active {
          transform: scale(0.97);
        }

        &:focus-visible {
          outline: 2px solid #c8a427;
          outline-offset: 2px;
        }
      }
    }
```

- [ ] **Step 4：型別與 build 檢查**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npx tsc --noEmit
```

Expected：無錯誤。

- [ ] **Step 5：commit**

```bash
git add webapp/src/app/features/event-detail/components/event-card.component.ts \
        webapp/src/app/features/event-detail/components/event-card.component.html \
        webapp/src/app/features/event-detail/components/event-card.component.scss
git commit -m "feat(event-card): 人物 tag 改為可點擊按鈕並發射 characterClick"
```

---

## Phase 6：CharacterPanel 元件

### Task 13：建立 character-panel 組件骨架

**Files:**
- Create: `webapp/src/app/features/character-detail/components/character-panel.component.ts`
- Create: `webapp/src/app/features/character-detail/components/character-panel.component.html`
- Create: `webapp/src/app/features/character-detail/components/character-panel.component.scss`

- [ ] **Step 1：建立目錄**

```bash
mkdir -p /home/kevin/Documents/RCodes/jymap/webapp/src/app/features/character-detail/components
```

- [ ] **Step 2：寫入 character-panel.component.ts**

```typescript
import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { AppState } from '../../../core/state/app.state';
import * as TimeMapSelectors from '../../../core/state/time-map.selectors';
import * as TimeMapActions from '../../../core/state/time-map.actions';
import { ValidatedEvent } from '../../../core/utils/data-validator';

@Component({
  selector: 'app-character-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './character-panel.component.html',
  styleUrl: './character-panel.component.scss'
})
export class CharacterPanelComponent implements OnDestroy {
  @Output() close = new EventEmitter<void>();

  character$: Observable<string | null>;
  events$: Observable<ValidatedEvent[]>;
  novels$: Observable<string[]>;

  private destroy$ = new Subject<void>();

  constructor(private store: Store<AppState>) {
    this.character$ = this.store.select(TimeMapSelectors.selectSelectedCharacter);
    this.events$ = this.store.select(TimeMapSelectors.selectCharacterEvents);
    this.novels$ = this.store.select(TimeMapSelectors.selectCharacterNovels);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getYearText(year: number): string {
    return year < 0 ? `西元前${Math.abs(year)}年` : `西元${year}年`;
  }

  getActiveRangeText(events: ValidatedEvent[]): string {
    if (events.length === 0) return '—';
    const min = events[0].year;
    const max = events[events.length - 1].year;
    if (min === max) return this.getYearText(min);
    return `${this.getYearText(min)} ~ ${this.getYearText(max)}`;
  }

  getLocationCount(events: ValidatedEvent[]): number {
    const set = new Set<string>();
    for (const e of events) {
      if (e.validationStatus === 'valid' && !isNaN(e.lat) && !isNaN(e.lng)) {
        set.add(`${e.lat.toFixed(4)},${e.lng.toFixed(4)}`);
      }
    }
    return set.size;
  }

  onEventClick(event: ValidatedEvent): void {
    this.store.dispatch(TimeMapActions.selectEvent({ eventId: event.id }));
  }

  isInvalidCoordinate(event: ValidatedEvent): boolean {
    return event.validationStatus !== 'valid' || isNaN(event.lat) || isNaN(event.lng);
  }
}
```

- [ ] **Step 3：寫入 character-panel.component.html**

```html
<div class="character-panel" *ngIf="(character$ | async) as name">
  <div class="panel-header">
    <div class="header-left">
      <div class="header-label">追蹤中</div>
      <h3>{{ name }}</h3>
    </div>
    <button class="close-btn" (click)="close.emit()" aria-label="關閉人物面板">✕</button>
  </div>

  <ng-container *ngIf="(events$ | async) as events">
    <div class="panel-meta">
      <div class="meta-row">
        <span class="meta-label">出現於</span>
        <span class="meta-value">
          <span class="novel-chip" *ngFor="let n of (novels$ | async)">{{ n }}</span>
        </span>
      </div>
      <div class="meta-row">
        <span class="meta-label">活躍年代</span>
        <span class="meta-value">{{ getActiveRangeText(events) }}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">參與事件</span>
        <span class="meta-value">{{ events.length }} 起</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">地點數</span>
        <span class="meta-value">{{ getLocationCount(events) }}</span>
      </div>
    </div>

    <div class="panel-body">
      <h4 class="section-title">事件年表</h4>
      <div class="empty-hint" *ngIf="events.length === 0">無事件資料</div>
      <ol class="event-list">
        <li class="event-item"
            *ngFor="let e of events; let i = index"
            (click)="onEventClick(e)"
            [attr.aria-label]="'查看事件 ' + e.title">
          <span class="seq">{{ i + 1 }}</span>
          <div class="event-meta">
            <div class="event-title">
              {{ e.title }}
              <span class="invalid-flag" *ngIf="isInvalidCoordinate(e)" title="座標缺失">⚠</span>
            </div>
            <div class="event-sub">{{ e.dynasty }} · {{ getYearText(e.year) }} · {{ e.novel }}</div>
          </div>
        </li>
      </ol>
    </div>
  </ng-container>
</div>
```

- [ ] **Step 4：寫入 character-panel.component.scss**

```scss
.character-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #faf8f2;
  color: #3d3229;
  font-family: 'Noto Sans TC', sans-serif;
  border-left: 1px solid #d4c9b8;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background: linear-gradient(135deg, #f3e0a8, #e8dfcc);
  border-bottom: 2px solid #d4c9b8;

  .header-left { flex: 1; }

  .header-label {
    display: inline-block;
    background: #c8a427;
    color: #fff;
    font-size: 0.72rem;
    padding: 2px 10px;
    border-radius: 3px;
    margin-bottom: 8px;
    letter-spacing: 2px;
  }

  h3 {
    margin: 0;
    font-family: 'Noto Serif TC', serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #2c241b;
  }

  .close-btn {
    background: none;
    border: 1px solid #d4c9b8;
    color: #8b7355;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover { background: #d4c9b8; color: #2c241b; }
  }
}

.panel-meta {
  padding: 14px 20px;
  background: #f5f0e8;
  border-bottom: 1px solid #e0d8cc;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.88rem;

  .meta-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .meta-label {
    color: #8b7355;
    min-width: 64px;
  }

  .meta-value {
    color: #2c241b;
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .novel-chip {
    background: #f0e8d8;
    border: 1px solid #d4c9b8;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 0.78rem;
  }
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 24px;

  .section-title {
    margin: 0 0 12px;
    font-family: 'Noto Serif TC', serif;
    font-size: 1rem;
    font-weight: 600;
    color: #8b7355;
    border-left: 3px solid #c8a427;
    padding-left: 10px;
  }

  .empty-hint {
    color: #8b7355;
    font-size: 0.9rem;
    padding: 12px 0;
  }

  .event-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    counter-reset: event-counter;
  }

  .event-item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 10px 12px;
    background: #fcfbf9;
    border: 1px solid #e8e0d5;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: #f0e8d8;
      border-color: #c8a427;
      transform: translateX(2px);
    }

    .seq {
      flex: 0 0 24px;
      height: 24px;
      border-radius: 50%;
      background: #c8a427;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.78rem;
      font-weight: 600;
    }

    .event-meta { flex: 1; min-width: 0; }

    .event-title {
      font-weight: 600;
      color: #2c241b;
      margin-bottom: 2px;
      .invalid-flag { color: #b8860b; margin-left: 4px; }
    }

    .event-sub {
      font-size: 0.78rem;
      color: #8b7355;
    }
  }
}
```

- [ ] **Step 5：build 確認元件可編譯**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npx ng build --configuration development
```

Expected：build 成功（此時尚未在 AppComponent 引用，僅檔案級別檢查）。

- [ ] **Step 6：commit**

```bash
git add webapp/src/app/features/character-detail
git commit -m "feat(character-detail): 新增 character-panel 組件骨架"
```

---

## Phase 7：MapContainer 軌跡繪製

### Task 14：MapContainer 引入軌跡層、computeWeight、訂閱新狀態

**Files:**
- Modify: `webapp/src/app/features/map/components/map-container.component.ts`

- [ ] **Step 1：新增 imports**

在檔頂的 import 區（line 1-11）尾端加入：

```typescript
import 'leaflet-polylinedecorator';
```

- [ ] **Step 2：新增 component 屬性**

在 class body 中（與 `private markers` 同區）新增：

```typescript
  private trajectoryLayer: L.LayerGroup | null = null;
  private selectedCharacter: string | null = null;
  private currentTrajectoryColor: string = '#666666';
```

並把既有 `@Output() eventClick = new EventEmitter<ValidatedEvent>();` 之後加入：

```typescript
  @Output() characterClick = new EventEmitter<string>();
```

- [ ] **Step 3：在 constructor 內新增訂閱**

在 constructor 內既有 `selectSelectedNovel` 訂閱之後加入：

```typescript
    this.store.select(TimeMapSelectors.selectSelectedCharacter).pipe(
      takeUntil(this.destroy$)
    ).subscribe(name => {
      this.selectedCharacter = name;
      // 標記樣式重算（透過下次 visibleEvents 推送或這裡 refresh）
      this.refreshMarkerStyles();
    });

    this.store.select(TimeMapSelectors.selectCharacterDominantNovel).pipe(
      takeUntil(this.destroy$)
    ).subscribe(novel => {
      this.currentTrajectoryColor = novel ? this.getNovelColor(novel) : '#666666';
    });

    this.store.select(TimeMapSelectors.selectCharacterTrajectory).pipe(
      takeUntil(this.destroy$)
    ).subscribe(points => {
      this.drawTrajectory(points);
    });
```

- [ ] **Step 4：在 `initMap()` 最後（`this.map.invalidateSize` 之前）建立軌跡層**

於 `this.map.on('moveend', ...)` 之後加入：

```typescript
    this.trajectoryLayer = L.layerGroup().addTo(this.map);
```

- [ ] **Step 5：新增 `computeWeight()`、`refreshMarkerStyles()`、`drawTrajectory()`**

在 class 末尾（`highlightMarker` 之後）新增：

```typescript
  /**
   * 決定 marker 是否應 weighted（飽和顯示）。
   * 人物模式優先 → novel filter 次之 → 預設 weighted。
   */
  private computeWeight(event: ValidatedEvent): boolean {
    if (this.selectedCharacter) {
      return event.characters.includes(this.selectedCharacter);
    }
    if (this._selectedNovel) {
      return event.novel === this._selectedNovel;
    }
    return true;
  }

  /**
   * 重新計算所有 marker 樣式（不重建 marker，只換 icon）。
   * 處理「人物模式切換」這類 visibleEvents 沒變但 weight 需要更新的情境。
   */
  private refreshMarkerStyles(): void {
    if (!this.map || this.markers.length === 0) return;
    this.store.select(TimeMapSelectors.selectAllEvents).pipe(take(1)).subscribe(events => {
      const byId = new Map(events.map(e => [e.id, e]));
      this.markers.forEach(marker => {
        const eventId = (marker as any).eventId;
        const ev = byId.get(eventId);
        if (!ev) return;
        const weighted = this.computeWeight(ev);
        marker.setIcon(this.createInkStyleIcon(ev, weighted));
      });
    });
  }

  /**
   * 繪製人物軌跡（虛線 + 箭頭裝飾），points 少於 2 時清空圖層。
   */
  private drawTrajectory(points: Array<[number, number]>): void {
    if (!this.map || !this.trajectoryLayer) return;

    this.trajectoryLayer.clearLayers();

    if (points.length < 2) {
      if (points.length === 1) {
        this.map.flyTo(points[0], 7, { duration: 0.8 });
      }
      return;
    }

    const color = this.currentTrajectoryColor;

    const line = L.polyline(points, {
      color,
      weight: 3,
      opacity: 0.85,
      dashArray: '8 6',
      smoothFactor: 1
    });

    line.addTo(this.trajectoryLayer);

    try {
      const PD = (L as any).polylineDecorator;
      const SymbolNS = (L as any).Symbol;
      if (typeof PD !== 'function' || !SymbolNS?.arrowHead) {
        throw new Error('leaflet-polylinedecorator 未載入');
      }
      const arrows = PD(line, {
        patterns: [{
          offset: 25,
          repeat: 80,
          symbol: SymbolNS.arrowHead({
            pixelSize: 10,
            polygon: false,
            pathOptions: { color, weight: 2, opacity: 0.9 }
          })
        }]
      });
      arrows.addTo(this.trajectoryLayer);
    } catch (e) {
      Logger.warn('polylineDecorator 載入失敗，退化為純虛線:', e);
    }

    this.map.flyToBounds(line.getBounds(), {
      padding: [60, 60],
      maxZoom: 7,
      duration: 1.0
    });
  }
```

- [ ] **Step 6：替換 `createMarker` 內 `isWeighted` 計算**

找到 `createMarker()` line 246：

```typescript
    const isWeighted = !this.selectedNovel || this.selectedNovel === event.novel;
```

替換為：

```typescript
    const isWeighted = this.computeWeight(event);
```

- [ ] **Step 7：popup HTML 內新增人物快捷按鈕**

修改 `createMarker()` 內 `marker.bindPopup(...)` 部分（line 256-263）。替換為：

```typescript
    const characterLinks = event.characters
      .map(c => `<a class="popup-character" data-character="${encodeURIComponent(c)}" href="#">${c}</a>`)
      .join('、');

    marker.bindPopup(`
      <div class="marker-popup">
        <h3>${event.title}</h3>
        <p><strong>朝代：</strong>${event.dynasty}</p>
        <p><strong>年份：</strong>${event.year}</p>
        <p><strong>作品：</strong>${event.novel}</p>
        ${event.characters.length > 0 ? `<p><strong>人物：</strong>${characterLinks}</p>` : ''}
      </div>
    `);

    marker.on('popupopen', (ev: L.PopupEvent) => {
      const container = ev.popup.getElement();
      if (!container) return;
      const links = container.querySelectorAll('.popup-character');
      links.forEach((el) => {
        el.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          const raw = (el as HTMLElement).getAttribute('data-character') || '';
          const name = decodeURIComponent(raw);
          if (name) this.characterClick.emit(name);
        });
      });
    });
```

- [ ] **Step 8：build 與型別檢查**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npx tsc --noEmit
npx ng build --configuration development
```

Expected：兩者都成功。

- [ ] **Step 9：commit**

```bash
git add webapp/src/app/features/map/components/map-container.component.ts
git commit -m "feat(map): 軌跡折線與箭頭裝飾、人物模式 marker dim、popup 人物快捷"
```

---

## Phase 8：SearchBox 人物分組

### Task 15：app.component 顯示人物分組於 autocomplete

策略：人物清單由 `selectAllCharacters` 取得，autocomplete 下拉同時呈現「小說 / 人物」兩個分組。在 `app.component` 內統一處理（不更動 `SearchBoxComponent` 內部行為），保持與 `novel` 下拉一致的 UX 模式。

**Files:**
- Modify: `webapp/src/app/app.component.ts`
- Modify: `webapp/src/app/app.component.html`

- [ ] **Step 1：在 app.component.ts 新增 characters 屬性與訂閱**

把 line 49 `novels: string[] = [];` 後加入：

```typescript
  characters: string[] = [];
  selectedCharacter$!: Observable<string | null>;
```

在 `ngOnInit()` 內，於 `this.novels$` 訂閱之後加入：

```typescript
    this.store.select(TimeMapSelectors.selectAllCharacters).pipe(
      takeUntil(this.destroy$)
    ).subscribe(list => {
      this.characters = list;
    });

    this.selectedCharacter$ = this.store.select(TimeMapSelectors.selectSelectedCharacter);
```

- [ ] **Step 2：新增 handlers**

在 class 末尾加入：

```typescript
  onCharacterClick(name: string): void {
    if (!name) return;
    this.store.dispatch(TimeMapActions.selectCharacter({ character: name }));
    this.isSearchFocused = false;
    // 飛地圖與時間軸捲動由 selector 訂閱端各自處理
    this.store.select(TimeMapSelectors.selectCharacterEvents).pipe(take(1)).subscribe(events => {
      if (events.length === 0) return;
      const years = events.map(e => e.year);
      const mid = Math.round((Math.min(...years) + Math.max(...years)) / 2);
      if (this.timelineComponent) {
        setTimeout(() => this.timelineComponent.scrollToYear(mid), 100);
      }
    });
  }

  onCloseCharacterPanel(): void {
    this.store.dispatch(TimeMapActions.clearSelectedCharacter());
  }
```

- [ ] **Step 3：修改 autocomplete 下拉 html，新增人物分組**

在 `app.component.html` 找到「無關鍵字：顯示小說選擇列表」分支（line 34-54）。在 `</div>`（line 53 之前、`@for novel` 區塊之後）內，加入人物分組。將：

```html
                <div class="novel-dropdown">
                  <div class="novel-dropdown-header">選擇小說篩選</div>
                  <button
                    class="novel-option"
                    [class.active]="(selectedNovel$ | async) === null"
                    (click)="onNovelSelect(null)">
                    <span class="novel-icon">📚</span>
                    <span>所有小說（顯示全部）</span>
                  </button>
                  @for (novel of novels; track novel) {
                    <button
                      class="novel-option"
                      [class.active]="(selectedNovel$ | async) === novel"
                      (click)="onNovelSelect(novel)">
                      <span class="novel-icon">📖</span>
                      <span>{{ novel }}</span>
                    </button>
                  }
                </div>
```

替換為：

```html
                <div class="novel-dropdown">
                  <div class="novel-dropdown-header">選擇小說篩選</div>
                  <button
                    class="novel-option"
                    [class.active]="(selectedNovel$ | async) === null"
                    (click)="onNovelSelect(null)">
                    <span class="novel-icon">📚</span>
                    <span>所有小說（顯示全部）</span>
                  </button>
                  @for (novel of novels; track novel) {
                    <button
                      class="novel-option"
                      [class.active]="(selectedNovel$ | async) === novel"
                      (click)="onNovelSelect(novel)">
                      <span class="novel-icon">📖</span>
                      <span>{{ novel }}</span>
                    </button>
                  }

                  @if (characters.length > 0) {
                    <div class="novel-dropdown-header dropdown-section-divider">追蹤人物軌跡</div>
                    @for (c of characters; track c) {
                      <button
                        class="novel-option character-option"
                        [class.active]="(selectedCharacter$ | async) === c"
                        (click)="onCharacterClick(c)">
                        <span class="novel-icon">⛩️</span>
                        <span>{{ c }}</span>
                      </button>
                    }
                  }
                </div>
```

- [ ] **Step 4：補上對應 scss**

讀取 `webapp/src/app/app.component.scss` 找到 `.novel-dropdown-header` 樣式。若沒有 `.dropdown-section-divider`，在 `.novel-dropdown-header` 規則後新增：

```scss
.dropdown-section-divider {
  border-top: 1px solid #e0d8cc;
  margin-top: 6px;
  padding-top: 10px;
}

.character-option {
  .novel-icon { opacity: 0.85; }
}
```

如果找不到 `.novel-dropdown-header` 規則，搜尋 `.novel-dropdown` 並在它附近補上適當區塊。

- [ ] **Step 5：build 確認**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npx ng build --configuration development
```

Expected：成功，無 template 錯誤。

- [ ] **Step 6：commit**

```bash
git add webapp/src/app/app.component.ts webapp/src/app/app.component.html webapp/src/app/app.component.scss
git commit -m "feat(autocomplete): 下拉新增「追蹤人物軌跡」分組與 handler"
```

---

## Phase 9：AppComponent 整合 CharacterPanel

### Task 16：sidenav 在人物模式顯示 character-panel

**Files:**
- Modify: `webapp/src/app/app.component.ts`
- Modify: `webapp/src/app/app.component.html`

- [ ] **Step 1：在 app.component.ts imports 區加入元件**

在 line 13 之後加入：

```typescript
import { CharacterPanelComponent } from './features/character-detail/components/character-panel.component';
```

並把 line 23 `imports` 陣列中尾端 `EventCardComponent` 之後加入 `, CharacterPanelComponent`：

```typescript
  imports: [RouterOutlet, CommonModule, MatSidenavModule, MapContainerComponent, TimelineContainerComponent, SearchBoxComponent, SearchResultsComponent, EventCardComponent, CharacterPanelComponent],
```

- [ ] **Step 2：在 onMapEventClick 之後（或合適位置）新增 onPopupCharacterClick handler**

map-container 觸發 `characterClick` 後，AppComponent 需要直接複用 `onCharacterClick`。

修改 app.component.html，找到第 7-9 行的 `<app-map-container>`，加入 output binding：

```html
        <app-map-container [center]="[35.0, 105.0]" [zoom]="5.5"
          [selectedNovel]="(selectedNovel$ | async) || null"
          (eventClick)="onMapEventClick($event)"
          (characterClick)="onCharacterClick($event)">
        </app-map-container>
```

- [ ] **Step 3：把 event-card sidenav 區塊（line 83-90）改成依模式切換**

替換 mat-sidenav 區塊為：

```html
  <mat-sidenav class="event-card-sidenav" #eventSidenav position="end"
    [opened]="((selectedEvent$ | async) !== null) || ((selectedCharacter$ | async) !== null)"
    mode="over"
    (closed)="onSidenavClosed()">
    <ng-container *ngIf="(selectedCharacter$ | async) !== null; else eventCardTpl">
      <app-character-panel (close)="onCloseCharacterPanel()"></app-character-panel>
    </ng-container>
    <ng-template #eventCardTpl>
      <app-event-card [event]="selectedEvent$ | async"
                      (close)="onCloseEventCard()"
                      (navigateToEvent)="onNavigateToEvent($event)"
                      (characterClick)="onCharacterClick($event)">
      </app-event-card>
    </ng-template>
  </mat-sidenav>
```

- [ ] **Step 4：app.component.ts 新增 onSidenavClosed**

```typescript
  onSidenavClosed(): void {
    // sidenav 由使用者手勢關閉（例如 ESC、點擊遮罩）時：
    // 優先清空 character mode；否則清 event。
    this.store.select(TimeMapSelectors.selectSelectedCharacter).pipe(take(1)).subscribe(c => {
      if (c !== null) {
        this.store.dispatch(TimeMapActions.clearSelectedCharacter());
      } else {
        this.store.dispatch(TimeMapActions.clearSelectedEvent());
      }
    });
  }
```

並把舊 line 86 的 `(closed)="onCloseEventCard()"` 已在 Step 3 替換為 `onSidenavClosed()`，無需額外修改。

- [ ] **Step 5：build**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npx ng build --configuration development
```

Expected：成功。

- [ ] **Step 6：commit**

```bash
git add webapp/src/app/app.component.ts webapp/src/app/app.component.html
git commit -m "feat(app): sidenav 在人物模式顯示 character-panel、串接所有 characterClick 入口"
```

---

## Phase 10：手動驗收（golden path）

### Task 17：啟動 dev server 並完成手動驗收

**Files:** 無

- [ ] **Step 1：啟動 dev server**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npm start
```

Expected：終端機顯示 `Local: http://localhost:4200/` 且無編譯錯誤。

- [ ] **Step 2：開瀏覽器執行手動驗收清單**

依以下 5 項驗收，**每項都需確認 PASS**。如有失敗，回到對應 Phase 修正後重新驗收。

| 驗收項 | 操作 | 預期結果 |
|---|---|---|
| AC-1 EventCard 進入 | 點擊任一 marker → EventCard 內人物 tag「郭靖」 | 軌跡為虛線+箭頭（射鵰主色）；非郭靖事件 marker dim 至 0.4；時間軸自動拉到郭靖活躍期；CharacterPanel 顯示 |
| AC-2 切換人物 | 在郭靖模式下，用搜尋下拉選「楊過」 | snapshot 維持原始；軌跡換成楊過、地圖飛到新範圍；CharacterPanel 內容更新 |
| AC-3 人物模式內點事件 | 在郭靖模式下點地圖 marker | CharacterPanel 消失、EventCard 顯示該事件；軌跡清除；marker 恢復；timeRange 還原為進入前 |
| AC-4 X 退出 | 點 CharacterPanel 右上 ✕ | sidenav 收起；軌跡清除；marker 全亮回原樣；timeRange 還原 |
| AC-5 退化路徑 | 暫時改 trajectory 計算回傳空陣列（或選一個僅 1 筆事件的人物，如 `白阿繡`） | 不畫線、不出錯；地圖正常 |
| AC-6 popup 人物快捷 | 點 marker 開啟 popup → 點人物連結 | 進入人物模式（與 AC-1 等效） |
| AC-7 行動裝置 | DevTools 切到 iPhone 13 寬度 | sidenav 在窄螢幕底部全寬顯示，CharacterPanel 與 EventCard 都正常 |

- [ ] **Step 3：跑全部測試確認沒有 regression**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
npx ng test --watch=false
```

Expected：全部 PASS。

- [ ] **Step 4：手動驗收備註 commit（可選，僅在改動驗收過程發現的小問題時建立）**

若驗收一切正常則無需 commit；如有微調，依各任務的 commit message style 提交。

---

## 任務完成檢核（最後一步）

- [ ] 上述所有 Task 1–17 均完成
- [ ] `npx ng build` 通過
- [ ] `npx ng test --watch=false` 全部 PASS（包含 14 個 reducer 測試與 11 個 selector 測試）
- [ ] 7 項手動驗收 AC-1 ~ AC-7 全部 PASS

完成後可直接合併至 main（或依專案慣例開 PR）。

---

## 風險與緩解（提醒實作者）

- **`leaflet-polylinedecorator` 載入失敗：** 已用 try/catch 退化為純虛線
- **同一座標的多事件：** `polyline` 退化為單點，視覺 OK
- **`flyToBounds` zoom 過大：** 用 `maxZoom: 7` 限制
- **同名不同人：** 本期視為同人，列為已知限制
