---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - docs/prd.md
  - docs/architecture.md
  - docs/ux-design-specification.md
workflowType: 'create-epics-stories'
date: '2025-12-17'
epicsCompleted: [1, 2, 3, 4, 5]
epicsPending: [6, 7, 8, 9]
note: 'Epic 1-5 (核心 Epic) 已完成 Stories 創建，Epic 6-9 將後續補充'
totalStoriesCreated: 20
---

# jymap - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for jymap, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**時空探索能力（Temporal-Spatial Exploration）：**
- FR1: 使用者可以透過水平拖曳時間軸探索不同歷史時期（春秋前 473 年～清乾隆 18 世紀）
- FR2: 使用者可以透過點擊搜尋結果自動跳轉到對應的時間軸位置
- FR3: 使用者可以在時間軸上框選時間範圍，過濾顯示該時間段內的事件標記
- FR4: 使用者可以透過拖曳時間軸即時看到地圖上對應的事件標記更新
- FR5: 使用者可以在地圖上看到事件標記隨時間軸變化而淡入淡出
- FR6: 使用者可以透過地圖縮放與平移探索不同地理區域
- FR7: 使用者可以透過點擊地圖標記查看該地點的詳細事件資訊
- FR8: 使用者可以透過相關事件連結快速跳轉到其他相關事件的位置

**內容搜尋與發現（Content Search & Discovery）：**
- FR9: 使用者可以透過搜尋框輸入關鍵字（地點、事件、人物、小說名稱）進行模糊搜尋
- FR10: 使用者可以查看搜尋結果列表，顯示匹配的事件、地點、人物或小說
- FR11: 使用者可以點擊搜尋結果自動跳轉到對應的時間軸位置與地圖標記
- FR12: 使用者可以透過搜尋結果了解事件所屬的朝代與對應的小說作品
- FR13: 使用者可以透過搜尋結果快速識別最相關的 Top-3 匹配項目

**事件資訊呈現（Event Information Display）：**
- FR14: 使用者可以透過點擊地圖標記查看事件卡片
- FR15: 使用者可以在事件卡片中查看歷史事件描述
- FR16: 使用者可以在事件卡片中查看對應的小說情節摘要
- FR17: 使用者可以在事件卡片中查看相關人物資訊
- FR18: 使用者可以在事件卡片中查看資料來源連結
- FR19: 使用者可以展開事件卡片中的「相關事件」區塊
- FR20: 使用者可以透過相關事件連結快速跳轉到其他事件的位置與時間
- FR21: 使用者可以在地圖上看到當前選中事件標記的高亮狀態

**資料完整性與驗證（Data Integrity & Verification）：**
- FR22: 系統可以顯示涵蓋全 15 部金庸作品的完整事件資料
- FR23: 系統可以顯示跨朝代（春秋～清乾隆）的完整時空脈絡
- FR24: 系統可以在事件卡片中顯示每個事件的資料來源連結
- FR25: 系統可以標示缺少來源的事件（來源缺失標示）
- FR26: 系統可以顯示事件的地理座標資訊（經緯度）
- FR27: 系統可以顯示事件所屬的朝代與歷史時期
- FR28: 系統可以顯示事件對應的小說作品資訊

**視覺化與互動體驗（Visualization & Interaction）：**
- FR29: 使用者可以在地圖上看到 Old Maps 風格的歷史地圖底圖
- FR30: 使用者可以在地圖上看到略帶中國水墨風格的標記與配色
- FR31: 使用者可以在地圖上看到 100+ 事件標記的流暢渲染
- FR32: 使用者可以透過鍵盤操作搜尋功能（鍵盤導覽）
- FR33: 使用者可以透過鍵盤操作時間軸控制（鍵盤導覽）
- FR34: 使用者可以透過鍵盤選擇地圖標記（鍵盤導覽）
- FR35: 使用者可以在核心操作中看到可見的焦點狀態
- FR36: 使用者可以在不同裝置（桌面、平板）上使用響應式設計的介面

**系統整合與同步（System Integration & Synchronization）：**
- FR37: 系統可以在時間軸拖曳時即時同步更新地圖標記（<200ms 目標）
- FR38: 系統可以在搜尋結果點擊時同步更新時間軸位置與地圖高亮
- FR39: 系統可以在時間軸範圍選擇時同步過濾地圖標記
- FR40: 系統可以在事件卡片展開相關事件時同步跳轉到對應位置
- FR41: 系統可以在首屏載入時顯示時間軸與地圖的基礎標記
- FR42: 系統可以在不同瀏覽器（Chrome、Safari）上正常運作

**資料關聯與探索（Data Relationships & Exploration）：**
- FR43: 使用者可以透過地點關聯跳轉到相關事件（例如：襄陽→相關戰役）
- FR44: 使用者可以透過人物關聯跳轉到相關事件（例如：郭靖→相關戰役）
- FR45: 使用者可以透過跨朝代探索串連多個相關事件
- FR46: 使用者可以透過時間軸連續拖曳觀看連續劇情（例如：《射鵰》到《神鵰》）
- FR47: 系統可以顯示事件之間的關聯關係（人物、地點、時間）

**無障礙與可用性（Accessibility & Usability）：**
- FR48: 系統可以為核心操作（搜尋、時間軸控制、地圖標記選擇）提供 ARIA 標示
- FR49: 系統可以確保所有核心功能都可以透過鍵盤操作完成
- FR50: 系統可以確保焦點狀態在所有互動元素上可見

### NonFunctional Requirements

**Performance（效能）：**
- NFR1: 時間軸與地圖同步延遲必須 < 200ms（從時間軸拖曳到地圖標記更新的時間）
- NFR2: 互動渲染必須維持 ≥ 30fps（時間軸拖曳、地圖平移/縮放時的畫面更新率）
- NFR3: 地圖標記更新必須在 < 200ms 內完成（時間軸變化後標記淡入淡出的動畫時間）
- NFR4: 首屏載入時間必須 < 2.5s（桌面寬頻環境下，時間軸與地圖基礎標記完全顯示的時間）
- NFR5: 事件卡片載入時間必須 < 500ms（從點擊標記到卡片內容完全顯示的時間）
- NFR6: 搜尋首字節回應時間必須 < 300ms（從輸入第一個字元到顯示搜尋結果的時間）
- NFR7: 系統必須支援 100+ 事件標記同時渲染且保持流暢（互動 FPS ≥ 30fps）
- NFR8: 標記淡入淡出動畫必須流暢（60fps 動畫，無卡頓或跳躍）
- NFR9: 搜尋 Top-3 命中率必須 ≥ 80%（使用者點擊前 3 個搜尋結果的比例）
- NFR10: 搜尋結果必須在 < 300ms 內完成排序與顯示

**Accessibility（無障礙）：**
- NFR11: 所有核心功能必須可以透過鍵盤操作完成（搜尋、時間軸控制、地圖標記選擇）
- NFR12: 鍵盤導覽必須符合邏輯順序（Tab 鍵順序符合視覺流）
- NFR13: 所有互動元素必須可以透過鍵盤觸發（Enter、Space、方向鍵等）
- NFR14: 所有互動元素必須有可見的焦點狀態（鍵盤導覽時的視覺反饋）
- NFR15: 焦點狀態必須有足夠的對比度（符合 WCAG 2.1 AA 標準，對比度 ≥ 3:1）
- NFR16: 核心操作必須提供 ARIA 標示（搜尋框、時間軸控制、地圖標記選擇）
- NFR17: ARIA 標籤必須清楚描述元素功能與狀態（aria-label、aria-describedby）
- NFR18: 動態內容更新必須透過 ARIA live regions 通知螢幕閱讀器（標記更新、搜尋結果）
- NFR19: 事件卡片內容必須可以透過螢幕閱讀器完整讀取
- NFR20: 地圖標記必須有文字替代方案（標記點擊後的文字描述）

