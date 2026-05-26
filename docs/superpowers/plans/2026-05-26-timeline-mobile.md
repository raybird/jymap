# Timeline 手機板體驗改善實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `TimelineContainerComponent` 新增 year-indicator、center-needle、event stagger 三個機制，改善手機板年份感知、視覺錨點與事件點可點擊性。

**Architecture:** 所有改動集中於 `TimelineContainerComponent` 的 ts/html/scss 三個檔案。新增 `currentCenterYear` 屬性由 `onScroll()` 驅動 year-indicator 顯示；`getEventStaggerTop()` 為純函式，將同期事件上下錯位；center-needle 為純 CSS 裝飾。不動 Store、不新增元件。

**Tech Stack:** Angular 20 Standalone Components、SCSS、Karma + Jasmine

---

## 修改的檔案

| 檔案 | 操作 |
|------|------|
| `webapp/src/app/features/timeline/components/timeline-container.component.spec.ts` | 建立（新增單元測試） |
| `webapp/src/app/features/timeline/components/timeline-container.component.ts` | 修改（新增屬性與方法） |
| `webapp/src/app/features/timeline/components/timeline-container.component.html` | 修改（新增元素、binding、stagger） |
| `webapp/src/app/features/timeline/components/timeline-container.component.scss` | 修改（新增樣式、調整 event-dots/event-dot） |

---

## Task 1：`getEventStaggerTop()` 純函式邏輯（TDD）

**Files:**
- Create: `webapp/src/app/features/timeline/components/timeline-container.component.spec.ts`
- Modify: `webapp/src/app/features/timeline/components/timeline-container.component.ts`

- [ ] **Step 1：建立測試檔，寫失敗測試**

建立 `webapp/src/app/features/timeline/components/timeline-container.component.spec.ts`：

```typescript
import { TimelineContainerComponent } from './timeline-container.component';

describe('TimelineContainerComponent', () => {
  let component: TimelineContainerComponent;

  beforeEach(() => {
    component = new TimelineContainerComponent();
  });

  describe('getEventStaggerTop', () => {
    it('同 bucket 只有一個事件時回傳 50', () => {
      const dots = [{ year: 1200 }];
      expect(component.getEventStaggerTop(dots[0], dots)).toBe(50);
    });

    it('同 bucket 兩個事件回傳不同垂直位置', () => {
      const dots = [{ year: 1200 }, { year: 1203 }];
      expect(component.getEventStaggerTop(dots[0], dots)).toBe(30);
      expect(component.getEventStaggerTop(dots[1], dots)).toBe(70);
    });

    it('不同 bucket 的事件各自獨立，各回傳 50', () => {
      const dots = [{ year: 1200 }, { year: 1210 }];
      expect(component.getEventStaggerTop(dots[0], dots)).toBe(50);
      expect(component.getEventStaggerTop(dots[1], dots)).toBe(50);
    });

    it('同 bucket 五個事件使用完整 positions 陣列', () => {
      const dots = [
        { year: 1200 }, { year: 1201 }, { year: 1202 }, { year: 1203 }, { year: 1204 }
      ];
      expect(component.getEventStaggerTop(dots[0], dots)).toBe(30);
      expect(component.getEventStaggerTop(dots[1], dots)).toBe(70);
      expect(component.getEventStaggerTop(dots[2], dots)).toBe(15);
      expect(component.getEventStaggerTop(dots[3], dots)).toBe(85);
      expect(component.getEventStaggerTop(dots[4], dots)).toBe(50);
    });
  });
});
```

- [ ] **Step 2：執行測試確認失敗**

```bash
cd webapp
ng test --watch=false --browsers=ChromeHeadless --include='**/timeline-container.component.spec.ts' 2>&1 | tail -15
```

預期：`FAILED` — `component.getEventStaggerTop is not a function`

- [ ] **Step 3：在 component 新增 `getEventStaggerTop()` 方法**

在 `timeline-container.component.ts` 的 `getNovelColor()` 方法之前（目前 line 515），新增：

```typescript
getEventStaggerTop(dot: { year: number }, dots: { year: number }[]): number {
  const bucket = Math.floor(dot.year / 5) * 5;
  const inBucket = dots.filter(d => Math.floor(d.year / 5) * 5 === bucket);
  const idx = inBucket.indexOf(dot);
  if (inBucket.length <= 1) return 50;
  const positions = [30, 70, 15, 85, 50];
  return positions[idx % positions.length];
}
```

- [ ] **Step 4：執行測試確認通過**

