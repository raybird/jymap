# Angular 18 → 20 升級設計

**日期**：2026-05-26
**範圍**：`webapp/` 目錄下的 Angular 應用程式

## 目標

將 jymap webapp 從 Angular 18.2 逐步升級至 Angular 20，路徑為 18 → 19 → 20。

## 約束條件

- 每版升完只需 `ng build` 通過即可繼續，不強制跑測試
- 維持 zone.js，不遷移 Zoneless
- 使用 `ng update`（官方 migration schematics），不手動改 package.json

## 整體結構

兩輪升級，每輪三層，共六個升級步驟：

```
輪一：18 → 19
  Layer 1：@angular/core + @angular/cli
  Layer 2：@angular/material + @angular/cdk
  Layer 3：@ngrx/store + @ngrx/effects + @ngrx/store-devtools
  ✓ ng build 驗證

輪二：19 → 20
  Layer 1：@angular/core + @angular/cli
  Layer 2：@angular/material + @angular/cdk
  Layer 3：@ngrx/store + @ngrx/effects + @ngrx/store-devtools
  ✓ ng build 驗證
```

## 具體指令

所有指令在 `webapp/` 目錄下執行。

### 輪一：18 → 19

```bash
cd webapp

# Layer 1
ng update @angular/core@19 @angular/cli@19

# Layer 2
ng update @angular/material@19 @angular/cdk@19

# Layer 3
ng update @ngrx/store@19 @ngrx/effects@19 @ngrx/store-devtools@19

# 驗證
ng build
```

### 輪二：19 → 20

```bash
# Layer 1
ng update @angular/core@20 @angular/cli@20

# Layer 2
ng update @angular/material@20 @angular/cdk@20

# Layer 3
ng update @ngrx/store@20 @ngrx/effects@20 @ngrx/store-devtools@20

# 驗證
ng build
```

## 潛在注意事項

### 18 → 19

- **NgRx v19**：新增 Signal Store API，但傳統 Store 用法不受影響，不需改 state 程式碼
- **Angular Material v19**：部分元件 API 有 deprecation，schematic 自動處理
- **`@angular/platform-browser-dynamic`**：v19 標記為 deprecated（Standalone 不需要），schematic 可能提示移除
- **TypeScript**：維持 ~5.5，與 Angular 19 相容

### 19 → 20

- **TypeScript**：`ng update` 自動升至 5.7+，strict 模式下可能出現少量型別錯誤需手動修正
- **Removed deprecated APIs**：v19 deprecated 的 API 在 v20 正式移除，schematic 通常自動替換
- **RxJS**：~7.8 不需升級，Angular 20 仍相容

## 風險評估

**低風險**。專案已使用 Standalone Components + Application Builder，是目前最現代的 Angular 架構。主要不確定因素是 TypeScript 嚴格模式升級後可能出現的型別錯誤，需在 `ng build` 時實際觀察並手動修正。