**Reliability（可靠性）：**
- NFR21: 事件資料匯入完整率必須 = 100%（所有 Google Sheets 編年史事件都必須匯入）
- NFR22: 地理座標覆蓋率必須 ≥ 90%（有座標的事件數 / 總事件數）
- NFR23: 事件必填欄位覆蓋率必須 ≥ 95%（必填欄位有值的比例）
- NFR24: 來源 URL 可用率必須 ≥ 99%（來源連結可正常開啟的比例）
- NFR25: 無效座標率必須 < 5%（座標超出合理範圍或無法顯示的比例）
- NFR26: 系統必須在 Chrome、Safari 瀏覽器上穩定運作（無崩潰、無嚴重錯誤）
- NFR27: 長時間使用（30 分鐘以上）必須保持效能穩定（無記憶體洩漏、無效能衰退）

**Compatibility（相容性）：**
- NFR28: 系統必須在 Chrome（最新 2 個主要版本）上正常運作
- NFR29: 系統必須在 Safari（最新 2 個主要版本）上正常運作
- NFR30: 系統必須在桌面與平板（iPad）裝置上提供響應式設計
- NFR31: 桌面優先設計，平板（iPad）必須保有拖曳與點擊精度
- NFR32: 時間軸與地圖在平板裝置上必須可以正常操作（觸控手勢支援）

**Usability（可用性）：**
- NFR33: 搜尋功能必須支援模糊搜尋（部分匹配、同義詞、繁體/簡體）
- NFR34: 搜尋結果必須按相關性排序（Top-3 命中率 ≥ 80%）
- NFR35: Old Maps 風格底圖與中國水墨風格標記必須保持可讀性（標記與文字清晰可見）
- NFR36: 若視覺風格影響可讀性，系統必須提供風格開關（標準/復古水墨）
- NFR37: 所有事件必須顯示資料來源連結（缺來源必須標示「來源缺失」）
- NFR38: 來源連結必須可點擊開啟（新分頁開啟外部連結）

**Data Quality（資料品質）：**
- NFR39: 系統必須驗證地理座標的有效性（經緯度範圍、格式正確）
- NFR40: 系統必須驗證時間資料的有效性（朝代、年份範圍合理）
- NFR41: 系統必須標示資料缺失或不可用的情況（來源缺失、座標缺失）
- NFR42: 系統必須支援資料版本控制（追蹤資料更新歷史）
- NFR43: 系統必須提供資料驗證檢查機制（定期檢查來源 URL 可用性）

### Additional Requirements

**技術架構需求（來自 Architecture）：**
- Angular 20+ Standalone Components 專案初始化（使用 `ng new jymap --routing --style=scss --standalone`）
- Angular Material 整合與主題配置（標準/復古水墨雙主題）
- NgRx 狀態管理設定（Store、Effects、DevTools）
- ngx-leaflet 地圖整合（Leaflet 地圖引擎、標記渲染、聚合 Cluster）
- Fuse.js 搜尋庫整合（前端模糊搜尋）
- 前端路由策略：單一路由 + Query Parameters（支援深層連結與分享）
- 資料載入策略：靜態 JSON 檔案（`assets/data/events.json`, `assets/data/timeline.json`）
- 資料模型定義：`Event`、`MapMarker`、`TimelineItem` TypeScript 介面
- Cloudflare Pages 部署設定（GitHub 自動部署、SPA fallback、快取策略）
- 錯誤處理策略：資料載入失敗、地圖初始化失敗的使用者錯誤訊息

**UX 設計需求（來自 UX Design）：**
- 響應式設計：桌面優先（≥1024px）、平板適配（768-1023px，iPad）
- 無障礙設計：WCAG 2.1 AA 合規、鍵盤導覽、ARIA 標示、螢幕閱讀器支援
- 動畫與過渡：標記淡入淡出（60fps）、事件卡片展開動畫、相關事件跳轉視覺引導
- 視覺風格：Old Maps 風格底圖整合、中國水墨風格標記與配色、雙主題切換
- 互動模式：時間軸拖曳、地圖縮放/平移、事件卡片側邊抽屜、搜尋結果下拉建議
- 效能優化：標記聚合（Cluster）、漸進式載入、虛擬滾動（時間軸長列表）

### FR Coverage Map

**Epic 1: 專案基礎設施與資料載入**
- FR22: 系統可以顯示涵蓋全 15 部金庸作品的完整事件資料
- FR23: 系統可以顯示跨朝代（春秋～清乾隆）的完整時空脈絡
- FR26: 系統可以顯示事件的地理座標資訊（經緯度）
- FR27: 系統可以顯示事件所屬的朝代與歷史時期
- FR28: 系統可以顯示事件對應的小說作品資訊

**Epic 2: 地圖視覺化與基礎互動**
- FR6: 使用者可以透過地圖縮放與平移探索不同地理區域
- FR7: 使用者可以透過點擊地圖標記查看該地點的詳細事件資訊
- FR29: 使用者可以在地圖上看到 Old Maps 風格的歷史地圖底圖
- FR30: 使用者可以在地圖上看到略帶中國水墨風格的標記與配色
- FR31: 使用者可以在地圖上看到 100+ 事件標記的流暢渲染

**Epic 3: 時間軸互動與視覺化**
- FR1: 使用者可以透過水平拖曳時間軸探索不同歷史時期（春秋前 473 年～清乾隆 18 世紀）
- FR3: 使用者可以在時間軸上框選時間範圍，過濾顯示該時間段內的事件標記

**Epic 4: 時空同步互動**
- FR4: 使用者可以透過拖曳時間軸即時看到地圖上對應的事件標記更新
- FR5: 使用者可以在地圖上看到事件標記隨時間軸變化而淡入淡出
- FR37: 系統可以在時間軸拖曳時即時同步更新地圖標記（<200ms 目標）
- FR39: 系統可以在時間軸範圍選擇時同步過濾地圖標記

**Epic 5: 搜尋與內容發現**
- FR9: 使用者可以透過搜尋框輸入關鍵字（地點、事件、人物、小說名稱）進行模糊搜尋
- FR10: 使用者可以查看搜尋結果列表，顯示匹配的事件、地點、人物或小說
- FR11: 使用者可以點擊搜尋結果自動跳轉到對應的時間軸位置與地圖標記
- FR12: 使用者可以透過搜尋結果了解事件所屬的朝代與對應的小說作品
- FR13: 使用者可以透過搜尋結果快速識別最相關的 Top-3 匹配項目
- FR2: 使用者可以透過點擊搜尋結果自動跳轉到對應的時間軸位置
- FR38: 系統可以在搜尋結果點擊時同步更新時間軸位置與地圖高亮

**Epic 6: 事件詳情呈現**
- FR14: 使用者可以透過點擊地圖標記查看事件卡片
- FR15: 使用者可以在事件卡片中查看歷史事件描述
- FR16: 使用者可以在事件卡片中查看對應的小說情節摘要
- FR17: 使用者可以在事件卡片中查看相關人物資訊
- FR18: 使用者可以在事件卡片中查看資料來源連結
- FR19: 使用者可以展開事件卡片中的「相關事件」區塊
- FR20: 使用者可以透過相關事件連結快速跳轉到其他事件的位置與時間
- FR21: 使用者可以在地圖上看到當前選中事件標記的高亮狀態
- FR24: 系統可以在事件卡片中顯示每個事件的資料來源連結
- FR25: 系統可以標示缺少來源的事件（來源缺失標示）
- FR40: 系統可以在事件卡片展開相關事件時同步跳轉到對應位置
- FR41: 系統可以在首屏載入時顯示時間軸與地圖的基礎標記

**Epic 7: 資料關聯與探索**
- FR8: 使用者可以透過相關事件連結快速跳轉到其他相關事件的位置
- FR43: 使用者可以透過地點關聯跳轉到相關事件（例如：襄陽→相關戰役）
- FR44: 使用者可以透過人物關聯跳轉到相關事件（例如：郭靖→相關戰役）
- FR45: 使用者可以透過跨朝代探索串連多個相關事件
- FR46: 使用者可以透過時間軸連續拖曳觀看連續劇情（例如：《射鵰》到《神鵰》）
- FR47: 系統可以顯示事件之間的關聯關係（人物、地點、時間）

