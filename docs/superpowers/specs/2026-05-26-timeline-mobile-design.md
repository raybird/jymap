# Timeline 手機板體驗改善設計

**日期**：2026-05-26
**參考**：`~/Documents/RCodes/cap-map` 的 timeline 實作
**範圍**：`webapp/src/app/features/timeline/components/` 下的三個檔案

## 目標

改善 jymap timeline 在手機上的三個核心問題：
1. 捲動時不知道在哪個年份
2. 缺乏視覺錨點
3. 同期事件點重疊難以點擊

## 不在本次範圍

- Shift + 拖曳框選功能的手機替代方案（另立 issue）
- 其他元件的手機體驗

## 解決方案：移植 cap-map 三個機制

### 機制一：year-indicator（浮動年份指示器）

右上角浮動小字，捲動時即時顯示畫面中心對應的年份。只在 `currentCenterYear !== 0` 時顯示（初始值 0 代表尚未滾動）。

顯示格式與 `formatYear()` 一致：
- 西元前：`西元前N年`
- 西元後：`西元N年`

### 機制二：center-needle（中心針線）

畫面水平中心的金色垂直線，含上下兩個三角箭頭裝飾。`pointer-events: none`，不干擾任何互動。讓使用者直觀理解「捲動到中心線對準某個朝代帶時，就是在那個年代」。

### 機制三：event stagger（事件點上下錯位）

將事件點依 5 年為一個 bucket 分組，同 bucket 內的事件分配不同垂直百分比位置（`[15, 30, 50, 70, 85]%`），避免重疊、擴大可點擊面積。

## 改動範圍

僅修改 `TimelineContainerComponent` 的三個檔案，不新增元件，不動 Store 或其他元件。

## TypeScript 改動（`timeline-container.component.ts`）

### 新增屬性

```typescript
currentCenterYear = 0;
```

### 新增 `onScroll()` 方法

```typescript
onScroll(): void {
  if (!this.timelineContainer) return;
  const el = this.timelineContainer.nativeElement;
  this.currentCenterYear = Math.round(
    this.minYear + ((el.scrollLeft + el.clientWidth / 2) / el.scrollWidth) * this.totalYears
  );
}
```

### 新增 `getEventStaggerTop()` 方法

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

## HTML 改動（`timeline-container.component.html`）

1. 在 `.timeline-wrapper` 最頂層新增 `year-indicator` 與 `center-needle` 元素
2. `timeline-container` 加 `(scroll)="onScroll()"` binding
3. event-dots 區塊用 `@let dots = getEventDots()` 快取，避免每個 dot 重複呼叫
4. 每個 `event-dot` 加 `[style.top.%]="getEventStaggerTop(dot, dots)"`

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
      <!-- 朝代帶（不變） -->

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

      <!-- 年份刻度、選擇區域（不變） -->
    </div>
  </div>
</div>
```

## SCSS 改動（`timeline-container.component.scss`）

### 新增樣式

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
    width: 0; height: 0;
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
    width: 0; height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 7px solid rgba(200, 164, 39, 0.8);
  }
}
```

### 修改現有樣式

```scss
// .event-dots：高度從 44px 改為 60px，容納 stagger 垂直空間
.event-dots {
  height: 60px;
}

// .event-dot：移除 top: 50%，改由 [style.top.%] 的 stagger 控制
// transform 保留 translate(-50%, -50%) 維持圓心為錨點
.event-dot {
  // 移除：top: 50%;
}
```
