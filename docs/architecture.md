---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - docs/prd.md
  - docs/ux-design-specification.md
  - docs/analysis/research/domain-金庸15部作品完整研究-2025-12-11.md
workflowType: 'architecture'
lastStep: 3
project_name: 'jymap'
user_name: 'Kevin'
date: '2025-12-16'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- 共 50 個功能需求，分為 8 個主要類別：
  1. **時空探索能力（8 個）**：時間軸拖曳、地圖同步、標記淡入淡出、區間篩選
  2. **內容搜尋與發現（5 個）**：模糊搜尋、結果跳轉、Top-3 命中率
  3. **事件資訊呈現（8 個）**：事件卡片、相關事件跳轉、高亮狀態
  4. **資料完整性與驗證（7 個）**：全 15 部作品、來源透明、座標覆蓋
  5. **視覺化與互動體驗（8 個）**：Old Maps 風格、100+ 標記渲染、鍵盤操作
  6. **系統整合與同步（6 個）**：即時同步（<200ms）、搜尋跳轉、範圍過濾
  7. **資料關聯與探索（5 個）**：地點/人物關聯、跨朝代探索
  8. **無障礙與可用性（3 個）**：ARIA 標示、鍵盤操作、焦點狀態

**Non-Functional Requirements:**
- 約 40+ 個 NFRs，重點關注：
  - **效能**：同步 <200ms、首屏 <2.5s、卡片 <500ms、搜尋 <300ms、100+ 標記流暢渲染
  - **無障礙**：WCAG 2.1 AA、鍵盤操作、ARIA 支援
  - **可靠性**：資料完整性 100%、座標覆蓋 ≥90%、來源可用率 ≥99%
  - **相容性**：Chrome/Safari、桌面優先、平板適配
  - **可用性**：模糊搜尋、Top-3 命中率 ≥80%、風格開關

**Scale & Complexity:**
- **Primary domain:** Web Application（SPA，互動式地圖/時間軸）
- **Complexity level:** 中等
  - 核心挑戰：即時同步效能（<200ms）、100+ 標記渲染、歷史地圖風格整合
  - 技術棧建議：React/TypeScript + Leaflet + Redux Toolkit
  - 設計系統：MUI Core v5（MIT）+ 自訂元件
- **Estimated architectural components:** 約 8-10 個核心元件
  - 時間軸組件（水平拖曳 + 朝代視覺帶）
  - 地圖標記 + 聚合（Cluster）
  - 事件卡片（側邊/底部抽屜）
  - 搜尋結果下拉/建議清單
  - 相關事件列表
  - 區間篩選控件
  - 狀態管理（Redux Toolkit）
  - 地圖服務整合（Leaflet）

### Technical Constraints & Dependencies

**技術約束：**
- **平台：** SPA，現代瀏覽器（Chrome、Safari）
- **效能：** 同步延遲 <200ms、互動 FPS ≥30fps、首屏 <2.5s
- **無障礙：** WCAG 2.1 AA、鍵盤操作、ARIA 支援
- **資料：** 結構化 JSON、多源整合（維基百科、Google Sheets、遠流）
- **視覺：** Old Maps 風格底圖 + 中國水墨風格標記

**技術依賴：**
- **前端框架：** React + TypeScript
- **狀態管理：** Redux Toolkit（時間軸×地圖同步）
- **地圖庫：** Leaflet（地圖視覺化、標記渲染）
- **UI 元件庫：** MUI Core v5（MIT，基礎元件）
- **搜尋：** 全文搜尋庫（Fuse.js 或類似）
- **動畫：** CSS transforms、GPU 加速（標記淡入淡出）

**資料依賴：**
- **事件資料：** 全 15 部作品、跨朝代（春秋～清乾隆）
- **地理座標：** 覆蓋率 ≥90%
- **來源連結：** 可用率 ≥99%
- **資料格式：** 結構化 JSON

### Cross-Cutting Concerns Identified

**效能優化：**
- 標記聚合（Cluster）處理 100+ 標記
- 漸進式載入（視窗範圍優先）
- Web Workers 處理資料過濾
- 虛擬滾動（時間軸長列表）

**狀態同步：**
- 時間軸×地圖即時同步（<200ms）
- 搜尋結果自動跳轉
- 區間篩選同步過濾
- 相關事件跳轉