**Epic 8: 無障礙與響應式設計**
- FR32: 使用者可以透過鍵盤操作搜尋功能（鍵盤導覽）
- FR33: 使用者可以透過鍵盤操作時間軸控制（鍵盤導覽）
- FR34: 使用者可以透過鍵盤選擇地圖標記（鍵盤導覽）
- FR35: 使用者可以在核心操作中看到可見的焦點狀態
- FR36: 使用者可以在不同裝置（桌面、平板）上使用響應式設計的介面
- FR42: 系統可以在不同瀏覽器（Chrome、Safari）上正常運作
- FR48: 系統可以為核心操作（搜尋、時間軸控制、地圖標記選擇）提供 ARIA 標示
- FR49: 系統可以確保所有核心功能都可以透過鍵盤操作完成
- FR50: 系統可以確保焦點狀態在所有互動元素上可見

**Epic 9: 部署與發布**
- （技術需求：Cloudflare Pages 部署、GitHub 自動部署、錯誤處理）

## Epic List

### Epic 1: 專案基礎設施與資料載入
使用者可以透過系統載入並查看完整的金庸事件資料，包括全 15 部作品、跨朝代（春秋～清乾隆）的完整時空脈絡，以及每個事件的地理座標、朝代、歷史時期和小說作品資訊。

**FRs covered:** FR22, FR23, FR26, FR27, FR28

**技術需求：**
- Angular 20+ Standalone Components 專案初始化
- 資料模型定義（Event、MapMarker、TimelineItem）
- 靜態 JSON 檔案載入（assets/data/events.json, assets/data/timeline.json）
- 資料驗證與錯誤處理

### Epic 2: 地圖視覺化與基礎互動
使用者可以在地圖上看到 Old Maps 風格的歷史地圖底圖，並透過地圖縮放、平移和點擊標記來探索不同地理區域的事件。

**FRs covered:** FR6, FR7, FR29, FR30, FR31

**技術需求：**
- ngx-leaflet 地圖整合
- Old Maps 風格底圖整合
- 中國水墨風格標記與配色
- 100+ 事件標記流暢渲染
- 標記點擊互動

### Epic 3: 時間軸互動與視覺化
使用者可以透過水平拖曳時間軸探索不同歷史時期，並可以框選時間範圍來過濾顯示該時間段內的事件標記。

**FRs covered:** FR1, FR3

**技術需求：**
- 時間軸組件開發
- 朝代視覺帶設計
- 時間範圍選擇控件
- 水平拖曳互動

### Epic 4: 時空同步互動
使用者可以透過拖曳時間軸即時看到地圖上對應的事件標記更新，標記會隨時間軸變化而淡入淡出，實現流暢的時空同步體驗（<200ms 目標）。

**FRs covered:** FR4, FR5, FR37, FR39

**技術需求：**
- NgRx 狀態管理設定（Store、Effects）
- 時間軸與地圖狀態同步
- 標記淡入淡出動畫（60fps）
- 效能優化（<200ms 同步延遲）

### Epic 5: 搜尋與內容發現
使用者可以透過搜尋框輸入關鍵字（地點、事件、人物、小說名稱）進行模糊搜尋，查看搜尋結果列表，並點擊結果自動跳轉到對應的時間軸位置與地圖標記。

**FRs covered:** FR2, FR9, FR10, FR11, FR12, FR13, FR38

**技術需求：**
- Fuse.js 搜尋庫整合
- 搜尋結果排序（Top-3 命中率 ≥ 80%）
- 搜尋結果與時間軸/地圖同步跳轉
- 搜尋首字節回應時間 < 300ms

### Epic 6: 事件詳情呈現
使用者可以透過點擊地圖標記查看事件卡片，在卡片中查看歷史事件描述、小說情節摘要、相關人物資訊、資料來源連結，並可以展開「相關事件」區塊快速跳轉到其他相關事件。

**FRs covered:** FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR24, FR25, FR40, FR41

**技術需求：**
- 事件卡片組件開發（側邊抽屜）
- 事件卡片展開動畫
- 相關事件跳轉邏輯
- 事件標記高亮狀態
- 來源連結顯示與缺失標示

### Epic 7: 資料關聯與探索
使用者可以透過地點、人物、時間等關聯跳轉到相關事件，並可以透過跨朝代探索串連多個相關事件，實現連續劇情的探索體驗。

**FRs covered:** FR8, FR43, FR44, FR45, FR46, FR47

**技術需求：**
- 關聯資料模型設計
- 地點/人物/時間關聯邏輯
- 相關事件跳轉與視覺引導
- 跨朝代探索功能

### Epic 8: 無障礙與響應式設計
所有使用者（包括使用鍵盤、螢幕閱讀器、平板裝置）都能使用系統，系統提供完整的鍵盤導覽、ARIA 標示、響應式設計支援。

**FRs covered:** FR32, FR33, FR34, FR35, FR36, FR42, FR48, FR49, FR50

**技術需求：**
- WCAG 2.1 AA 合規
- 鍵盤導覽實作
- ARIA 標示與 live regions
- 響應式設計（桌面優先、平板適配）
- 跨瀏覽器相容性（Chrome、Safari）

### Epic 9: 部署與發布
系統可以部署到 Cloudflare Pages 並透過 GitHub 自動部署，使用者可以透過網際網路訪問系統。

**技術需求：**
- Cloudflare Pages 部署設定
- GitHub 自動部署整合
- SPA fallback 設定
- 快取策略配置
- 錯誤處理與監控

---

## Epic 1: 專案基礎設施與資料載入

使用者可以透過系統載入並查看完整的金庸事件資料，包括全 15 部作品、跨朝代（春秋～清乾隆）的完整時空脈絡，以及每個事件的地理座標、朝代、歷史時期和小說作品資訊。

**FRs covered:** FR22, FR23, FR26, FR27, FR28

### Story 1.1: Angular 專案初始化與基礎架構

As a **開發者**,
I want **建立 Angular 20+ Standalone Components 專案並安裝核心依賴**,
So that **我可以開始開發 jymap 應用程式並使用所需的技術棧**.

**Acceptance Criteria:**

**Given** 開發環境已安裝 Node.js 20.x LTS 和 Angular CLI
**When** 執行 `ng new jymap --routing --style=scss --standalone`
**Then** 專案成功建立，包含 Standalone Components 架構、路由設定和 SCSS 樣式支援
**And** 專案結構符合 Angular 20+ 最佳實踐

**Given** 專案已建立
**When** 執行 `ng add @angular/material`
**Then** Angular Material 成功整合，包含主題系統和基礎元件
**And** Material 設定檔案已建立（theme, typography, animations）

**Given** 專案已建立
**When** 執行 `npm install @ngrx/store @ngrx/effects @ngrx/store-devtools`
**Then** NgRx 狀態管理套件成功安裝
**And** NgRx Store、Effects 和 DevTools 可用於後續開發

**Given** 專案已建立
**When** 執行 `npm install @asymmetrik/ngx-leaflet leaflet @types/leaflet --save-dev`
**Then** ngx-leaflet 和 Leaflet 地圖庫成功安裝
**And** Leaflet TypeScript 類型定義可用於型別檢查

**Given** 專案已建立
**When** 執行 `npm install fuse.js`
**Then** Fuse.js 搜尋庫成功安裝
**And** 可用於後續搜尋功能實作

**Given** 所有依賴已安裝
**When** 執行 `ng serve`
**Then** 開發伺服器成功啟動，應用程式可在瀏覽器中訪問
**And** 熱重載功能正常運作

### Story 1.2: 資料模型定義（TypeScript 介面）

As a **開發者**,
I want **定義 Event、MapMarker、TimelineItem 等核心資料模型的 TypeScript 介面**,
So that **系統可以正確處理和型別檢查金庸事件資料**.

**Acceptance Criteria:**

**Given** Angular 專案已初始化
**When** 建立 `src/app/core/models/event.model.ts`
**Then** 定義 `Event` 介面，包含以下欄位：
  - `id: string`（事件唯一識別碼）
  - `title: string`（事件標題）
  - `dynasty: string`（朝代名稱）
  - `year: number`（年份）
  - `lat: number`（緯度）
  - `lng: number`（經度）
  - `novel: string`（對應小說作品）
  - `characters: string[]`（相關人物陣列）
  - `sources: string[]`（資料來源連結陣列）
  - `tags: string[]`（標籤陣列）
  - `description?: string`（歷史事件描述，可選）
  - `summary?: string`（小說情節摘要，可選）
**And** 所有欄位都有適當的 TypeScript 型別註解

