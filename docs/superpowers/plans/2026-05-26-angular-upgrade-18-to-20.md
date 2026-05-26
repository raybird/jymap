# Angular 18 → 20 升級實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 jymap webapp 從 Angular 18.2 逐步升級至 Angular 20，路徑為 18→19→20，每版以 `ng build` 驗證。

**Architecture:** 兩輪升級（18→19、19→20），每輪依序升三層（Angular core/cli → Material/CDK → NgRx），確保 migration schematics 按正確依賴順序執行。每層升完即 commit，方便追蹤與回退。維持 zone.js，不遷移 Zoneless。

**Tech Stack:** Angular CLI 19/20, @angular/core, @angular/material, @angular/cdk, @ngrx/store, @ngrx/effects, @ngrx/store-devtools, TypeScript 5.5→5.7+, zone.js

---

## 自動修改的檔案

以下檔案由 `ng update` migration schematics 自動修改，無需手動編輯（除非 `ng build` 後出現錯誤）：

- `webapp/package.json` — 套件版本號
- `webapp/package-lock.json` — 依賴鎖定
- `webapp/angular.json` — CLI 設定（如有遷移）
- `webapp/tsconfig.json` — TypeScript 版本（Angular 20 時自動升至 ~5.7.x）
- `webapp/src/app/app.config.ts` — 可能將 `provideAnimations` 遷移至 `provideAnimationsAsync`
- `webapp/src/**/*.ts` — schematic 自動修正的 deprecated API

---

## Phase 1：Angular 18 → 19

### Task 1：Layer 1 — Angular Core + CLI 升級至 v19

**Files:**
- Modify: `webapp/package.json`（自動）
- Modify: `webapp/package-lock.json`（自動）

- [ ] **Step 1：確認 git working tree 乾淨**

```bash
cd /home/kevin/Documents/RCodes/jymap/webapp
git status
```

預期輸出：`nothing to commit, working tree clean`

若有未 commit 的變更，先 commit 或 stash 再繼續。

- [ ] **Step 2：執行 Core + CLI 升級**

```bash
ng update @angular/core@19 @angular/cli@19
```

預期輸出（代表性格式）：
```
Using package manager: npm
Collecting installed dependencies...
  @angular/cli  18.2.21 -> 19.x.x
  @angular/core  18.2.x -> 19.x.x
** Executing migrations of package '@angular/core' **
  ✓  ...
✓ Packages successfully updated.
```

若出現 `peer dependency` 警告但升級完成，可繼續。

- [ ] **Step 3：Commit Layer 1**

```bash
git add -A
git commit -m "chore: upgrade Angular core + CLI to v19"
```

---

### Task 2：Layer 2 — Angular Material + CDK 升級至 v19

**Files:**
- Modify: `webapp/package.json`（自動）
- Modify: `webapp/src/app/app.config.ts`（schematic 可能修改）
- Modify: `webapp/src/**/*.ts`（schematic 自動修正 Material API）

- [ ] **Step 1：執行 Material + CDK 升級**

```bash
ng update @angular/material@19 @angular/cdk@19
```

預期輸出：
```
** Executing migrations of package '@angular/material' **
  ✓  Update Angular Material to v19.
✓ Packages successfully updated.
```

- [ ] **Step 2：Commit Layer 2**

```bash
git add -A
git commit -m "chore: upgrade Angular Material + CDK to v19"
```

---

### Task 3：Layer 3 — NgRx 升級至 v19

**Files:**
- Modify: `webapp/package.json`（自動）

- [ ] **Step 1：執行 NgRx 升級**

```bash
ng update @ngrx/store@19 @ngrx/effects@19 @ngrx/store-devtools@19
```

預期輸出：
```
** Executing migrations of package '@ngrx/store' **
  ✓  Update NgRx packages to v19.
✓ Packages successfully updated.
```

NgRx v19 新增 Signal Store API，但本專案使用傳統 Store（`provideStore`、`createReducer`、`createEffect`），不受影響，無需改任何 state 程式碼。

- [ ] **Step 2：Commit Layer 3**

```bash
git add -A
git commit -m "chore: upgrade NgRx to v19"
```

---

### Task 4：驗證 Angular 19 建置

**Files:**
- Modify: `webapp/src/app/app.config.ts`（若需修正 provideAnimations）

- [ ] **Step 1：執行建置驗證**

```bash
ng build
```

預期：建置成功，最後一行為 `Build at: ... - Time: ...ms`，無 `error TS` 輸出。

- [ ] **Step 2：若出現 `provideAnimations` deprecation 錯誤**

若 `ng build` 報錯 `provideAnimations is deprecated`（Angular 19 強制），修改 `webapp/src/app/app.config.ts`：

```typescript
// 修改前
import { provideAnimations } from '@angular/platform-browser/animations';

// 修改後
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
```

