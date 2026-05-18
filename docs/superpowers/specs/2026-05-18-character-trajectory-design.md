# 人物軌跡（Character Trajectory）功能設計

- **撰寫日期**：2026-05-18
- **狀態**：Design（待實作計畫）
- **對應 README 路線項目**：資料關聯與探索（地點/人物網路）—— 第一階段
- **作者**：Raybird × Claude（協作 brainstorming）

---

## 1. 背景與動機

jymap 目前已能瀏覽事件、按時間軸/小說篩選，但缺乏「以人物為主體」的探索視角。金庸宇宙最具戲劇張力的線索之一是**人物跨時代、跨地理的軌跡**——例如郭靖從蒙古大漠走到桃花島再到襄陽，或張三丰的百年活躍橫跨射鵰至倚天。

本功能新增「人物模式」：使用者選定一個人物後，地圖上以折線+箭頭呈現其參與事件的時間軌跡，側邊面板取代事件卡片顯示完整年表，時間軸自動拉到該人物活躍期。

## 2. 範圍

### 本期包含

- 三個進入點：EventCard 人物 tag、地圖 marker popup 人物快捷、搜尋框「人物」分類
- 「人物模式」：其他標記淡出、軌跡折線+箭頭裝飾、時間軸自動覆蓋至人物活躍期
- 跨小說軌跡（一人多書串成一條人生折線）
- 側邊「人物面板」取代 EventCard：人物名、出現小說、活躍年代、地點數、事件年表
- 退出機制：X 鈕、點擊另一事件、切換另一人物
- 進入/退出時的 timeRange + novelFilter 快照保存與還原

### 明確不在本期（YAGNI）

- 軌跡播放動畫（按 play 看人物移動）
- 多人物同時比較（同時畫多條軌跡）
- 人物關係網（force-directed graph）
- 人物生平描述文字（需要新增資料）
- URL deep linking
- 人物頭像 / 印章圖示

## 3. 設計取捨決議

| 取捨點 | 決議 | 理由 |
|---|---|---|
| 人物資料是否預處理 | **純 Selector 派生**（不存 character index） | 48 筆事件規模下 selector + memoization 足夠；events.json 為單一資料來源，零維護負擔 |
| 「淡出其他事件」實作 | **MapContainer 自管樣式**（複用既有 `isWeighted`） | reducer 不污染；既有 novel filter 的 dim 邏輯（0.4 opacity）可直接複用 |
| 進入時 timeRange/novelFilter 處理 | **保存快照，退出時還原** | 使用者不會失去進入前看到的世界，UX 連貫 |
| 跨小說 | **串成一條完整人生軌跡** | 最能體現「金庸宇宙跨代史詩」的主題 |
| 軌跡視覺 | **虛線 + 箭頭裝飾器** | 清楚表達時間流動方向，不擁擠 |
| 進入點 | **EventCard tag + 地圖 popup 快捷 + 搜尋分組** | 三個情境覆蓋：閱讀中、瀏覽中、明確查找 |

## 4. 架構

延伸現有單一 `timeMap` slice，不新增 feature module。複用 `selectedEventId / selectedEventVersion` 的設計模式。

### 4.1 TimeMapState 新增欄位

```ts
export interface TimeMapState {
  // ...既有欄位...
  selectedCharacter: string | null;
  selectedCharacterVersion: number;
  preCharacterSnapshot: {
    timeRange: TimeRange | null;
    selectedNovel: string | null;
  } | null;
}
```

### 4.2 新增 Actions

```ts
selectCharacter({ character: string })   // 進入人物模式
clearSelectedCharacter()                 // 退出人物模式
```

### 4.3 Reducer 邏輯