**Given** Event 模型已定義
**When** 建立 `src/app/core/models/map-marker.model.ts`
**Then** 定義 `MapMarker` 介面，包含以下欄位：
  - `eventId: string`（對應的事件 ID）
  - `lat: number`（緯度）
  - `lng: number`（經度）
  - `color?: string`（標記顏色，可選）
  - `icon?: string`（標記圖示，可選）
  - `clusterId?: string`（聚合 ID，可選）
**And** MapMarker 與 Event 模型有適當的關聯

**Given** Event 模型已定義
**When** 建立 `src/app/core/models/timeline-item.model.ts`
**Then** 定義 `TimelineItem` 介面，包含以下欄位：
  - `year: number`（年份）
  - `dynasty: string`（朝代名稱）
  - `eventIds: string[]`（該時間點的事件 ID 陣列）
**And** TimelineItem 與 Event 模型有適當的關聯

**Given** 所有模型已定義
**When** 建立 `src/app/core/models/index.ts`
**Then** 匯出所有模型介面，方便其他模組匯入使用
**And** TypeScript 編譯器可以正確解析所有型別

**Given** 模型定義完成
**When** 執行 `ng build`
**Then** 專案成功編譯，無型別錯誤
**And** 所有模型介面可在專案中正常使用

### Story 1.3: 資料載入服務實作

As a **使用者**,
I want **系統能夠從靜態 JSON 檔案載入金庸事件資料**,
So that **我可以在地圖和時間軸上查看完整的事件資訊**.

**Acceptance Criteria:**

**Given** 資料模型已定義
**When** 建立 `src/app/core/services/data.service.ts`
**Then** 實作 `DataService` 類別，使用 Angular `HttpClient` 載入資料
**And** 服務使用 `providedIn: 'root'` 作為單例服務

**Given** DataService 已建立
**When** 建立 `src/assets/data/events.json` 檔案
**Then** JSON 檔案包含符合 `Event[]` 格式的事件資料
**And** 資料涵蓋全 15 部金庸作品的事件（FR22）
**And** 資料涵蓋跨朝代（春秋～清乾隆）的完整時空脈絡（FR23）

**Given** DataService 已建立
**When** 建立 `src/assets/data/timeline.json` 檔案
**Then** JSON 檔案包含符合 `TimelineItem[]` 格式的時間軸資料
**And** 時間軸資料與事件資料正確關聯

**Given** DataService 已建立
**When** 實作 `loadEvents()` 方法
**Then** 方法從 `/assets/data/events.json` 載入事件資料
**And** 方法返回 `Observable<Event[]>`
**And** 載入的資料符合 `Event[]` 型別

**Given** DataService 已建立
**When** 實作 `loadTimeline()` 方法
**Then** 方法從 `/assets/data/timeline.json` 載入時間軸資料
**And** 方法返回 `Observable<TimelineItem[]>`
**And** 載入的資料符合 `TimelineItem[]` 型別

**Given** DataService 已實作
**When** 在應用程式啟動時呼叫資料載入方法
**Then** 資料成功載入並可在應用程式中使用
**And** 載入的資料包含每個事件的地理座標資訊（FR26）
**And** 載入的資料包含每個事件的朝代與歷史時期資訊（FR27）
**And** 載入的資料包含每個事件對應的小說作品資訊（FR28）

### Story 1.4: 資料驗證與錯誤處理

As a **使用者**,
I want **系統能夠驗證載入的資料並處理錯誤情況**,
So that **我可以獲得可靠的資料體驗，即使資料載入失敗也能看到清楚的錯誤訊息**.

**Acceptance Criteria:**

**Given** DataService 已實作
**When** 實作資料驗證邏輯
**Then** 驗證每個事件的必填欄位（id, title, dynasty, year, lat, lng, novel）
**And** 驗證地理座標的有效性（緯度 -90 到 90，經度 -180 到 180）
**And** 驗證時間資料的有效性（年份在合理範圍內，朝代名稱不為空）

**Given** 資料驗證邏輯已實作
**When** 載入的資料包含無效座標
**Then** 系統標記該事件為「座標無效」
**And** 無效座標率 < 5%（NFR25）

**Given** 資料驗證邏輯已實作
**When** 載入的資料包含缺失欄位
**Then** 系統標記該事件為「資料不完整」
**And** 必填欄位覆蓋率 ≥ 95%（NFR23）

**Given** DataService 已實作
**When** JSON 檔案載入失敗（檔案不存在、網路錯誤等）
**Then** 系統捕獲錯誤並顯示清楚的錯誤訊息
**And** 錯誤訊息包含「資料載入失敗」和重新載入選項
**And** 錯誤不會導致應用程式崩潰

**Given** DataService 已實作
**When** JSON 檔案格式錯誤（不符合預期結構）
**Then** 系統捕獲解析錯誤並顯示清楚的錯誤訊息
**And** 錯誤訊息指出資料格式問題
**And** 錯誤不會導致應用程式崩潰

**Given** 錯誤處理已實作
**When** 資料載入失敗
**Then** 使用者可以看到友好的錯誤訊息
**And** 使用者可以選擇重新載入資料
**And** 應用程式保持穩定，不會出現白屏或崩潰

**Given** 資料驗證與錯誤處理已實作
**When** 執行完整的資料載入流程
**Then** 所有驗證邏輯正常運作
**And** 錯誤處理機制正常運作
**And** 系統能夠處理各種邊緣情況（空資料、部分資料缺失、格式錯誤等）

---

## Epic 2: 地圖視覺化與基礎互動

使用者可以在地圖上看到 Old Maps 風格的歷史地圖底圖，並透過地圖縮放、平移和點擊標記來探索不同地理區域的事件。

**FRs covered:** FR6, FR7, FR29, FR30, FR31

### Story 2.1: ngx-leaflet 地圖組件整合

As a **開發者**,
I want **整合 ngx-leaflet 地圖庫並建立基本地圖組件**,
So that **我可以在應用程式中顯示互動式地圖**.

**Acceptance Criteria:**

**Given** Angular 專案已初始化且 ngx-leaflet 已安裝
**When** 建立 `src/app/features/map/components/map-container.component.ts`
**Then** 組件使用 Standalone Components 架構
**And** 組件匯入必要的 ngx-leaflet 模組（LeafletModule）

**Given** MapContainerComponent 已建立
**When** 在組件模板中實作 `<div leaflet>` 元素
**Then** Leaflet 地圖容器成功渲染
**And** 地圖具有預設的中心點（例如：中國中心位置，約 lat: 35, lng: 105）
**And** 地圖具有預設的縮放級別（例如：zoom: 5）

**Given** MapContainerComponent 已建立
**When** 在組件中實作地圖初始化邏輯
**Then** 地圖在組件 `ngAfterViewInit` 時正確初始化
**And** 地圖實例可以透過 `@ViewChild` 或服務存取

**Given** 地圖組件已實作
**When** 將組件加入主頁面
**Then** 地圖成功顯示在應用程式中
**And** 地圖佔據適當的容器大小（例如：1000x600px）
**And** 地圖響應式設計正常運作

**Given** 地圖組件已整合
**When** 執行應用程式
**Then** 地圖正常載入，無 JavaScript 錯誤
**And** Leaflet CSS 樣式正確載入
**And** 地圖控制項（縮放按鈕、屬性標示）正常顯示

### Story 2.2: Old Maps 風格底圖整合

As a **使用者**,
I want **在地圖上看到 Old Maps 風格的歷史地圖底圖**,
So that **我可以體驗沉浸式的歷史地圖探索**.

**Acceptance Criteria:**

**Given** 地圖組件已建立
**When** 整合 Old Maps 風格的底圖圖層（例如：使用 Stamen Maps 的 Watercolor 風格或自訂圖層）
**Then** 地圖底圖呈現復古風格（紙張紋理、褪色效果、手繪風格）（FR29）
**And** 底圖風格符合歷史地圖的視覺特徵

**Given** Old Maps 底圖已整合
**When** 載入地圖
**Then** 底圖正常顯示，無載入錯誤
**And** 底圖圖層可以正常縮放和平移
**And** 底圖在不同縮放級別下保持清晰度

**Given** Old Maps 底圖已整合
**When** 使用者瀏覽地圖
**Then** 底圖風格不影響地圖的可讀性（NFR35）
**And** 底圖與標記有足夠的對比度（符合 WCAG 2.1 AA 標準）
**And** 底圖載入時間符合首屏載入 < 2.5s 的要求（NFR4）