```bash
ng test --watch=false --browsers=ChromeHeadless --include='**/timeline-container.component.spec.ts' 2>&1 | tail -10
```

預期：`TOTAL: 4 SUCCESS`

- [ ] **Step 5：Commit**

```bash
cd ..
git add webapp/src/app/features/timeline/components/timeline-container.component.spec.ts \
        webapp/src/app/features/timeline/components/timeline-container.component.ts
git commit -m "feat(timeline): 新增 getEventStaggerTop 邏輯與單元測試"
```

---

## Task 2：`currentCenterYear` 屬性與 `onScroll()` 方法（TDD）

**Files:**
- Modify: `webapp/src/app/features/timeline/components/timeline-container.component.spec.ts`
- Modify: `webapp/src/app/features/timeline/components/timeline-container.component.ts`

- [ ] **Step 1：在測試檔補充 `onScroll` 測試**

在 `timeline-container.component.spec.ts` 的 `describe('TimelineContainerComponent'` 內，`describe('getEventStaggerTop'` 區塊之後新增：

```typescript
describe('onScroll', () => {
  it('timelineContainer 未初始化時不更新 currentCenterYear', () => {
    component.onScroll();
    expect(component.currentCenterYear).toBe(0);
  });

  it('捲動到中間位置時計算正確的中心年份', () => {
    (component as any).timelineContainer = {
      nativeElement: { scrollLeft: 5752, clientWidth: 375, scrollWidth: 11505 }
    };
    component.onScroll();
    expect(component.currentCenterYear).toBe(688);
  });

  it('捲動到最左邊時顯示最早的可見年份', () => {
    (component as any).timelineContainer = {
      nativeElement: { scrollLeft: 0, clientWidth: 375, scrollWidth: 11505 }
    };
    component.onScroll();
    expect(component.currentCenterYear).toBe(-462);
  });
});
```

- [ ] **Step 2：執行測試確認失敗**

```bash
cd webapp
ng test --watch=false --browsers=ChromeHeadless --include='**/timeline-container.component.spec.ts' 2>&1 | tail -15
```

預期：`FAILED` — `component.onScroll is not a function` 或 `currentCenterYear is not defined`

- [ ] **Step 3：在 component 新增 `currentCenterYear` 屬性與 `onScroll()` 方法**

在 `timeline-container.component.ts` 的 `private visibleRangeEmitter$` 宣告之後（目前 line 77），新增屬性：

```typescript
currentCenterYear = 0;
```

在 `getEventStaggerTop()` 之後（Task 1 新增的方法之後），新增方法：

```typescript
onScroll(): void {
  if (!this.timelineContainer) return;
  const el = this.timelineContainer.nativeElement;
  this.currentCenterYear = Math.round(
    this.minYear + ((el.scrollLeft + el.clientWidth / 2) / el.scrollWidth) * this.totalYears
  );
}
```

- [ ] **Step 4：執行測試確認全部通過**

```bash
ng test --watch=false --browsers=ChromeHeadless --include='**/timeline-container.component.spec.ts' 2>&1 | tail -10
```

預期：`TOTAL: 7 SUCCESS`

- [ ] **Step 5：Commit**

```bash
cd ..
git add webapp/src/app/features/timeline/components/timeline-container.component.spec.ts \
        webapp/src/app/features/timeline/components/timeline-container.component.ts
git commit -m "feat(timeline): 新增 currentCenterYear 屬性與 onScroll 方法"
```

---

## Task 3：更新 HTML Template

**Files:**
- Modify: `webapp/src/app/features/timeline/components/timeline-container.component.html`

- [ ] **Step 1：以下列內容完整取代 `timeline-container.component.html`**