**無障礙：**
- 鍵盤操作（搜尋、時間軸、地圖標記）
- ARIA 標示（live regions、標籤）
- 焦點狀態可見
- 螢幕閱讀器支援

**響應式設計：**
- 桌面優先（≥1024px）
- 平板適配（768-1023px，iPad）
- 觸控手勢支援
- 斷點策略

**資料品質：**
- 來源驗證機制
- 多源交叉驗證
- 資料版本控制
- 來源缺失標示

**視覺風格：**
- Old Maps 風格底圖整合
- 中國水墨風格標記
- 風格開關（標準/復古水墨）
- 可讀性平衡（WCAG AA 對比度）

## Starter Template Evaluation

### Primary Technology Domain

**Web Application (SPA)** - 基於專案需求分析，這是一個單頁應用程式，需要：
- 互動式地圖視覺化（Leaflet）
- 即時同步的時間軸與地圖互動
- 複雜的狀態管理（時間軸×地圖同步）
- 豐富的 UI 元件（事件卡片、搜尋、時間軸）

### Technology Stack Decision

**框架選擇：Angular 19+ / Angular 20+**

基於以下考量：
- 團隊熟悉 Angular
- 原生 TypeScript 支援，符合專案需求
- 完整的框架生態系統（路由、表單、HTTP、依賴注入）
- Angular Material 對應 MUI Core 需求
- NgRx 適合複雜狀態管理場景
- 內建效能優化機制（OnPush、Signals）有助於即時同步效能

**地圖套件評估：ngx-leaflet**

- **Leaflet 整合：** `@asymmetrik/ngx-leaflet` 是 Angular 生態系統中最成熟的 Leaflet 封裝
- **相容性：** 支援 Angular 17+，預期可支援 Angular 19/20
- **功能完整性：** 支援標記、聚合（Cluster）、自訂底圖（Old Maps 風格）
- **維護狀態：** Asymmetrik 維護，社群活躍
- **替代方案：** 若相容性問題，可考慮直接整合 Leaflet（較低層級但更靈活）

### Starter Options Considered

**選項 1：Angular CLI 官方 Starter（推薦）**

**初始化命令：**
```bash
ng new jymap --routing --style=scss --standalone
```

**架構決策：**
- **Standalone Components：** Angular 17+ 的新架構，無需 NgModules，更簡潔
- **Routing：** 內建路由支援（雖然 SPA 可能只需單一路由）
- **SCSS：** 樣式預處理器，支援主題與變數
- **TypeScript：** 原生支援，嚴格類型檢查

**優點：**
- 官方維護，與 Angular 版本同步
- 最小化配置，專注業務邏輯
- Standalone Components 符合現代 Angular 最佳實踐
- 易於整合 Angular Material、NgRx、ngx-leaflet

**缺點：**
- 需要手動整合 Angular Material、NgRx、ngx-leaflet
- 無預設的狀態管理設定

**選項 2：Angular Material Starter（可選）**

**初始化命令：**
```bash
ng new jymap --routing --style=scss --standalone
ng add @angular/material
```

**架構決策：**
- 預設整合 Angular Material
- 提供 Material Design 主題系統
- 包含常用 Material 元件範例

**優點：**
- 快速開始 Material Design
- 主題系統完整
- 符合 UX Design 中的 MUI Core 需求

**缺點：**
- 仍需要手動整合 NgRx 和 ngx-leaflet
- Material 風格可能需要自訂以符合 Old Maps 風格需求

### Selected Starter: Angular CLI Official (Standalone)

**選擇理由：**

1. **最小化依賴：** 從最基礎的 Angular CLI starter 開始，避免不必要的預設配置
2. **靈活性：** Standalone Components 架構更靈活，適合自訂元件（時間軸、地圖標記）
3. **整合控制：** 手動整合 Angular Material、NgRx、ngx-leaflet，確保版本相容性
4. **效能優化：** Standalone 架構有助於 tree-shaking 和效能優化
5. **未來相容：** Angular 20+ 將全面採用 Standalone，提前採用符合長期維護

**初始化命令：**

```bash
# 創建新專案（Standalone Components + Routing + SCSS）
ng new jymap --routing --style=scss --standalone

# 進入專案目錄
cd jymap

# 安裝核心依賴
ng add @angular/material  # Angular Material UI 元件庫
npm install @ngrx/store @ngrx/effects @ngrx/store-devtools  # NgRx 狀態管理
npm install @asymmetrik/ngx-leaflet leaflet  # Leaflet 地圖整合
npm install @types/leaflet --save-dev  # Leaflet TypeScript 類型定義

# 安裝搜尋與工具庫
npm install fuse.js  # 全文搜尋庫
npm install rxjs  # 響應式程式設計（Angular 內建，確認版本）
```