**Given** Old Maps 底圖已整合
**When** 地圖在不同瀏覽器（Chrome、Safari）中顯示
**Then** 底圖在所有支援的瀏覽器中正常顯示（NFR28, NFR29）
**And** 底圖樣式保持一致

### Story 2.3: 事件標記渲染與樣式

As a **使用者**,
I want **在地圖上看到略帶中國水墨風格的標記，並能流暢渲染 100+ 事件標記**,
So that **我可以視覺化地探索金庸事件的地理分佈**.

**Acceptance Criteria:**

**Given** 地圖組件已建立且資料服務可用
**When** 從 DataService 載入事件資料
**Then** 每個事件在地圖上顯示為標記
**And** 標記位置對應事件的經緯度座標（FR26）

**Given** 事件標記已渲染
**When** 標記樣式應用中國水墨風格
**Then** 標記使用略帶中國水墨風格的配色（例如：墨色、淡墨、水墨暈染效果）（FR30）
**And** 標記設計符合歷史地圖的視覺風格
**And** 標記與 Old Maps 底圖風格協調

**Given** 事件標記已渲染
**When** 地圖上顯示 100+ 事件標記
**Then** 所有標記正常渲染，無遺漏（FR31）
**And** 標記渲染保持流暢（互動 FPS ≥ 30fps）（NFR7）
**And** 地圖縮放和平移時標記保持正確位置

**Given** 事件標記已渲染
**When** 標記使用自訂圖示或樣式
**Then** 標記圖示清晰可見
**And** 標記大小適中，不遮擋地圖內容
**And** 標記在不同縮放級別下保持適當大小

**Given** 事件標記已渲染
**When** 地圖載入完成
**Then** 標記淡入動畫流暢（60fps，無卡頓或跳躍）（NFR8）
**And** 動畫時間符合 < 200ms 的要求（NFR3）

**Given** 事件標記已渲染
**When** 標記樣式應用完成
**Then** 標記與文字保持可讀性（NFR35）
**And** 標記對比度符合 WCAG 2.1 AA 標準（NFR15）

### Story 2.4: 地圖互動功能（縮放、平移、點擊）

As a **使用者**,
I want **透過地圖縮放、平移和點擊標記來探索不同地理區域的事件**,
So that **我可以主動探索金庸世界的地理分佈**.

**Acceptance Criteria:**

**Given** 地圖組件已建立
**When** 使用者使用滑鼠滾輪或觸控手勢縮放地圖
**Then** 地圖正常縮放，縮放動畫流暢（FR6）
**And** 縮放時保持互動 FPS ≥ 30fps（NFR2）
**And** 縮放範圍限制在合理範圍內（例如：zoom 3-15）

**Given** 地圖組件已建立
**When** 使用者拖曳地圖進行平移
**Then** 地圖正常平移，平移動畫流暢（FR6）
**And** 平移時保持互動 FPS ≥ 30fps（NFR2）
**And** 地圖邊界限制適當，避免過度平移

**Given** 地圖標記已渲染
**When** 使用者點擊地圖標記
**Then** 點擊事件正確觸發（FR7）
**And** 系統可以識別被點擊的標記對應的事件
**And** 點擊回應時間 < 500ms（NFR5）

**Given** 地圖互動功能已實作
**When** 使用者在桌面瀏覽器中使用地圖
**Then** 滑鼠操作（點擊、拖曳、滾輪縮放）正常運作
**And** 互動體驗流暢，無延遲感

**Given** 地圖互動功能已實作
**When** 使用者在平板裝置（iPad）上使用地圖
**Then** 觸控手勢（點擊、拖曳、雙指縮放）正常運作（NFR32）
**And** 觸控精度足夠，不會誤觸（NFR31）
**And** 響應式設計適配平板螢幕（NFR30）

**Given** 地圖互動功能已實作
**When** 使用者進行各種地圖操作
**Then** 所有互動功能在 Chrome 和 Safari 瀏覽器中正常運作（NFR28, NFR29）
**And** 長時間使用（30 分鐘以上）保持效能穩定（NFR27）

---

## Epic 3: 時間軸互動與視覺化

使用者可以透過水平拖曳時間軸探索不同歷史時期，並可以框選時間範圍來過濾顯示該時間段內的事件標記。

**FRs covered:** FR1, FR3

### Story 3.1: 時間軸組件基礎結構與視覺化

As a **開發者**,
I want **建立時間軸組件的基礎結構與視覺化**,
So that **我可以在應用程式中顯示水平時間軸**.

**Acceptance Criteria:**

**Given** Angular 專案已初始化
**When** 建立 `src/app/features/timeline/components/timeline-container.component.ts`
**Then** 組件使用 Standalone Components 架構
**And** 組件可以接收時間軸資料（TimelineItem[]）作為輸入

**Given** TimelineContainerComponent 已建立
**When** 在組件模板中實作水平時間軸容器
**Then** 時間軸容器水平顯示（例如：1360x160px）
**And** 時間軸容器位於頁面底部（根據 wireframe 設計）
**And** 時間軸容器響應式設計，適配桌面與平板（NFR30）

**Given** TimelineContainerComponent 已建立
**When** 從 DataService 載入時間軸資料
**Then** 時間軸顯示跨朝代（春秋～清乾隆）的完整時空脈絡（FR23）
**And** 時間軸涵蓋歷史時期範圍（春秋前 473 年～清乾隆 18 世紀）（FR1）
**And** 時間軸資料正確映射到視覺化

**Given** 時間軸組件已建立
**When** 時間軸視覺化完成
**Then** 時間軸顯示年份刻度
**And** 年份刻度清晰可讀
**And** 時間軸樣式符合 Old Maps + 水墨風格設計

**Given** 時間軸組件已建立
**When** 將組件加入主頁面
**Then** 時間軸成功顯示在應用程式中
**And** 時間軸與地圖組件正確並列顯示
**And** 時間軸在首屏載入時正常顯示（FR41）

### Story 3.2: 朝代視覺帶設計與顯示

As a **使用者**,
I want **在時間軸上看到朝代視覺帶**,
So that **我可以快速識別不同歷史時期的分界**.

**Acceptance Criteria:**

**Given** 時間軸組件已建立
**When** 實作朝代視覺帶功能
**Then** 時間軸上顯示朝代視覺帶（例如：春秋 | 北宋 | 南宋 | 元 | 明 | 清）
**And** 每個朝代有獨立的視覺區塊（顏色或樣式區分）

**Given** 朝代視覺帶已實作
**When** 朝代視覺帶顯示
**Then** 朝代標籤清晰可讀
**And** 朝代區塊與年份刻度正確對齊
**And** 朝代視覺帶樣式符合 Old Maps + 水墨風格設計（FR30）

**Given** 朝代視覺帶已實作
**When** 時間軸資料包含多個朝代
**Then** 所有朝代都正確顯示在視覺帶中
**And** 朝代之間的邊界清晰可見
**And** 朝代視覺帶與時間軸整體設計協調

**Given** 朝代視覺帶已實作
**When** 時間軸在不同縮放級別下顯示
**Then** 朝代視覺帶保持清晰可見
**And** 朝代標籤在適當的縮放級別下顯示（避免過度擁擠）

**Given** 朝代視覺帶已實作
**When** 朝代視覺帶顯示完成
**Then** 視覺帶樣式符合 WCAG 2.1 AA 對比度標準（NFR15）
**And** 視覺帶在不同瀏覽器（Chrome、Safari）中正常顯示（NFR28, NFR29）

### Story 3.3: 水平拖曳互動功能

As a **使用者**,
I want **透過水平拖曳時間軸來探索不同歷史時期**,
So that **我可以主動探索金庸世界的時間脈絡**.

**Acceptance Criteria:**

**Given** 時間軸組件已建立
**When** 實作水平拖曳功能
**Then** 使用者可以透過滑鼠拖曳時間軸（桌面）
**And** 使用者可以透過觸控拖曳時間軸（平板）（NFR32）
**And** 拖曳時時間軸平滑移動，無卡頓