```html
<div class="timeline-wrapper">
  @if (currentCenterYear !== 0) {
    <div class="year-indicator">
      {{ currentCenterYear < 0 ? '西元前' + (-currentCenterYear) + '年' : '西元' + currentCenterYear + '年' }}
    </div>
  }

  <div class="center-needle"></div>

  <div
    class="timeline-container"
    #timelineContainer
    [class.dragging]="isDragging"
    (scroll)="onScroll()">
    <div class="timeline-track" #timelineTrack>
      <div class="dynasty-bands">
        @for (band of dynastyBands; track band.name) {
          <div
            class="dynasty-band"
            [style.left]="getDynastyBandStyle(band).left"
            [style.width]="getDynastyBandStyle(band).width"
            [style.background-color]="band.color">
            <span class="dynasty-label">{{ band.name }}&nbsp;<span class="dynasty-years">{{ formatYear(band.startYear) }} ~ {{ formatYear(band.endYear) }}</span></span>
          </div>
        }
      </div>

      @let dots = getEventDots();
      <div class="event-dots">
        @for (dot of dots; track dot.id) {
          <div
            class="event-dot"
            [style.left]="getYearPosition(dot.year) + '%'"
            [style.top.%]="getEventStaggerTop(dot, dots)"
            [style.background-color]="dot.color"
            [title]="dot.title + ' (' + dot.novel + ')'"
            (click)="eventDotClick.emit(dot.id)">
          </div>
        }
      </div>

      <div class="year-ticks">
        @for (year of getYearTicks(); track year) {
          <div
            class="year-tick"
            [class.major-tick]="year % 100 === 0"
            [style.left]="getYearPosition(year) + '%'">
            @if (year % 100 === 0) {
              <span class="year-label">{{ formatYear(year) }}</span>
            }
          </div>
        }
      </div>

      @if (selectedStartYear !== null && selectedEndYear !== null) {
        <div
          class="time-selection"
          [style.left]="getSelectionStyle()?.left"
          [style.width]="getSelectionStyle()?.width">
          <div class="selection-handle selection-handle-start" title="拖曳調整起始時間"></div>
          <div class="selection-handle selection-handle-end" title="拖曳調整結束時間"></div>
          <div class="selection-label">
            <span>{{ formatYear(selectedStartYear) }} - {{ formatYear(selectedEndYear) }}</span>
            <button class="clear-selection" (click)="clearSelection()" aria-label="清除選擇">×</button>
          </div>
        </div>
      }
    </div>
  </div>
</div>
```

- [ ] **Step 2：執行 ng build 確認無編譯錯誤**

```bash
cd webapp
ng build 2>&1 | grep -E "error|Error|✔|✗"
```

預期：`✔ Building...`，無 `error` 輸出。

- [ ] **Step 3：Commit**

```bash
cd ..
git add webapp/src/app/features/timeline/components/timeline-container.component.html
git commit -m "feat(timeline): 新增 year-indicator、center-needle、event stagger HTML"
```

---

## Task 4：更新 SCSS 樣式

**Files:**
- Modify: `webapp/src/app/features/timeline/components/timeline-container.component.scss`

- [ ] **Step 1：在 `.timeline-wrapper` 區塊結束後（目前 line 9），新增 `year-indicator` 與 `center-needle` 樣式**

在 `.timeline-wrapper { ... }` 之後、`.timeline-container { ... }` 之前插入：

```scss
.year-indicator {
  position: absolute;
  top: 4px;
  right: 10px;
  z-index: 30;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(44, 36, 27, 0.8);
  font-family: var(--font-heading);
  pointer-events: none;
  letter-spacing: 0.5px;
}

.center-needle {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 12px;
  width: 2px;
  transform: translateX(-50%);
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(200, 164, 39, 0.55) 12%,
    rgba(200, 164, 39, 0.55) 85%,
    transparent 100%
  );
  z-index: 25;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 7px solid rgba(200, 164, 39, 0.8);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 7px solid rgba(200, 164, 39, 0.8);
  }
}
```

- [ ] **Step 2：修改 `.event-dots` 高度（目前 line 89）**

將：
```scss
  height: 44px; /* 必須與 ::after 熱區等高，否則超出部分被裁切 */
```
改為：
```scss
  height: 60px;
```

- [ ] **Step 3：移除 `.event-dot` 的 `top: 50%`（目前 line 97）**

將 `.event-dot` 區塊的 `top: 50%;` 這一行刪除。注意：`.event-dot::after` 內的 `top: 50%`（line 111）是 pseudo-element 的點擊熱區定位，**不要動**。

修改前：
```scss
.event-dot {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  ...
}
```

修改後：
```scss
.event-dot {
  position: absolute;
  transform: translate(-50%, -50%);
  ...
}
```

- [ ] **Step 4：執行 ng build 確認無錯誤**

```bash
cd webapp
ng build 2>&1 | grep -E "error|Error|✔|✗"
```

預期：`✔ Building...`，無 `error` 輸出。

- [ ] **Step 5：執行全部測試確認不影響現有功能**

```bash
ng test --watch=false --browsers=ChromeHeadless 2>&1 | tail -5
```

預期：`TOTAL: 33 SUCCESS`（原有 26 個 + Task 1/2 新增的 7 個）

- [ ] **Step 6：Commit**

```bash
cd ..
git add webapp/src/app/features/timeline/components/timeline-container.component.scss
git commit -m "feat(timeline): 新增 year-indicator、center-needle 樣式，調整 event-dot stagger 定位"
```