**架構決策（由 Starter 提供）：**

**Language & Runtime:**
- **TypeScript：** 嚴格模式，ES2022+ 目標
- **Angular：** 19+ / 20+（Standalone Components 架構）
- **Node.js：** 18+ LTS

**專案結構：**
- **Standalone Components：** 無 NgModules，元件自包含
- **功能導向結構：** `src/app/features/` 組織業務邏輯
- **共享元件：** `src/app/shared/` 放置可重用元件
- **核心服務：** `src/app/core/` 放置核心服務（狀態管理、HTTP）

**Build Tooling:**
- **Angular CLI：** 內建 Webpack 配置
- **開發伺服器：** 熱重載、源映射
- **生產建置：** 優化、tree-shaking、程式碼分割

**開發體驗：**
- **熱重載：** 開發時自動重新編譯
- **TypeScript：** 嚴格類型檢查與 IntelliSense
- **Linting：** ESLint 整合（Angular 17+）
- **測試：** Jasmine + Karma（可選 Jest）

**後續整合步驟（專案初始化後）：**

1. **Angular Material 設定：**
   - 主題配置（標準/復古水墨雙主題）
   - 核心元件導入（Button、Card、Drawer、Input 等）

2. **NgRx 狀態管理設定：**
   - Store 配置（時間軸狀態、地圖狀態、搜尋狀態）
   - Effects 處理非同步操作（資料載入、搜尋）
   - DevTools 整合（開發時狀態除錯）

3. **ngx-leaflet 整合：**
   - Leaflet 模組導入
   - 地圖元件封裝（支援 Old Maps 風格底圖）
   - 標記聚合（Cluster）配置

4. **效能優化設定：**
   - OnPush 變更檢測策略
   - Signals 整合（Angular 19+）
   - 虛擬滾動（時間軸長列表）

**注意事項：**

- **ngx-leaflet 相容性：** 需要確認與 Angular 19/20 的相容性。若不相容，可考慮：
  - 使用較舊的 Angular 版本（18 LTS）
  - 直接整合 Leaflet（較低層級但更靈活）
  - 等待 ngx-leaflet 更新

- **Angular Material 主題：** 需要自訂主題以符合 Old Maps + 中國水墨風格，可能需要覆寫 Material 預設樣式

- **效能要求：** 即時同步 <200ms 需要：
  - OnPush 變更檢測策略
  - Signals 或 RxJS 優化
  - 標記渲染優化（虛擬化、聚合）

**專案初始化應作為第一個實作故事。**

---

## Architecture Decision Records（ADR）

### 決策：前端技術棧選擇

**Decision:**  
- 採用 **Angular 19+/20+（Standalone Components）+ NgRx + Angular Material + Leaflet/ngx‑leaflet** 作為 jymap 的前端技術棧。

**Context:**  
- 專案為高互動 SPA：時間軸 × 地圖同步（<200ms）、100+ 事件標記、Old Maps 風格視覺。  
- 使用情境集中在桌面與平板，Chrome / Safari 為主。  
- 你對 Angular 熟悉，且可接受 NgRx 與 Material 生態。  

**Options Considered:**
- **Option A（選定）：** Angular 19+/20+ + NgRx + Angular Material + Leaflet/ngx‑leaflet  
- **Option B：** React + Redux Toolkit + MUI Core + Leaflet  
- **Option C：** Angular + @angular/google-maps（棄用 Leaflet，改走 Google Maps）

**Drivers / Forces:**
- **體驗與效能：** 需要時間軸 × 地圖的近即時同步、100+ 標記渲染、Old Maps 視覺，且保有未來 500+ 標記擴充的空間。  
- **開發與維護：** 團隊已熟悉 Angular；完整框架（路由、表單、DI）降低決策與整合成本。  
- **資料與視覺：** 需開源底圖與客製樣式支援（Leaflet 相對 Google Maps 更自由）。  

**Trade-offs:**
- **A vs B（Angular vs React）：**
  - A：你熟悉、框架完整、適合中長期維護；NgRx 與 Signals 能滿足複雜同步需求。  
  - B：生態最大，但需切換到 React 心智模型；PRD 早期建議 React 僅為「建議」而非硬性約束。  