**Given** 水平拖曳功能已實作
**When** 使用者拖曳時間軸
**Then** 時間軸可以水平移動，顯示不同時間範圍（FR1）
**And** 拖曳時保持互動 FPS ≥ 30fps（NFR2）
**And** 拖曳範圍限制在有效時間範圍內（春秋前 473 年～清乾隆 18 世紀）

**Given** 水平拖曳功能已實作
**When** 使用者拖曳時間軸
**Then** 當前選中的時間位置正確顯示
**And** 年份刻度在拖曳時保持正確對齊
**And** 拖曳結束後時間軸位置穩定

**Given** 水平拖曳功能已實作
**When** 使用者在桌面瀏覽器中使用時間軸
**Then** 滑鼠拖曳操作正常運作
**And** 拖曳體驗流暢，無延遲感

**Given** 水平拖曳功能已實作
**When** 使用者在平板裝置（iPad）上使用時間軸
**Then** 觸控拖曳操作正常運作（NFR32）
**And** 觸控精度足夠，不會誤觸（NFR31）
**And** 拖曳體驗與桌面一致

**Given** 水平拖曳功能已實作
**When** 使用者進行拖曳操作
**Then** 所有互動功能在 Chrome 和 Safari 瀏覽器中正常運作（NFR28, NFR29）
**And** 長時間使用（30 分鐘以上）保持效能穩定（NFR27）

### Story 3.4: 時間範圍選擇控件

As a **使用者**,
I want **在時間軸上框選時間範圍來過濾顯示該時間段內的事件標記**,
So that **我可以專注探索特定歷史時期的事件**.

**Acceptance Criteria:**

**Given** 時間軸組件已建立
**When** 實作時間範圍選擇控件
**Then** 使用者可以在時間軸上框選時間範圍（FR3）
**And** 框選操作可以透過滑鼠拖曳（桌面）或觸控（平板）完成

**Given** 時間範圍選擇控件已實作
**When** 使用者框選時間範圍
**Then** 選中的時間範圍有視覺反饋（例如：高亮顯示、邊框標示）
**And** 選中的時間範圍顯示起始年份和結束年份
**And** 框選範圍可以調整（拖曳邊界調整範圍大小）

**Given** 時間範圍選擇控件已實作
**When** 使用者框選時間範圍
**Then** 系統可以識別選中的時間範圍（yearStart, yearEnd）
**And** 時間範圍資料可以透過事件或服務傳遞給其他組件
**And** 時間範圍選擇與朝代視覺帶正確對齊

**Given** 時間範圍選擇控件已實作
**When** 使用者清除時間範圍選擇
**Then** 時間範圍選擇可以取消（點擊外部或清除按鈕）
**And** 取消後時間軸恢復到預設狀態
**And** 視覺反饋正確清除

**Given** 時間範圍選擇控件已實作
**When** 使用者在桌面瀏覽器中使用範圍選擇
**Then** 滑鼠框選操作正常運作
**And** 框選體驗流暢，無延遲感

**Given** 時間範圍選擇控件已實作
**When** 使用者在平板裝置（iPad）上使用範圍選擇
**Then** 觸控框選操作正常運作（NFR32）
**And** 觸控精度足夠，不會誤觸（NFR31）
**And** 框選體驗與桌面一致

**Given** 時間範圍選擇控件已實作
**When** 使用者進行範圍選擇操作
**Then** 所有互動功能在 Chrome 和 Safari 瀏覽器中正常運作（NFR28, NFR29）
**And** 範圍選擇功能符合無障礙要求（鍵盤可操作、ARIA 標示）（NFR11, NFR16）

---

## Epic 4: 時空同步互動

使用者可以透過拖曳時間軸即時看到地圖上對應的事件標記更新，標記會隨時間軸變化而淡入淡出，實現流暢的時空同步體驗（<200ms 目標）。

**FRs covered:** FR4, FR5, FR37, FR39

### Story 4.1: NgRx 狀態管理設定（Store、Effects、DevTools）

As a **開發者**,
I want **設定 NgRx 狀態管理架構（Store、Effects、DevTools）**,
So that **我可以管理時間軸與地圖的同步狀態**.

**Acceptance Criteria:**

**Given** Angular 專案已初始化且 NgRx 已安裝
**When** 建立 `src/app/core/store/app.state.ts`
**Then** 定義應用程式根狀態介面（AppState）
**And** 狀態包含核心狀態欄位：時間範圍（timeRange）、當前事件（currentEvent）、地圖視角（mapViewport）等
**And** 狀態結構遵循「僅承載核心狀態」原則（避免將大量圖層/事件狀態塞入 NgRx）

**Given** AppState 已定義
**When** 建立 `src/app/core/store/timeline/timeline.reducer.ts`
**Then** 實作 TimelineReducer，管理時間軸相關狀態
**And** Reducer 處理時間範圍更新、當前年份變更等 actions
**And** Reducer 使用不可變更新模式（immutable updates）

**Given** TimelineReducer 已建立
**When** 建立 `src/app/core/store/timeline/timeline.actions.ts`
**Then** 定義時間軸相關 actions（例如：SetTimeRange, UpdateCurrentYear, SetTimeRangeSelection）
**And** Actions 使用強型別定義
**And** Actions 遵循 NgRx 最佳實踐

**Given** TimelineReducer 和 Actions 已建立
**When** 建立 `src/app/core/store/map/map.reducer.ts` 和 `map.actions.ts`
**Then** 實作 MapReducer 和 MapActions，管理地圖相關狀態
**And** Reducer 處理地圖視角更新、標記過濾等 actions

**Given** Reducers 已建立
**When** 在 `app.config.ts` 或 `main.ts` 中配置 NgRx Store
**Then** Store 成功初始化，包含所有 reducers
**And** Store 使用 `provideStore()` 或 `StoreModule.forRoot()` 配置

**Given** Store 已配置
**When** 安裝並配置 NgRx DevTools
**Then** DevTools 成功整合，可在瀏覽器中監控狀態變化
**And** DevTools 支援 time-travel debugging
**And** DevTools 僅在開發環境啟用

**Given** Store 和 DevTools 已配置
**When** 建立 `src/app/core/store/timeline/timeline.effects.ts`
**Then** 實作 TimelineEffects，處理時間軸相關的非同步操作
**And** Effects 使用 `createEffect()` 和 `inject()` 語法（Angular 15+）
**And** Effects 正確處理錯誤情況

**Given** Effects 已建立
**When** 在 Store 配置中註冊 Effects
**Then** Effects 成功註冊並正常運作
**And** Effects 可以監聽 actions 並執行副作用

**Given** NgRx 狀態管理已完整設定
**When** 執行應用程式
**Then** Store 正常運作，無 JavaScript 錯誤
**And** DevTools 可以正常監控狀態
**And** 狀態更新機制正常運作

### Story 4.2: 時間軸與地圖狀態同步機制

As a **使用者**,
I want **拖曳時間軸時地圖標記即時更新**,
So that **我可以看到時間與空間的同步變化**.

**Acceptance Criteria:**

**Given** NgRx Store 已設定且時間軸與地圖組件已建立
**When** 實作時間軸拖曳事件監聽
**Then** 時間軸拖曳時觸發 NgRx action（例如：UpdateCurrentYear）
**And** 拖曳事件使用 debounce 機制（避免過度觸發）

**Given** 時間軸拖曳事件已實作
**When** 實作兩層同步機制（根據 Pre-mortem 分析）
**Then** 「即時預覽」層：使用 Signals / RxJS 處理連續拖曳，UI 做輕量預覽
**And** 「停止後提交」層：拖曳結束後（debounce），才觸發 NgRx action 做完整 filter + render
**And** 兩層機制協同運作，確保流暢體驗

**Given** 時間軸拖曳事件已實作
**When** 時間軸狀態更新
**Then** 地圖組件透過 NgRx selector 訂閱時間軸狀態變化
**And** 地圖標記根據時間軸狀態即時過濾和更新（FR4）
**And** 同步延遲 < 200ms（從時間軸拖曳到地圖標記更新的時間）（FR37, NFR1）

**Given** 時間軸範圍選擇已實作（Epic 3 Story 3.4）
**When** 使用者框選時間範圍
**Then** 時間範圍選擇觸發 NgRx action（例如：SetTimeRangeSelection）
**And** 地圖標記根據時間範圍即時過濾（FR39）
**And** 過濾同步延遲 < 200ms（NFR1）

