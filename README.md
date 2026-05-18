# jymap — 金庸世界時空地圖

將金庸十五部小說的傳奇故事，交織在同一張互動地圖上。拖曳時間軸，看見江湖隨朝代變遷；點擊標記，翻開情節與人物的交會瞬間。

## 為何有趣

金庸筆下的江湖並非架空——郭靖守襄陽是真實的宋蒙戰爭，張無忌的明教映射元末群雄，陳家洛的紅花會與乾隆朝息息相關。jymap 讓這些跨越千年的故事在同一張畫布上展開，從春秋越女到清廷秘聞，一覽武俠世界的時空全貌。

## 功能

| 功能 | 說明 |
|------|------|
| 🗺️ 互動地圖 | Leaflet 地圖，復古 Old Maps 風格，48 個事件標記散佈神州 |
| ⏳ 時間軸 | 春秋～清乾隆，14 個朝代視覺帶，支援拖曳與範圍選擇 |
| 🔗 時空同步 | 拖曳時間軸即時過濾地圖標記，<200ms 同步延遲 |
| 🔍 模糊搜尋 | Fuse.js 模糊搜尋，可搜事件、人物、小說、朝代 |
| 📜 事件卡片 | 側邊抽屜展示歷史描述、小說情節、人物、來源、相關事件 |
| 🖌️ 視覺風格 | 各作品專屬印章色標、Noto Serif TC 書法標題、水墨感設計 |

## 作品覆蓋

全 15 部作品、春秋到清乾隆、48 筆精選事件。

```
越女劍 → 天龍八部 → 射鵰英雄傳 → 神鵰俠侶 → 倚天屠龍記
→ 笑傲江湖 → 碧血劍 → 鹿鼎記 → 書劍恩仇錄 → 飛狐外傳
→ 雪山飛狐 → 連城訣 → 俠客行 → 白馬嘯西風 → 鴛鴦刀
```

## 技術棧

| 層級 | 技術 |
|------|------|
| 框架 | Angular 18 (Standalone) |
| 狀態管理 | NgRx (Store + Effects + Selectors) |
| 地圖 | Leaflet + Humanitarian OSM 圖磚 |
| 搜尋 | Fuse.js 模糊搜尋 |
| UI | Angular Material (MatSidenav) |
| 字體 | Noto Serif TC / Noto Sans TC |
| 部署 | Cloudflare Pages |

## 快速開始

```bash
cd webapp
npm install
npx ng serve --open
```

瀏覽器開啟 `http://localhost:4200`。

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
- [ ] 資料關聯與探索（地點/人物網路）
- [x] 響應式設計與無障礙 (已完成搜尋框行動版優化)
- [x] 部署與發布 (已部署至 Cloudflare Pages)