#### `selectCharacter`
1. 若 `preCharacterSnapshot === null`（首次進入），保存當前 `currentTimeRange` 與 `selectedNovel` 進 snapshot
2. 若 `preCharacterSnapshot !== null`（人物間切換），**不覆蓋** snapshot
3. 計算該人物活躍年代（events 中 `characters` 包含該名字的 min/max year），buffer ±20 年
4. `currentTimeRange ← { startYear, endYear }`
5. `selectedNovel ← null`（跨小說需求）
6. `selectedEventId ← null`
7. `selectedCharacter ← character`
8. `selectedCharacterVersion++`
9. `visibleEvents ← applyFilters(events, newRange, null)`
10. 防禦：`character.trim() === ''` 時直接 return state

#### `clearSelectedCharacter`
1. 從 `preCharacterSnapshot` 還原 `currentTimeRange` 與 `selectedNovel`（snapshot 為 null 時退化為清空）
2. `preCharacterSnapshot ← null`
3. `selectedCharacter ← null`
4. `visibleEvents ← applyFilters(events, restoredRange, restoredNovel)`

#### 既有 action 的擴展
- `selectEvent`：若 `selectedCharacter !== null`，先執行 `clearSelectedCharacter` 的還原邏輯，再選中事件（清乾淨後再做）
- `setNovelFilter`：若 `selectedCharacter !== null`，先還原 snapshot，再套用 novel filter（人物模式讓位給更明確的篩選意圖）

### 4.4 新增 Selectors

```ts
selectSelectedCharacter         // string | null
selectSelectedCharacterVersion  // number
selectCharacterEvents           // ValidatedEvent[]，依年份排序
selectCharacterTrajectory       // [lat, lng][]，依年份排序，過濾 invalid 座標
selectCharacterNovels           // string[]，unique 排序後小說名
selectIsCharacterMode           // boolean
```

所有 selector 透過 `createSelector` memoize，依賴 `selectedCharacter + events` 變化才重算。

## 5. 組件變動

### 5.1 新增：`features/character-detail/components/character-panel.component`

當 `selectedCharacter !== null` 時取代 EventCard 顯示於右側 sidenav。

**結構：**
- Header：✕ 關閉鈕 + 「追蹤中：{人物名}」
- Meta：出現於（小說列表）、活躍年代範圍、地點數、事件數
- Body：事件年表（依年份排序的 list，每項含序號、年份、事件標題、朝代、小說）

**互動：** 點擊年表項目 → dispatch `selectEvent({ eventId })`（觸發 reducer 內的自動退出邏輯）

**訂閱：** 不接 `@Input`，直接訂閱 `selectSelectedCharacter / selectCharacterEvents / selectCharacterNovels`，與現有 feature 組件模式一致。

### 5.2 修改：`event-card.component`

模板：人物 tag 由 `<span>` 改為 `<button>`：

```html
<button class="tag tag-character" *ngFor="let c of event.characters"
        (click)="onCharacterClick(c)">{{ c }}</button>
```

ts 新增：
```ts
@Output() characterClick = new EventEmitter<string>();
onCharacterClick(name: string): void {
  this.characterClick.emit(name);
}
```

### 5.3 修改：`map-container.component`

1. **訂閱新狀態：** `selectSelectedCharacter` 與 `selectCharacterTrajectory`
2. **dim 邏輯擴展：** `createMarker` 內 `isWeighted` 改為由綜合函數計算：
   ```ts
   private computeWeight(event: ValidatedEvent): boolean {
     // 人物模式優先：該人物參與的事件 → weighted
     if (this.selectedCharacter) {
       return event.characters.includes(this.selectedCharacter);
     }
     // 其次 novel filter
     if (this.selectedNovel) {
       return event.novel === this.selectedNovel;
     }
     return true;
   }
   ```
