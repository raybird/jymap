# jymap — 金庸世界時空地圖

將金庸十五部小說的傳奇故事，交織在同一張互動地圖上。拖曳時間軸，看見江湖隨朝代變遷；點擊標記，翻開情節與人物的交會瞬間。

## 為何有趣

金庸筆下的江湖並非架空——郭靖守襄陽是真實的宋蒙戰爭，張無忌的明教映射元末群雄，陳家洛的紅花會與乾隆朝息息相關。jymap 讓這些跨越千年的故事在同一張畫布上展開，從春秋越女到清廷秘聞，一覽武俠世界的時空全貌。

## 功能

| 功能 | 說明 |
|------|------|
| 🗺️ 互動地圖 | Leaflet 地圖，復古 Old Maps 風格，122 個事件標記散佈神州 |
| ⏳ 時間軸 | 春秋～清乾隆，14 個朝代視覺帶，支援拖曳與範圍選擇 |
| 🔗 時空同步 | 拖曳時間軸即時過濾地圖標記，<200ms 同步延遲 |
| 🔍 分類搜尋 | 人物、小說與事件分組呈現，跨作品查找不受地圖篩選限制 |
| 🧭 探索條件 | 顯示小說、人物、時間範圍與事件數，可個別解除或顯示全部 |
| ↩️ 探索返回 | 返回原先的搜尋結果、地圖視角、時間範圍與人物探索進度 |
| 👤 人物軌跡 | 年表與地圖同步，支援按年代上一件／下一件、查看詳情後返回 |
| 📜 事件卡片 | 側邊抽屜展示歷史描述、小說情節、人物、來源、相關事件 |
| 🖌️ 視覺風格 | 各作品專屬印章色標、Noto Serif TC 書法標題、水墨感設計 |

## 作品覆蓋

全 15 部作品、春秋到清乾隆、122 筆精選事件。

```
越女劍 → 天龍八部 → 射鵰英雄傳 → 神鵰俠侶 → 倚天屠龍記
→ 笑傲江湖 → 碧血劍 → 鹿鼎記 → 書劍恩仇錄 → 飛狐外傳
→ 雪山飛狐 → 連城訣 → 俠客行 → 白馬嘯西風 → 鴛鴦刀
```

## 技術棧

| 層級 | 技術 |
|------|------|
| 框架 | Angular 20 (Standalone) |
| 狀態管理 | NgRx (Store + Effects + Selectors) |
| 地圖 | Leaflet + Humanitarian OSM 圖磚 |
| 搜尋 | Fuse.js 模糊搜尋 |
| UI | Angular Material (MatSidenav) |
| 字體 | Noto Serif TC / Noto Sans TC |
| 部署 | GitHub Pages（GitHub Actions） |

## 快速開始

```bash
cd webapp
npm install
npx ng serve --open
```

瀏覽器開啟 `http://localhost:4200`。

## 驗證與部署

2026-10-29 更新：資料包含 122 筆事件、15 部作品與 231 個人物名稱。

```bash
cd webapp
npm run test:ci
npm run test:mobile
npm run build
```

測試需要可用的 Chrome；必要時以 `CHROME_BIN` 指定執行檔。整合測試涵蓋分類搜尋、跨小說導覽、探索返回、人物逐步導覽與篩選還原；地圖測試使用真實 Leaflet，不載入外部圖磚。`test:mobile` 以窄視窗重跑核心整合與版面測試，實際視窗尺寸會列在測試輸出中。

`.github/workflows/deploy.yml` 在推送 `main` 或手動執行時，依序安裝依賴、執行測試、生產建置，再發布至 GitHub Pages，網站基底路徑為 `/jymap/`。地圖圖磚與跨裝置操作仍需人工驗證：

1. 啟動網站，確認圖磚載入、拖曳與縮放正常。
2. 快速切換小說與時間範圍，再搜尋並點選事件，確認標記沒有殘留且移動完成後開啟正確事件。
3. 搜尋人物，使用上一件／下一件，開啟詳情後按返回，確認人物進度與原先搜尋結果都可恢復。
4. 在實際手機或 390px 以下視窗開啟詳情，確認底部面板可捲動、地圖焦點可見，並以觸控及鍵盤檢查搜尋選項。


## 專案結構

```
webapp/src/app/
├── core/
│   ├── models/          # 資料模型
│   ├── services/        # DataService, SearchService, RelatedEventsService
│   ├── state/           # NgRx actions, reducer, selectors, effects
│   └── utils/           # DataValidator, Logger
└── features/
    ├── map/             # 地圖容器、SVG 印章標記
    ├── timeline/        # 時間軸、朝代帶、事件分布點
    ├── search/          # 搜尋框、搜尋結果
    ├── character-detail/ # 人物年表與軌跡面板
    └── event-detail/    # 事件卡片
```

## 資料格式

專案的靜態資料存放於 `webapp/src/assets/data/`，主要由兩個 JSON 檔案組成：

### 1. `events.json` (事件詳細資料)
這是一個包含所有事件物件的陣列。每個事件的格式如下：

```json
{
  "id": "event-001",                   // 唯一識別碼 (格式為 event-NNN)
  "title": "靖康之禍",                  // 事件標題
  "dynasty": "北宋",                    // 歷史朝代
  "year": 1127,                        // 年份 (西元，負數表示西元前)
  "lat": 34.7974,                      // 地圖緯度
  "lng": 113.6484,                     // 地圖經度
  "novel": "射鵰英雄傳",                // 所屬金庸小說
  "characters": ["郭靖", "楊康"],       // 相關人物陣列
  "sources": ["https://..."],          // 資料來源連結陣列
  "tags": ["戰役", "歷史轉折"],         // 標籤，用於分類與搜尋
  "description": "北宋末年...",         // 詳細歷史或小說情節描述
  "summary": "射鵰英雄傳開篇背景..."     // 簡短摘要 (於列表或卡片預覽顯示)
}
```

### 2. `timeline.json` (時間軸關聯資料)
這是一個陣列，用來定義時間軸上的年份、朝代以及該年份所關聯的事件。格式如下：

```json
{
  "year": 1502,                        // 年份
  "dynasty": "明",                     // 當時代朝代
  "eventIds": ["event-032", "event-066"] // 該年份發生的事件 ID 陣列 (對應 events.json 的 id)
}
```

## 資料來源

事件資料整合自維基百科與社群整理的編年史，每筆事件保留來源連結供查證。

## 開發路線

- [x] 基礎設施與資料載入
- [x] 地圖視覺化與互動
- [x] 時間軸互動
- [x] 時空同步
- [x] 搜尋與內容發現
- [x] 事件詳情呈現
- [x] 人物軌跡與相關事件探索
- [ ] 地點與人物關係網路
- [x] 響應式設計與無障礙 (已完成搜尋框行動版優化)
- [x] 部署與發布 (GitHub Actions 部署至 GitHub Pages)

## 🔗 相關專案 (Related Projects)

| 專案 | 簡介 |
|------|------|
| [🗺️ cap-map](https://github.com/raybird/cap-map) | 專為臺灣國中會考社會科設計的互動式時空地圖，結合歷史時間軸與地理空間判讀，幫助學生建立立體史觀與強化地圖判讀能力。 |
| [⚔️ three-kingdoms-map](https://github.com/raybird/three-kingdoms-map) | 專為三國歷史愛好者設計的互動式時空地圖，涵蓋東漢末年至三國統一期間的史詩級歷史戰役、政治事件與人物軌跡。 |


---

*TeleNexus Studio | Raybird*