- **Leaflet vs Google Maps：**
  - Leaflet：Old Maps 風格、自訂圖層、開源底圖選擇多，適合歷史地圖題材。  
  - Google Maps：官方 Angular 支援（@angular/google-maps），但視覺更偏現代、授權模式與 Old Maps 題材不完全貼合。  
- **NgRx vs 輕量狀態管理：**
  - NgRx：在「時間軸 × 地圖 × 搜尋 × 事件卡片」這種多 source‑of‑truth 場景更易維持一致性，但增加樣板與心智成本。  

**Decision:**  
- 採用 **Option A** 作為主線架構：  
  - Angular 19+/20+ Standalone Components  
  - NgRx 管理核心全域狀態（時間軸、地圖、搜尋、當前事件）  
  - Angular Material 提供骨架式 UI 元件，自訂主題對齊 Old Maps + 水墨風格  
  - Leaflet/ngx‑leaflet 作為地圖引擎，必要時可退回原生 Leaflet 封裝  

**Consequences:**
- **Positive:**
  - 架構與程式碼結構高度一致，利於長期維護與擴展。  
  - 以 Angular Signals + NgRx 為基礎，較容易達成 <200ms 同步與穩定 FPS。  
  - Leaflet 提供 Old Maps 風格與開源底圖彈性，符合產品差異化目標。  
- **Negative / Cost:**
  - NgRx 引入學習與樣板成本，需要嚴格控管 scope（只用於核心狀態）。  
  - 需驗證 ngx‑leaflet 與 Angular 20 的相容性，或預備 fallback。  
  - Angular Material 主題需較多客製，避免整體太「企業系 Material」。  

---

## Pre-mortem Analysis（預想失敗 → 反推預防）

### 假設 1：地圖層與 Angular 版本相容性失敗

**Failure Scenario:**  
- 升級到 Angular 20 後，ngx‑leaflet 出現編譯或執行錯誤（型別不符、SSR/zoneless bug），導致前端無法順利升版。  

**Likely Causes:**  
- ngx‑leaflet 更新節奏落後 Angular 主版本。  
- 專案對 ngx‑leaflet 綁定過深，無法輕易切換到原生 Leaflet 或其他方案。  

**Preventions / Mitigations:**  
- 架構上將地圖封裝為：  
  - `MapShellComponent`：唯一負責渲染地圖的容器。  
  - `MapService`：抽象所有「加標記、更新 viewport、套用 cluster、同步時間軸」操作。  
- 在 PoC 階段就建立「100+ 標記 + 時間軸同步」 demo，以 Angular 20 + ngx‑leaflet 實測效能與穩定度。  
- 在 ADR 中明寫 fallback 策略：  
  - Fallback 1：若 ngx‑leaflet 落後，可暫時停在 Angular 18 LTS。  
  - Fallback 2：改由原生 Leaflet + 自寫 Angular wrapper 實作 `MapShellComponent`。  

---

### 假設 2：即時同步 <200ms 無法達成，操作體感卡頓

**Failure Scenario:**  
- 使用者拖動時間軸時，地圖標記晚一拍才更新，FPS 掉到 10–15fps，破壞「主動探索」體驗。  

**Likely Causes:**  
- 將大量圖層/事件狀態塞入 NgRx，全域 re-render。  
- 每一次 drag 事件都觸發完整 filter + render pipeline。  

**Preventions / Mitigations:**  
- NgRx store 僅承載「核心狀態」：時間範圍、當前事件、當前 viewport 等；heavy 計算在 selector 或 service 層處理。  
- 將時間軸互動拆成兩層：  
  - 「即時預覽」：使用 Signals / RxJS 處理連續拖曳，UI 做輕量預覽。  
  - 「停止後提交」：拖曳結束後（debounce），才觸發 NgRx action 做完整 filter + render。  
- 早期 load 測試時，就以 150–200 個標記作為基準壓力測試，而非只測少量事件。  

---

### 假設 3：視覺風格落入「Material 後台感」，失去 Old Maps 沉浸感

**Failure Scenario:**  
- UI 整體視覺偏向標準 Material Design，與 PRD 中的 Old Maps + 水墨風格落差大，用戶感到「只是另一個介面」而非歷史地圖。  