3. **新增 trajectory layer：** 一個 `L.layerGroup` 專門放軌跡折線與箭頭裝飾器
4. **軌跡顏色決策：** 依「該人物出現次數最多的小說」取色（並列時取年份最早事件的小說，確保 deterministic）；此邏輯放在新 selector `selectCharacterDominantNovel` 中
5. **軌跡繪製：**
   ```ts
   this.store.select(selectCharacterTrajectory).subscribe(points => {
     this.trajectoryLayer.clearLayers();
     if (points.length < 2) return;
     const color = this.getNovelColor(this.dominantNovel);
     const line = L.polyline(points, {
       color, weight: 3, opacity: 0.85,
       dashArray: '8 6', smoothFactor: 1
     });
     try {
       const arrows = (L as any).polylineDecorator(line, {
         patterns: [{
           offset: 25, repeat: 80,
           symbol: (L as any).Symbol.arrowHead({
             pixelSize: 10, polygon: false, pathOptions: { color, weight: 2 }
           })
         }]
       });
       line.addTo(this.trajectoryLayer);
       arrows.addTo(this.trajectoryLayer);
     } catch (e) {
       Logger.warn('polylineDecorator 載入失敗，退化為純虛線');
       line.addTo(this.trajectoryLayer);
     }
     this.map.flyToBounds(line.getBounds(), { padding: [60, 60], maxZoom: 7 });
   });
   ```
5. **marker popup 加快捷：** popup HTML 內 `event.characters` 改渲染為可點擊 `<a class="popup-character">`，bind click 事件冒泡到組件層 → 觸發 `characterClick` output

### 5.4 修改：`search-box.component`

Autocomplete 下拉新增「人物」分組：
- 來源：`selectAllEvents` 派生 `Set<character>`
- 與既有「事件」「小說」分類並列
- 選擇人物 → emit `characterSelect(name)` → AppComponent dispatch `selectCharacter`

### 5.5 修改：`app.component`

新增事件處理器：
```ts
onCharacterClick(name: string): void {
  this.store.dispatch(TimeMapActions.selectCharacter({ character: name }));
  // timeline 捲動到人物年代中段（依新 timeRange 計算）
}

onCloseCharacterPanel(): void {
  this.store.dispatch(TimeMapActions.clearSelectedCharacter());
}
```

模板：sidenav 內容依 `selectedCharacter$` 切換：
```html
<app-character-panel
  *ngIf="(selectedCharacter$ | async); else eventCardTpl"
  (close)="onCloseCharacterPanel()">
</app-character-panel>
<ng-template #eventCardTpl>
  <app-event-card ...></app-event-card>
</ng-template>
```

### 5.6 新引入第三方套件

- **`leaflet-polylinedecorator`**（~10 KB gzipped）：在 polyline 上畫箭頭裝飾。
  - 透過 npm 安裝，import 後自動 attach 到 `L` 命名空間
  - 與 Leaflet 1.9 相容
  - 載入失敗時優雅退化為純虛線

## 6. 互動流程

### 6.1 進入人物模式（從 EventCard）

```
使用者點擊 [郭靖] tag
   │ emit characterClick
   ▼
AppComponent.onCharacterClick('郭靖')
   │ dispatch selectCharacter
   ▼
Reducer
   │ snapshot ← 當前 timeRange / novelFilter
   │ filter events by character → min/max year
   │ currentTimeRange ← { startYear, endYear }
   │ selectedNovel ← null, selectedEventId ← null
   │ selectedCharacter ← '郭靖', version++
   │ visibleEvents 重算
   ▼
Selectors 重新發射
   ├─ CharacterPanel 顯示
   ├─ MapContainer 畫折線、dim 其他 markers
   └─ Timeline 自動拉到範圍
```

### 6.2 人物模式內點擊另一事件

```
點擊 marker
   ▼
dispatch selectEvent
   ▼
Reducer 偵測 selectedCharacter !== null
   │ 還原 snapshot
   │ snapshot ← null, selectedCharacter ← null
   │ selectedEventId ← eventId, version++
   ▼
UI：CharacterPanel 消失 → EventCard 顯示；軌跡清除；marker dim 解除
```

### 6.3 人物模式內切換另一人物

```
搜尋框選「楊過」
   ▼
dispatch selectCharacter('楊過')
   ▼
Reducer
   │ snapshot 已存在 → 保留（最原始狀態）
   │ 其餘流程同 6.1
   ▼
UI：人物面板內容換、軌跡重畫、地圖飛到楊過範圍
```

### 6.4 按 X 退出