**Given** 狀態同步機制已實作
**When** 時間軸與地圖狀態同步
**Then** 同步過程保持互動 FPS ≥ 30fps（NFR2）
**And** 同步不會導致 UI 卡頓或白屏
**And** 同步機制在 Chrome 和 Safari 瀏覽器中正常運作（NFR28, NFR29）

**Given** 狀態同步機制已實作
**When** 使用者在桌面瀏覽器中使用同步功能
**Then** 滑鼠拖曳時間軸時地圖標記即時更新
**And** 同步體驗流暢，無延遲感

**Given** 狀態同步機制已實作
**When** 使用者在平板裝置（iPad）上使用同步功能
**Then** 觸控拖曳時間軸時地圖標記即時更新（NFR32）
**And** 同步體驗與桌面一致

**Given** 狀態同步機制已實作
**When** 長時間使用同步功能（30 分鐘以上）
**Then** 同步機制保持效能穩定（無記憶體洩漏、無效能衰退）（NFR27）
**And** 同步延遲保持 < 200ms

### Story 4.3: 標記淡入淡出動畫實作

As a **使用者**,
I want **看到事件標記隨時間軸變化而淡入淡出**,
So that **我可以視覺化地理解時間與事件的關係**.

**Acceptance Criteria:**

**Given** 地圖標記已渲染（Epic 2 Story 2.3）
**When** 實作標記淡入淡出動畫
**Then** 標記使用 CSS transitions 或 Angular animations 實作淡入淡出效果
**And** 動畫使用 GPU 加速（CSS transforms）確保效能

**Given** 標記淡入淡出動畫已實作
**When** 時間軸狀態變化導致標記顯示/隱藏
**Then** 新出現的標記執行淡入動畫（FR5）
**And** 消失的標記執行淡出動畫（FR5）
**And** 動畫流暢（60fps，無卡頓或跳躍）（NFR8）

**Given** 標記淡入淡出動畫已實作
**When** 標記動畫執行
**Then** 動畫時間符合 < 200ms 的要求（NFR3）
**And** 動畫不影響地圖互動（縮放、平移）
**And** 動畫與地圖標記渲染協調運作

**Given** 標記淡入淡出動畫已實作
**When** 多個標記同時執行動畫（100+ 標記）
**Then** 所有標記動畫正常執行，無遺漏
**And** 動畫保持流暢（60fps），無卡頓（NFR8）
**And** 動畫不影響整體互動 FPS（保持 ≥ 30fps）（NFR2）

**Given** 標記淡入淡出動畫已實作
**When** 標記動畫在不同瀏覽器中執行
**Then** 動畫在 Chrome 和 Safari 瀏覽器中正常運作（NFR28, NFR29）
**And** 動畫效果保持一致

**Given** 標記淡入淡出動畫已實作
**When** 標記動畫與時間軸同步機制協同運作
**Then** 動畫與狀態同步正確協調
**And** 動畫不影響同步延遲（保持 < 200ms）
**And** 整體體驗流暢，無視覺衝突

### Story 4.4: 效能優化與同步延遲控制（<200ms）

As a **使用者**,
I want **時間軸與地圖同步保持流暢且快速**,
So that **我可以享受即時探索的體驗，無卡頓感**.

**Acceptance Criteria:**

**Given** 時間軸與地圖狀態同步機制已實作
**When** 實作效能優化策略
**Then** NgRx store 僅承載核心狀態（時間範圍、當前事件、當前 viewport）
**And** Heavy 計算（標記過濾、排序）在 selector 或 service 層處理，不在 reducer 中
**And** 使用 memoized selectors 避免不必要的重新計算

**Given** 效能優化策略已實作
**When** 時間軸拖曳觸發狀態更新
**Then** 同步延遲 < 200ms（從時間軸拖曳到地圖標記更新的時間）（FR37, NFR1）
**And** 同步過程保持互動 FPS ≥ 30fps（NFR2）
**And** 同步不會導致 UI 卡頓

**Given** 效能優化策略已實作
**When** 地圖上顯示 100+ 事件標記
**Then** 標記過濾和更新保持流暢（互動 FPS ≥ 30fps）（NFR7）
**And** 同步延遲仍保持 < 200ms
**And** 標記渲染無遺漏

**Given** 效能優化策略已實作
**When** 進行壓力測試（150-200 個標記）
**Then** 同步延遲仍保持 < 200ms
**And** 互動 FPS 保持 ≥ 30fps
**And** 系統無記憶體洩漏或效能衰退

**Given** 效能優化策略已實作
**When** 時間軸快速連續拖曳
**Then** debounce 機制正確運作，避免過度觸發
**And** 即時預覽層提供流暢的視覺反饋
**And** 停止後提交層確保最終狀態正確

**Given** 效能優化策略已實作
**When** 使用者在桌面瀏覽器中使用同步功能
**Then** 同步體驗流暢，無延遲感
**And** 效能指標符合所有 NFR 要求

**Given** 效能優化策略已實作
**When** 使用者在平板裝置（iPad）上使用同步功能
**Then** 同步體驗與桌面一致
**And** 效能指標符合所有 NFR 要求

**Given** 效能優化策略已實作
**When** 長時間使用同步功能（30 分鐘以上）
**Then** 同步延遲保持 < 200ms（NFR27）
**And** 互動 FPS 保持 ≥ 30fps（NFR27）
**And** 系統無記憶體洩漏或效能衰退（NFR27）

**Given** 效能優化策略已實作
**When** 所有同步功能協同運作
**Then** 整體同步體驗流暢，無卡頓或延遲感
**And** 所有效能指標符合 NFR 要求
**And** 系統在 Chrome 和 Safari 瀏覽器中穩定運作（NFR28, NFR29）

---

## Epic 5: 搜尋與內容發現

使用者可以透過搜尋框輸入關鍵字（地點、事件、人物、小說名稱）進行模糊搜尋，查看搜尋結果列表，並點擊結果自動跳轉到對應的時間軸位置與地圖標記。

**FRs covered:** FR2, FR9, FR10, FR11, FR12, FR13, FR38

### Story 5.1: 搜尋框組件與 Fuse.js 整合

As a **使用者**,
I want **透過搜尋框輸入關鍵字進行模糊搜尋**,
So that **我可以快速找到相關的事件、地點、人物或小說**.

**Acceptance Criteria:**

**Given** Angular 專案已初始化且 Fuse.js 已安裝
**When** 建立 `src/app/features/search/components/search-box.component.ts`
**Then** 組件使用 Standalone Components 架構
**And** 組件包含搜尋輸入框（使用 Angular Material Input 或自訂輸入框）

**Given** SearchBoxComponent 已建立
**When** 在組件模板中實作搜尋輸入框
**Then** 搜尋框位於頁面頂部（根據 wireframe 設計，例如：600x60px）
**And** 搜尋框具有適當的樣式（符合 Old Maps + 水墨風格設計）
**And** 搜尋框具有 placeholder 提示文字（例如：「搜尋地點、事件、人物、小說名稱」）

**Given** SearchBoxComponent 已建立
**When** 建立 `src/app/core/services/search.service.ts`
**Then** 實作 SearchService，使用 Fuse.js 進行模糊搜尋
**And** 服務使用 `providedIn: 'root'` 作為單例服務
**And** 服務接收事件資料（Event[]）作為搜尋資料來源

**Given** SearchService 已建立
**When** 配置 Fuse.js 搜尋選項
**Then** 搜尋支援多欄位搜尋（title, dynasty, novel, characters, tags 等）
**And** 搜尋支援模糊匹配（部分匹配、同義詞）（NFR33）
**And** 搜尋支援繁體/簡體中文（NFR33）

**Given** SearchService 已建立
**When** 實作 `search(keyword: string)` 方法
**Then** 方法接收搜尋關鍵字並返回搜尋結果
**And** 方法返回 `Observable<SearchResult[]>` 或 `SearchResult[]`
**And** 搜尋結果包含匹配的事件、地點、人物或小說資訊（FR10）

**Given** SearchService 已實作
**When** 在 SearchBoxComponent 中整合 SearchService
**Then** 使用者輸入關鍵字時觸發搜尋
**And** 搜尋使用 debounce 機制（避免過度觸發）
**And** 搜尋結果可以透過 Observable 或 Signal 傳遞給其他組件