**Likely Causes:**  
- 過度依賴 Angular Material 預設樣式與主題。  
- 卡片/標記/時間軸樣式未針對品牌風格客製。  

**Preventions / Mitigations:**  
- 將 Material 定位為「結構骨架」，品牌感交由自訂 SCSS/CSS variables 控制：  
  - Material：佈局、表單元件、Drawer、Dialog。  
  - 自訂樣式：事件卡邊框、字體、色盤、Old Maps 紋理等。  
- 一開始即實作「標準 / 復古水墨」雙主題 PoC，確認可透過 Angular Material theming + CSS 變數切換。  

---

### 假設 4：NgRx 心智負擔過高，拖慢開發

**Failure Scenario:**  
- 每個小功能都要寫一整套 actions / reducers / effects，導致迭代速度明顯變慢。  

**Likely Causes:**  
- 將所有 UI 狀態一律塞進 NgRx（over‑engineering）。  

**Preventions / Mitigations:**  
- 僅將「多元件共享、需要 time‑travel / DevTools 監控的核心狀態」放入 NgRx：  
  - 例：當前時間範圍、當前選中事件、地圖 viewport、搜尋條件。  
- 其餘局部 UI 狀態（某個 Drawer 開關、某個卡片 hover 狀態）使用 component local state 或 Signals 處理。  
- 在文件中明寫設計原則：**「NgRx 用於同步管線，不當成萬用 global store」**。  

---

這些 ADR 與 Pre-mortem 條目將作為後續架構決策與實作故事的參考基礎。

***

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- 資料來源與載入方式：MVP 使用前端靜態 JSON（assets 或同網域 CDN），由 Angular `HttpClient` 載入，無獨立後端 API。  
- 資料模型：以 `Event` / `MapMarker` / `TimelineItem` 為核心實體並在前端建模（TypeScript 型別 + NgRx state）。  
- 認證與授權：MVP 無登入、無權限系統，所有資料公開唯讀。  

**Important Decisions (Shape Architecture):**
- 搜尋與過濾完全在前端執行（Fuse.js + NgRx selectors / Signals）。  
- API 形狀：MVP 不設正式 REST/GraphQL API，將 JSON 視為靜態資料檔；未來若導入後端 API，將沿用現有資料模型。  

**Deferred Decisions (Post-MVP):**
- 使用者帳號、收藏、註解等需要寫入的功能，連同後端與資料庫選型（例如 Postgres / Supabase / NestJS）延後到 Post-MVP。  
- 更進階的搜尋（全文索引、多欄位複合過濾）與伺服器端搜尋能力。  

### Data Architecture

**資料來源與儲存：**
- MVP 階段，所有事件與地圖資料以靜態 JSON 檔管理：  
  - 例如：`assets/data/events.json`, `assets/data/timeline.json`。  
  - 部署時可放在前端 build 內或同網域 CDN，透過 HTTP/HTTPS 讀取。  

**資料模型（前端）：**
- `Event`：  
  - 欄位示意：`id, title, dynasty, year, lat, lng, novel, characters[], sources[], tags[]`。  
- `MapMarker`：  
  - 由 `Event` 衍生，包含地理位置與視覺屬性（顏色、圖示、聚合 ID）。  
- `TimelineItem`：  
  - `year/dynasty + eventIds[]`，支援時間軸滑動與區間篩選。  

**資料載入與快取策略：**
- 首次載入時，由 Angular 啟動流程讀取核心 JSON（事件列表與時間軸資料），再存入 NgRx store/Signals。  
- 前端記憶體中保留完整資料集；搜尋與過濾完全在客戶端完成。  
- 若未來資料量成長，可再評估：  
  - 拆分 JSON（依朝代/小說分檔）。  
  - 延遲載入或僅載入當前視窗範圍資料。  

### Authentication & Security

**認證與授權：**
- MVP：無登入／註冊／角色權限需求，所有內容公開唯讀。  

**安全性界線：**
- 僅需：  
  - 前端建置於 HTTPS。  
  - 不在前端放置敏感憑證或私密金鑰。  
  - 如有外部 API（金庸資料來源）存取，盡量使用公開端點或以 proxy/後端封裝（Post-MVP）。  

### API & Communication Patterns

**API 風格（MVP）：**
- 無正式 REST / GraphQL API；Angular 直接對靜態 JSON 發出 `GET` 請求。  
- 前端視靜態 JSON 為「資料層」，未來若導入後端 API，僅需將讀取來源從 `/assets/...` 換為 `/api/...`，並保留相同結構。  