```
dispatch clearSelectedCharacter
   ▼
Reducer 還原 snapshot
   ▼
UI：CharacterPanel 隱藏；軌跡清除；marker 恢復；timeline 還原
```

## 7. 邊界情況

| 情境 | 處理方式 |
|---|---|
| 人物只在 1 筆事件出現 | CharacterPanel 仍顯示；不畫折線（`points.length < 2`）；地圖 flyTo 該唯一座標 |
| 多事件年份相同 | 軌跡照畫；timeRange 縮窄至 ±5 年避免時間軸顯示崩潰 |
| 同人物事件座標完全相同 | polyline 退化單點，視覺 OK |
| 事件 `validationStatus !== 'valid'` 或座標 NaN | 軌跡計算過濾掉；CharacterPanel 年表仍列出並標示「⚠ 座標缺失」 |
| 人物名空字串 / whitespace | reducer 內 `character.trim() === ''` 直接 return state |
| 人物模式時搜尋並點事件結果 | 同 6.2：還原 snapshot、選中事件 |
| 人物模式時觸發 `setNovelFilter` | 先還原 snapshot，再套用 novel filter |
| URL deep linking | 本期不做 |
| 同名不同人 | 本期視為同一人 |
| `leaflet-polylinedecorator` 載入失敗 | try/catch 退化為純虛線 + Logger.warn |

## 8. 錯誤處理

- 沿用既有 `Logger` + `DataValidator` 模式，不引入新錯誤處理層
- CharacterPanel 在 `selectedCharacter === null` 時用 `*ngIf` 整個不渲染
- Reducer 內所有 events 過濾都用 immutable 操作
- snapshot 還原時 snapshot 為 null 退化為「清空 timeRange / 清空 novelFilter」

## 9. 測試策略

### 9.1 Reducer 單元測試（`time-map.reducer.spec.ts`）

- `selectCharacter`：snapshot 正確保存、timeRange 正確擴展、selectedNovel 清空
- `selectCharacter` 連續切換：snapshot 不被覆蓋
- `clearSelectedCharacter`：正確還原
- `selectEvent` 在人物模式下：還原 snapshot 後選中事件
- `setNovelFilter` 在人物模式下：還原 snapshot 後套用
- 每個過渡：`visibleEvents` 正確重算

### 9.2 Selector 單元測試（`time-map.selectors.spec.ts`）

- `selectCharacterEvents`：正確過濾、依年份排序
- `selectCharacterTrajectory`：跳過 invalid，回傳 `[lat, lng][]`
- `selectCharacterNovels`：unique + 排序
- memoization：相同輸入不重算

### 9.3 組件測試

- `CharacterPanel`：渲染、年表項目點擊觸發 `selectEvent` dispatch
- `EventCard`：人物 tag 點擊 emit `characterClick`
- `MapContainer`：聚焦於 unit-testable helper（`computeWeight`、軌跡顏色選擇）；Leaflet 整合改手動驗收

### 9.4 手動驗收（golden path）

1. 從 EventCard 點郭靖 → 軌跡正確、時間軸自動拉到 1199–1273、其他 marker 淡出
2. 人物模式內點楊過事件 → 切換到楊過軌跡（snapshot 仍是最原始狀態）
3. 按 X 退出 → 完全還原進入前的 timeRange 與 novelFilter
4. 搜尋框「人物」分組選黃蓉 → 軌跡正確繪製
5. 行動裝置：CharacterPanel 在窄螢幕底部全寬顯示

## 10. 風險與假設

- **假設**：events.json 中人物名稱已 unique enough（同名不同人極罕見）
- **風險**：`leaflet-polylinedecorator` 是社群套件，未來 Leaflet 升級時相容性需確認 → 已用 try/catch 緩解
- **風險**：人物參與事件多時，軌跡可能跨越大半個亞洲，`flyToBounds` 可能 zoom out 過大 → `maxZoom: 7` 限制視覺體驗
- **延伸**：本期完成後可考慮加入「地點時空疊影」（同一地點不同朝代的事件清單），複用本期建立的 snapshot/還原機制
