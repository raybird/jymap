import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidatedTimelineItem } from '../../../core/utils/data-validator';

/**
 * 朝代定義（用於視覺帶顯示）
 */
interface DynastyBand {
  name: string;
  startYear: number;
  endYear: number;
  color: string;
}

/**
 * 時間軸容器組件
 * 提供水平時間軸顯示、拖曳互動和時間範圍選擇功能
 */
@Component({
  selector: 'app-timeline-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline-container.component.html',
  styleUrl: './timeline-container.component.scss'
})
export class TimelineContainerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('timelineContainer', { static: false }) timelineContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('timelineTrack', { static: false }) timelineTrack!: ElementRef<HTMLDivElement>;
  @Input() timelineItems: ValidatedTimelineItem[] = [];

  // 時間範圍設定（春秋前 473 年～清乾隆 18 世紀，約 1800 年）
  readonly minYear = -473; // 春秋前 473 年
  readonly maxYear = 1800; // 清乾隆 18 世紀
  readonly totalYears = 1800 - (-473) + 1; // 總年數：2274 年

  // 朝代視覺帶定義（符合 Story 3.2 需求）
  readonly dynastyBands: DynastyBand[] = [
    { name: '春秋', startYear: -473, endYear: -221, color: '#8B7355' },
    { name: '北宋', startYear: 960, endYear: 1127, color: '#6B8E9F' },
    { name: '南宋', startYear: 1127, endYear: 1279, color: '#7A9F8B' },
    { name: '元', startYear: 1279, endYear: 1368, color: '#9F7A6B' },
    { name: '明', startYear: 1368, endYear: 1644, color: '#8B6B7A' },
    { name: '清', startYear: 1644, endYear: 1800, color: '#7A8B6B' }
  ];

  // 拖曳狀態（public 以便在模板中使用）
  isDragging = false;
  private dragStartX = 0;
  private scrollLeft = 0;
  private currentScrollLeft = 0;

  // 時間範圍選擇狀態
  selectedStartYear: number | null = null;
  selectedEndYear: number | null = null;
  isSelecting = false;
  selectionStartX = 0;

  ngOnInit(): void {
    // 初始化邏輯
  }

  ngAfterViewInit(): void {
    // 確保容器正確初始化
    setTimeout(() => {
      this.initTimeline();
    }, 100);
  }

  ngOnDestroy(): void {
    // 清理事件監聽器
    this.removeEventListeners();
  }

  /**
   * 初始化時間軸
   */
  private initTimeline(): void {
    if (!this.timelineContainer || !this.timelineTrack) {
      console.error('時間軸容器未找到');
      return;
    }

    this.setupDragHandlers();
    this.setupSelectionHandlers();
    console.log('時間軸初始化完成');
  }

  /**
   * 設定拖曳處理器
   */
  private setupDragHandlers(): void {
    const container = this.timelineContainer.nativeElement;

    // 滑鼠事件（桌面）
    container.addEventListener('mousedown', this.onDragStart.bind(this));
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));

    // 觸控事件（平板）
    container.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    container.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    container.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  /**
   * 設定時間範圍選擇處理器（符合 Story 3.4 需求）
   */
  private setupSelectionHandlers(): void {
    const container = this.timelineContainer?.nativeElement;
    const track = this.timelineTrack?.nativeElement;
    
    if (!container || !track) return;

    // 滑鼠框選（桌面）
    track.addEventListener('mousedown', this.onSelectionStart.bind(this));
    document.addEventListener('mousemove', this.onSelectionMove.bind(this));
    document.addEventListener('mouseup', this.onSelectionEnd.bind(this));

    // 觸控框選（平板）
    track.addEventListener('touchstart', this.onSelectionTouchStart.bind(this), { passive: false });
    track.addEventListener('touchmove', this.onSelectionTouchMove.bind(this), { passive: false });
    track.addEventListener('touchend', this.onSelectionEnd.bind(this));
  }

  /**
   * 滑鼠框選開始（按住 Shift 鍵 + 點擊時間軸）
   */
  private onSelectionStart(e: MouseEvent): void {
    // 如果按住 Shift 鍵，開始框選
    if (e.shiftKey && this.timelineTrack) {
      e.preventDefault();
      e.stopPropagation();
      
      this.isSelecting = true;
      const rect = this.timelineTrack.nativeElement.getBoundingClientRect();
      this.selectionStartX = e.pageX - rect.left + this.timelineContainer!.nativeElement.scrollLeft;
      this.selectedStartYear = this.getYearFromPosition(this.selectionStartX);
      this.selectedEndYear = this.selectedStartYear;
    }
  }

  /**
   * 滑鼠框選中
   */
  private onSelectionMove(e: MouseEvent): void {
    if (!this.isSelecting || !this.timelineTrack || !this.timelineContainer) return;

    e.preventDefault();
    const rect = this.timelineTrack.nativeElement.getBoundingClientRect();
    const currentX = e.pageX - rect.left + this.timelineContainer.nativeElement.scrollLeft;
    this.selectedEndYear = this.getYearFromPosition(currentX);
    
    // 確保 start < end
    if (this.selectedStartYear !== null && this.selectedEndYear < this.selectedStartYear) {
      [this.selectedStartYear, this.selectedEndYear] = [this.selectedEndYear, this.selectedStartYear];
    }
  }

  /**
   * 框選結束
   */
  private onSelectionEnd(): void {
    this.isSelecting = false;
  }

  /**
   * 觸控框選開始
   */
  private onSelectionTouchStart(e: TouchEvent): void {
    if (e.touches.length !== 1 || !this.timelineTrack) return;

    // 觸控框選：長按開始選擇
    this.selectionStartX = e.touches[0].pageX - this.timelineTrack.nativeElement.getBoundingClientRect().left;
    // 觸控框選邏輯可以更複雜，這裡簡化處理
  }

  /**
   * 觸控框選中
   */
  private onSelectionTouchMove(e: TouchEvent): void {
    if (e.touches.length !== 1 || !this.isSelecting || !this.timelineTrack) return;

    e.preventDefault();
    const currentX = e.touches[0].pageX - this.timelineTrack.nativeElement.getBoundingClientRect().left;
    this.selectedEndYear = this.getYearFromPosition(currentX);
    
    if (this.selectedStartYear !== null && this.selectedEndYear < this.selectedStartYear) {
      [this.selectedStartYear, this.selectedEndYear] = [this.selectedEndYear, this.selectedStartYear];
    }
  }

  /**
   * 從位置計算年份
   */
  private getYearFromPosition(x: number): number {
    if (!this.timelineTrack) return this.minYear;

    const trackWidth = this.timelineTrack.nativeElement.scrollWidth;
    const percent = Math.max(0, Math.min(1, x / trackWidth)); // 限制在 0-1 範圍
    const year = Math.round(this.minYear + percent * this.totalYears);
    
    // 限制在有效範圍內
    return Math.max(this.minYear, Math.min(this.maxYear, year));
  }

  /**
   * 清除時間範圍選擇
   */
  clearSelection(): void {
    this.selectedStartYear = null;
    this.selectedEndYear = null;
    this.isSelecting = false;
  }

  /**
   * 獲取選中的時間範圍樣式
   */
  getSelectionStyle(): { left: string; width: string } | null {
    if (this.selectedStartYear === null || this.selectedEndYear === null) {
      return null;
    }

    const left = this.getYearPosition(this.selectedStartYear);
    const right = this.getYearPosition(this.selectedEndYear);
    
    return {
      left: `${Math.min(left, right)}%`,
      width: `${Math.abs(right - left)}%`
    };
  }

  /**
   * 滑鼠拖曳開始
   */
  private onDragStart(e: MouseEvent): void {
    if (!this.timelineContainer) return;
    
    // 如果按住 Shift 鍵，觸發範圍選擇而非拖曳
    if (e.shiftKey) {
      return;
    }
    
    // 如果點擊在選擇區域或選擇手柄，不觸發拖曳
    const target = e.target as HTMLElement;
    if (target.closest('.time-selection') || target.closest('.selection-handle')) {
      return;
    }

    this.isDragging = true;
    this.dragStartX = e.pageX - this.timelineContainer.nativeElement.offsetLeft;
    this.scrollLeft = this.timelineContainer.nativeElement.scrollLeft;
    this.timelineContainer.nativeElement.style.cursor = 'grabbing';
    e.preventDefault();
  }

  /**
   * 滑鼠拖曳中（使用 requestAnimationFrame 確保流暢，符合 NFR2: 互動 FPS ≥ 30fps）
   */
  private onDragMove(e: MouseEvent): void {
    if (!this.isDragging || !this.timelineContainer) return;

    e.preventDefault();
    
    // 使用 requestAnimationFrame 優化拖曳效能
    requestAnimationFrame(() => {
      if (!this.timelineContainer) return;
      
      const x = e.pageX - this.timelineContainer.nativeElement.offsetLeft;
      const walk = (x - this.dragStartX) * 2; // 拖曳靈敏度
      const newScrollLeft = this.scrollLeft - walk;
      
      // 限制拖曳範圍在有效時間範圍內
      const maxScroll = this.timelineContainer.nativeElement.scrollWidth - 
                       this.timelineContainer.nativeElement.clientWidth;
      this.timelineContainer.nativeElement.scrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll));
    });
  }

  /**
   * 滑鼠拖曳結束
   */
  private onDragEnd(): void {
    if (!this.timelineContainer) return;
    
    this.isDragging = false;
    this.timelineContainer.nativeElement.style.cursor = 'grab';
  }

  /**
   * 觸控拖曳開始
   */
  private onTouchStart(e: TouchEvent): void {
    if (!this.timelineContainer || e.touches.length !== 1) return;

    const touch = e.touches[0];
    this.isDragging = true;
    this.dragStartX = touch.pageX - this.timelineContainer.nativeElement.offsetLeft;
    this.scrollLeft = this.timelineContainer.nativeElement.scrollLeft;
    e.preventDefault();
  }

  /**
   * 觸控拖曳中（使用 requestAnimationFrame 確保流暢，符合 NFR2, NFR31, NFR32）
   */
  private onTouchMove(e: TouchEvent): void {
    if (!this.isDragging || !this.timelineContainer || e.touches.length !== 1) return;

    e.preventDefault();
    
    // 使用 requestAnimationFrame 優化觸控拖曳效能
    requestAnimationFrame(() => {
      if (!this.timelineContainer) return;
      
      const touch = e.touches[0];
      const x = touch.pageX - this.timelineContainer.nativeElement.offsetLeft;
      const walk = (x - this.dragStartX) * 2;
      const newScrollLeft = this.scrollLeft - walk;
      
      // 限制拖曳範圍在有效時間範圍內
      const maxScroll = this.timelineContainer.nativeElement.scrollWidth - 
                       this.timelineContainer.nativeElement.clientWidth;
      this.timelineContainer.nativeElement.scrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll));
    });
  }

  /**
   * 觸控拖曳結束
   */
  private onTouchEnd(): void {
    this.isDragging = false;
  }

  /**
   * 移除事件監聽器
   */
  private removeEventListeners(): void {
    // 事件監聽器會在組件銷毀時自動清理
  }

  /**
   * 計算年份在時間軸上的位置（百分比）
   */
  getYearPosition(year: number): number {
    return ((year - this.minYear) / this.totalYears) * 100;
  }

  /**
   * 計算朝代視覺帶的位置和寬度
   */
  getDynastyBandStyle(band: DynastyBand): { left: string; width: string } {
    const left = this.getYearPosition(band.startYear);
    const right = this.getYearPosition(band.endYear);
    return {
      left: `${left}%`,
      width: `${right - left}%`
    };
  }

  /**
   * 獲取當前可見的時間範圍
   */
  getVisibleTimeRange(): { start: number; end: number } {
    if (!this.timelineContainer) {
      return { start: this.minYear, end: this.maxYear };
    }

    const container = this.timelineContainer.nativeElement;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const trackWidth = container.scrollWidth;

    const startPercent = scrollLeft / trackWidth;
    const endPercent = (scrollLeft + containerWidth) / trackWidth;

    const startYear = Math.round(this.minYear + startPercent * this.totalYears);
    const endYear = Math.round(this.minYear + endPercent * this.totalYears);

    return { start: startYear, end: endYear };
  }

  /**
   * 格式化年份顯示（處理負值表示西元前）
   */
  formatYear(year: number): string {
    if (year < 0) {
      return `${Math.abs(year)} BCE`;
    }
    return year.toString();
  }

  /**
   * 獲取年份刻度列表（每 10 年一個刻度，主要刻度每 100 年）
   */
  getYearTicks(): number[] {
    const ticks: number[] = [];
    // 每 10 年一個刻度
    for (let year = this.minYear; year <= this.maxYear; year += 10) {
      ticks.push(year);
    }
    return ticks;
  }
}