**錯誤處理與回應：**
- 讀取 JSON 失敗時：  
  - 顯示清楚的錯誤訊息（例如「資料載入失敗」）與重新載入選項。  
  - 寫在前端 error boundary / service 層，不依賴後端錯誤碼。  

### Frontend Architecture（補充：與資料決策相關）

- 前端負責：  
  - 載入與緩存事件 / 時間軸 / 地圖資料。  
  - 在客戶端執行搜尋（Fuse.js）與過濾（NgRx selectors / Signals）。  
  - 驅動時間軸 × 地圖 × 事件卡的即時同步。  

### Infrastructure & Deployment（與方案 A 對應）

**Hosting 決策：Cloudflare Pages**

- **選定平台：** Cloudflare Pages 作為前端靜態網站 Hosting。  
- **理由：**  
  - 原生支援 SPA（可設定所有 404 fallback 至 `index.html`）。  
  - 與 Cloudflare CDN 深度整合，適合全球訪問與快取控制。  
  - 未來若需要薄後端，可搭配 Cloudflare Workers / Functions 延伸。  

**基本需求與設定：**

- SPA 路由：  
  - 以單一路由為主（例如 `/`），URL 狀態主要由 query/hash 或 NgRx/Signals 管理。  
  - Cloudflare Pages 設定：所有非靜態資源路徑 fallback 到 `index.html`。  
- 快取策略：  
  - `index.html`：短快取（確保部署更新能快速生效）。  
  - JS/CSS/資產（含 JSON 資料）：使用 content hash，設定為長期 immutable cache。  

**環境規劃（最小集）：**

- 至少區分：  
  - `preview`：對應 feature branches / PR，給你測試互動體驗與效能。  
  - `production`：主線穩定版本。  

**GitHub 整合與自動部署：**

- **儲存庫連接：**  
  - 專案代碼存放於 GitHub，Cloudflare Pages 透過 OAuth 連接 GitHub 帳號並選擇對應 repository。  
  - 連接後，Cloudflare Pages 會自動監聽 repository 的 push 事件。

- **自動部署觸發條件：**  
  - **Production 部署：** 當 push 到 `main` 或 `master` 分支時，自動觸發建置並部署至 production 環境。  
  - **Preview 部署：** 當建立 Pull Request 或 push 到其他分支時，自動建立 preview 環境（每個 PR/分支有獨立 preview URL）。  
  - 所有部署皆為自動觸發，無需手動操作。

- **建置設定（Angular 專案）：**  
  - **建置命令：** `npm run build`（或 `ng build --configuration production`）。  
  - **輸出目錄：** `dist/jymap/browser`（Angular 19+ Standalone 專案的預設輸出路徑）。  
  - **Node.js 版本：** 建議設定為 20.x LTS（與本地開發環境一致）。  
  - **環境變數：** 如有需要（例如 API 端點、feature flags），可在 Cloudflare Pages 專案設定中配置。

- **部署流程：**  
  1. 開發者 push 代碼至 GitHub。  
  2. Cloudflare Pages 偵測到變更，自動拉取最新代碼。  
  3. 執行建置命令（`npm install` + `npm run build`）。  
  4. 將建置產物部署至 Cloudflare CDN。  
  5. 提供部署 URL（production 或 preview）並可選發送通知（Email / Slack）。

- **部署狀態監控：**  
  - Cloudflare Pages Dashboard 顯示每次部署的狀態（成功/失敗）、建置日誌、部署時間。  
  - 可設定部署通知，確保及時了解部署結果。

---

### Frontend Routing Strategy

**決策：單一路由 + Query Parameters（方案 A）**

**選定理由：**
- **MVP 簡化：** 符合「單一路由」的初始設計，降低路由配置複雜度。  
- **分享友善：** Query parameters 可完整編碼應用狀態，易於複製與分享。  
- **狀態組合：** 可同時表達多個狀態（事件 + 時間 + 地圖 + 搜尋），靈活度高。  
- **實作簡單：** Angular Router 原生支援 `queryParams`，無需複雜路由配置。  
- **SEO 友善：** Query parameters 可被搜尋引擎索引，優於 Hash 方案。

**URL 結構設計：**