**Given** 搜尋框組件已整合
**When** 使用者輸入搜尋關鍵字
**Then** 搜尋功能正常運作，無 JavaScript 錯誤
**And** 搜尋框樣式符合設計要求
**And** 搜尋框響應式設計適配桌面與平板（NFR30）

### Story 5.2: 搜尋結果列表顯示與排序

As a **使用者**,
I want **查看搜尋結果列表並快速識別最相關的結果**,
So that **我可以找到最符合搜尋意圖的內容**.

**Acceptance Criteria:**

**Given** 搜尋框組件已建立
**When** 建立 `src/app/features/search/components/search-results.component.ts`
**Then** 組件使用 Standalone Components 架構
**And** 組件接收搜尋結果作為輸入

**Given** SearchResultsComponent 已建立
**When** 在組件模板中實作搜尋結果列表
**Then** 搜尋結果以列表形式顯示（使用 Angular Material List 或自訂列表）
**And** 列表顯示匹配的事件、地點、人物或小說（FR10）
**And** 每個結果項目顯示相關資訊（標題、朝代、小說作品等）

**Given** SearchResultsComponent 已建立
**When** 實作搜尋結果排序功能
**Then** 搜尋結果按相關性排序（最相關的結果排在前面）
**And** 排序演算法確保 Top-3 命中率 ≥ 80%（NFR34, FR13）
**And** 排序結果在 < 300ms 內完成（NFR10）

**Given** 搜尋結果列表已實作
**When** 搜尋結果顯示
**Then** 每個結果項目顯示事件所屬的朝代資訊（FR12）
**And** 每個結果項目顯示對應的小說作品資訊（FR12）
**And** 結果項目樣式清晰可讀，符合設計要求

**Given** 搜尋結果列表已實作
**When** 搜尋結果數量較多
**Then** 列表支援滾動查看所有結果
**And** 列表使用虛擬滾動（如需要）以提升效能
**And** 列表樣式符合 Old Maps + 水墨風格設計

**Given** 搜尋結果列表已實作
**When** 搜尋無結果
**Then** 顯示「無搜尋結果」的友好訊息
**And** 提供搜尋建議或替代關鍵字（如需要）

**Given** 搜尋結果列表已實作
**When** 搜尋結果顯示完成
**Then** 列表響應式設計適配桌面與平板（NFR30）
**And** 列表在 Chrome 和 Safari 瀏覽器中正常顯示（NFR28, NFR29）

### Story 5.3: 搜尋結果與時間軸/地圖同步跳轉

As a **使用者**,
I want **點擊搜尋結果自動跳轉到對應的時間軸位置與地圖標記**,
So that **我可以快速查看搜尋結果的時空位置**.

**Acceptance Criteria:**

**Given** 搜尋結果列表已建立且時間軸與地圖組件已建立
**When** 實作搜尋結果點擊事件
**Then** 點擊搜尋結果觸發跳轉邏輯
**And** 跳轉邏輯識別結果對應的事件 ID 和時間/位置資訊

**Given** 搜尋結果點擊事件已實作
**When** 使用者點擊搜尋結果
**Then** 時間軸自動跳轉到對應的時間位置（FR2, FR11）
**And** 地圖自動縮放並高亮對應的事件標記（FR11, FR38）
**And** 跳轉過程流暢，無卡頓

**Given** 搜尋結果點擊事件已實作
**When** 使用者點擊搜尋結果
**Then** 地圖標記高亮狀態正確顯示（FR21）
**And** 高亮狀態清晰可見，符合設計要求
**And** 高亮狀態在適當時間後自動清除（如需要）

**Given** 搜尋結果點擊事件已實作
**When** 使用者點擊搜尋結果
**Then** 跳轉同步更新時間軸位置與地圖高亮（FR38）
**And** 同步過程保持互動 FPS ≥ 30fps（NFR2）
**And** 同步延遲符合效能要求

**Given** 搜尋結果點擊事件已實作
**When** 使用者點擊搜尋結果
**Then** 跳轉功能在桌面瀏覽器中正常運作
**And** 跳轉功能在平板裝置（iPad）中正常運作（NFR32）
**And** 跳轉體驗與桌面一致

**Given** 搜尋結果點擊事件已實作
**When** 使用者點擊搜尋結果
**Then** 跳轉功能在 Chrome 和 Safari 瀏覽器中正常運作（NFR28, NFR29）
**And** 跳轉功能符合無障礙要求（鍵盤可操作、ARIA 標示）（NFR11, NFR16）

**Given** 搜尋結果點擊事件已實作
**When** 使用者點擊搜尋結果後繼續搜尋
**Then** 新的搜尋結果可以正常點擊跳轉
**And** 跳轉邏輯正確處理多個搜尋結果的跳轉

### Story 5.4: 搜尋效能優化（<300ms 回應時間）

As a **使用者**,
I want **搜尋功能快速回應**,
So that **我可以即時看到搜尋結果，無等待感**.

**Acceptance Criteria:**

**Given** 搜尋功能已實作
**When** 實作搜尋效能優化
**Then** 搜尋首字節回應時間 < 300ms（從輸入第一個字元到顯示搜尋結果的時間）（FR6, NFR6）
**And** 搜尋結果排序與顯示在 < 300ms 內完成（NFR10）

**Given** 搜尋效能優化已實作
**When** 使用者輸入搜尋關鍵字
**Then** 搜尋使用 debounce 機制（例如：200-300ms），避免過度觸發
**And** debounce 時間平衡回應速度與搜尋準確性
**And** 搜尋在 debounce 後立即執行

**Given** 搜尋效能優化已實作
**When** Fuse.js 搜尋執行
**Then** Fuse.js 索引建立優化（在資料載入時預先建立索引）
**And** 搜尋使用預建立的索引，而非每次重新建立
**And** 索引建立時間不影響搜尋回應時間

**Given** 搜尋效能優化已實作
**When** 搜尋結果數量較多
**Then** 搜尋結果限制顯示數量（例如：最多顯示 20-30 個結果）
**And** 結果限制不影響 Top-3 命中率（≥ 80%）（NFR34, FR13）
**And** 結果限制提升列表渲染效能

**Given** 搜尋效能優化已實作
**When** 搜尋功能執行
**Then** 搜尋過程不阻塞 UI（使用非同步處理）
**And** 搜尋過程中顯示載入狀態（如需要）
**And** 搜尋完成後立即顯示結果

**Given** 搜尋效能優化已實作
**When** 進行搜尋效能測試
**Then** 搜尋首字節回應時間 < 300ms（NFR6）
**And** 搜尋結果排序時間 < 300ms（NFR10）
**And** 搜尋功能在 100+ 事件資料中保持效能

**Given** 搜尋效能優化已實作
**When** 使用者在桌面瀏覽器中使用搜尋功能
**Then** 搜尋回應時間符合 < 300ms 要求
**And** 搜尋體驗流暢，無延遲感

**Given** 搜尋效能優化已實作
**When** 使用者在平板裝置（iPad）上使用搜尋功能
**Then** 搜尋回應時間符合 < 300ms 要求
**And** 搜尋體驗與桌面一致

**Given** 搜尋效能優化已實作
**When** 長時間使用搜尋功能（30 分鐘以上）
**Then** 搜尋效能保持穩定（無記憶體洩漏、無效能衰退）（NFR27）
**And** 搜尋回應時間保持 < 300ms

---

## Epic 6-9: 待後續補充

**狀態說明：**  
根據依賴關係分析，Epic 1-5 構成核心功能基礎，已完成 Stories 創建。Epic 6-9 將在後續階段補充：

- **Epic 6: 事件詳情呈現** - 依賴 Epic 2（地圖標記）
- **Epic 7: 資料關聯與探索** - 依賴 Epic 6（事件卡片）
- **Epic 8: 無障礙與響應式設計** - 可與其他 Epic 並行，建議在核心功能完成後完善
- **Epic 9: 部署與發布** - 需要所有功能完成

**後續補充時機：**  
- 當核心 Epic（1-5）實作完成後
- 或根據開發進度需要時

**Epic 6-9 的 Epic 列表與 FR 覆蓋映射已在前面的章節中定義，待補充時可直接參考。**