同時將 `providers` 陣列中的呼叫改為：

```typescript
// 修改前
provideAnimations(),

// 修改後
provideAnimationsAsync(),
```

完整修改後的 `app.config.ts` 頭部 import 區段：

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
```

- [ ] **Step 3：若有其他編譯錯誤，按錯誤訊息定位檔案與行號手動修正**

錯誤訊息格式為 `Error: src/app/xxx/yyy.ts:行號:欄號 - error TS2345: ...`，直接開啟對應檔案按提示修正。修正後重新執行 `ng build` 確認通過。

- [ ] **Step 4：若有手動修正，commit**

```bash
git add -A
git commit -m "fix: resolve Angular 19 build issues"
```

若 Step 1 的 `ng build` 直接成功，跳過 Step 2–4。

---

## Phase 2：Angular 19 → 20

### Task 5：Layer 1 — Angular Core + CLI 升級至 v20

**Files:**
- Modify: `webapp/package.json`（自動）
- Modify: `webapp/tsconfig.json`（TypeScript 自動升至 ~5.7.x）

- [ ] **Step 1：執行 Core + CLI 升級**

```bash
ng update @angular/core@20 @angular/cli@20
```

預期輸出：
```
** Executing migrations of package '@angular/core' **
  ✓  Update TypeScript to ~5.7.x
  ✓  ...
✓ Packages successfully updated.
```

`package.json` 中的 `"typescript": "~5.5.2"` 將自動升至 `"~5.7.x"`。

- [ ] **Step 2：Commit Layer 1**

```bash
git add -A
git commit -m "chore: upgrade Angular core + CLI to v20"
```

---

### Task 6：Layer 2 — Angular Material + CDK 升級至 v20

**Files:**
- Modify: `webapp/package.json`（自動）
- Modify: `webapp/src/**/*.ts`（schematic 自動修正）

- [ ] **Step 1：執行 Material + CDK 升級**

```bash
ng update @angular/material@20 @angular/cdk@20
```

預期輸出：
```
** Executing migrations of package '@angular/material' **
  ✓  Update Angular Material to v20.
✓ Packages successfully updated.
```

- [ ] **Step 2：Commit Layer 2**

```bash
git add -A
git commit -m "chore: upgrade Angular Material + CDK to v20"
```

---

### Task 7：Layer 3 — NgRx 升級至 v20

**Files:**
- Modify: `webapp/package.json`（自動）

- [ ] **Step 1：執行 NgRx 升級**

```bash
ng update @ngrx/store@20 @ngrx/effects@20 @ngrx/store-devtools@20
```

預期輸出：
```
** Executing migrations of package '@ngrx/store' **
  ✓  Update NgRx packages to v20.
✓ Packages successfully updated.
```

- [ ] **Step 2：Commit Layer 3**

```bash
git add -A
git commit -m "chore: upgrade NgRx to v20"
```

---

### Task 8：驗證 Angular 20 建置並確認完成

**Files:**
- Modify: `webapp/src/**/*.ts`（TypeScript 5.7 strict 可能需要少量型別修正）

- [ ] **Step 1：執行建置驗證**

```bash
ng build
```

預期：建置成功，無 `error TS` 輸出。

- [ ] **Step 2：若出現 TypeScript 5.7 型別錯誤，依以下模式修正**

TypeScript 5.7 加強了 undefined/null 推斷。常見錯誤模式與修正：

**錯誤：`Object is possibly 'undefined'`（物件存取）**
```typescript
// 修正前
const marker = this.markers[eventId].getLatLng();

// 修正後（optional chaining）
const marker = this.markers[eventId]?.getLatLng();
```

**錯誤：`Type 'X | null' is not assignable to type 'X'`（函式回傳值）**
```typescript
// 修正前（若函式有時回傳 null）
const el: HTMLElement = document.getElementById('map');

// 修正後
const el = document.getElementById('map');
if (!el) return;
```

**錯誤：`Property does not exist on type 'never'`（NgRx selector 回傳型別）**
```typescript
// 修正前
const events = this.store.selectSignal(selectVisibleEvents)();
events.forEach(e => ...);

// 修正後（確保型別宣告完整）
const events: Event[] = this.store.selectSignal(selectVisibleEvents)() ?? [];
events.forEach(e => ...);
```

修正後重新執行 `ng build` 確認通過。

- [ ] **Step 3：若有手動修正，commit**

```bash
git add -A
git commit -m "fix: resolve Angular 20 / TypeScript 5.7 build issues"
```

若 Step 1 的 `ng build` 直接成功，跳過 Step 2–3。

- [ ] **Step 4：確認最終版本**

```bash
ng version
```

預期輸出包含：
```
Angular: 20.x.x
Angular CLI: 20.x.x
@angular/material: 20.x.x
@ngrx/store: 20.x.x
TypeScript: 5.7.x
node: ...
```

升級完成。