```
/                                    # 預設首頁（無參數）
/?event=123                          # 分享特定事件（事件 ID）
/?year=960&dynasty=北宋               # 分享特定時間範圍（年份 + 朝代）
/?search=射鵰英雄傳                   # 分享搜尋結果（搜尋關鍵字）
/?lat=32.0&lng=112.1&zoom=8          # 分享地圖視角（中心點 + 縮放級別）
/?event=123&year=960&lat=32.0&lng=112.1&zoom=8  # 組合狀態（事件 + 時間 + 地圖位置）
```

**Query Parameters 定義：**

| 參數名稱 | 類型 | 說明 | 範例 |
|---------|------|------|------|
| `event` | string | 事件 ID（當前選中的事件） | `event=123` |
| `year` | number | 年份（時間軸當前年份） | `year=960` |
| `dynasty` | string | 朝代名稱 | `dynasty=北宋` |
| `yearStart` | number | 時間範圍起始年份（區間篩選） | `yearStart=960` |
| `yearEnd` | number | 時間範圍結束年份（區間篩選） | `yearEnd=1127` |
| `search` | string | 搜尋關鍵字 | `search=射鵰英雄傳` |
| `lat` | number | 地圖中心點緯度 | `lat=32.0` |
| `lng` | number | 地圖中心點經度 | `lng=112.1` |
| `zoom` | number | 地圖縮放級別 | `zoom=8` |

**實作要點：**

1. **Angular Router 配置：**
   - 單一路由：`{ path: '', component: MainPageComponent }`  
   - 使用 `ActivatedRoute.queryParams` 監聽 URL 參數變化  
   - 使用 `Router.navigate()` 更新 query parameters（保留其他參數）

2. **與 NgRx 狀態同步：**
   - **URL → State：** 應用啟動時，解析 URL query parameters，dispatch actions 還原應用狀態  
   - **State → URL：** 當核心狀態變更時（選中事件、時間範圍、地圖位置），同步更新 URL query parameters  
   - **雙向綁定：** 使用 NgRx Effects 或 Router Effects 處理 URL 與 State 的雙向同步

3. **分享功能實作：**
   - **複製連結按鈕：** 在事件卡片、時間軸等關鍵位置提供「複製連結」功能  
   - **自動生成 URL：** 根據當前應用狀態（NgRx store）自動生成包含所有相關參數的完整 URL  
   - **狀態還原：** 使用者開啟分享連結時，應用自動解析 URL 參數並還原對應狀態（事件卡片展開、時間軸定位、地圖視角）

4. **狀態還原流程：**
   ```
   使用者開啟分享連結
   → Angular Router 解析 query parameters
   → 觸發 NgRx Actions（例如：LoadEventFromUrl, SetTimeRangeFromUrl, SetMapViewFromUrl）
   → NgRx Effects 處理 actions，更新 store
   → Components 透過 selectors 訂閱狀態變化
   → UI 自動更新（展開事件卡片、定位時間軸、調整地圖視角）
   ```

5. **效能考量：**
   - **防抖處理：** 時間軸拖曳等連續操作時，避免頻繁更新 URL（使用 debounce）  
   - **選擇性同步：** 僅同步「可分享」的核心狀態，避免將所有 UI 狀態都寫入 URL  
   - **URL 長度限制：** 若參數過多導致 URL 過長，考慮使用短連結服務（Post-MVP）

**使用者分享情境支援：**

- ✅ **分享特定事件：** `/?event=123` → 開啟時自動展開事件卡片並定位地圖  
- ✅ **分享特定時間範圍：** `/?yearStart=960&yearEnd=1127&dynasty=北宋` → 開啟時自動設定時間軸與地圖篩選  
- ✅ **分享特定搜尋結果：** `/?search=射鵰英雄傳` → 開啟時自動執行搜尋並顯示結果  
- ✅ **分享特定地圖視角：** `/?lat=32.0&lng=112.1&zoom=8` → 開啟時自動調整地圖位置與縮放  
- ✅ **組合狀態分享：** `/?event=123&year=960&lat=32.0&lng=112.1` → 同時還原多個狀態

**未來擴展（Post-MVP）：**
- 考慮加入短連結服務（例如：`/s/abc123` → 展開為完整 query parameters）  
- 考慮加入分享統計（追蹤哪些連結被分享與點擊）  
- 考慮加入社交媒體分享卡片（Open Graph / Twitter Cards）

---

---
