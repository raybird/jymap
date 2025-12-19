import { Component, OnInit, ViewChild, OnDestroy, SimpleChanges } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ValidatedEvent, ValidatedTimelineItem } from './core/utils/data-validator';
import { MapContainerComponent } from './features/map/components/map-container.component';
import { TimelineContainerComponent } from './features/timeline/components/timeline-container.component';
import { SearchBoxComponent } from './features/search/components/search-box.component';
import { SearchResultsComponent } from './features/search/components/search-results.component';
import { AppState } from './core/state/app.state';
import * as TimeMapSelectors from './core/state/time-map.selectors';
import * as TimeMapActions from './core/state/time-map.actions';
import { SearchService, SearchResult } from './core/services/search.service';
import { Logger } from './core/utils/logger';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MapContainerComponent, TimelineContainerComponent, SearchBoxComponent, SearchResultsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild(MapContainerComponent) mapComponent!: MapContainerComponent;
  @ViewChild(TimelineContainerComponent) timelineComponent!: TimelineContainerComponent;

  title = 'jymap';
  events$!: Observable<ValidatedEvent[]>;
  timeline$!: Observable<ValidatedTimelineItem[]>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  validationStats$!: Observable<{
    total: number;
    valid: number;
    invalidCoordinates: number;
    incompleteData: number;
    invalidCoordinatesRate: number;
    requiredFieldsCoverage: number;
  } | null>;

  // 搜尋相關狀態
  searchResults: SearchResult[] = [];
  searchKeyword = '';

  // 所有狀態都通過 Observable 和 async pipe 管理，無需本地變數

  // 用於 debounce 時間範圍變化事件（符合 Story 4.4: 同步延遲 < 200ms）
  private timeRangeChange$ = new Subject<{ startYear: number; endYear: number } | null>();
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private searchService: SearchService
  ) {
    // 設定 debounce 訂閱（120ms，確保總延遲 < 200ms）
    // 總延遲 = debounce (120ms) + action dispatch (~1ms) + reducer (~1ms) + selector (~1ms) + requestAnimationFrame (~16ms) + marker update (~30ms) ≈ 169ms
    this.timeRangeChange$.pipe(
      debounceTime(120),
      distinctUntilChanged((prev, curr) => {
        if (prev === null && curr === null) return true;
        if (prev === null || curr === null) return false;
        return prev.startYear === curr.startYear && prev.endYear === curr.endYear;
      })
    ).subscribe(range => {
      if (range) {
        this.store.dispatch(TimeMapActions.setTimeRange({ 
          startYear: range.startYear, 
          endYear: range.endYear 
        }));
      } else {
        this.store.dispatch(TimeMapActions.clearTimeRange());
      }
    });
  }

  ngOnInit(): void {
    // 初始化 selectors
    this.events$ = this.store.select(TimeMapSelectors.selectVisibleEvents);
    this.timeline$ = this.store.select(TimeMapSelectors.selectTimeline);
    this.loading$ = this.store.select(TimeMapSelectors.selectLoading);
    this.error$ = this.store.select(TimeMapSelectors.selectError);
    this.validationStats$ = this.store.select(TimeMapSelectors.selectValidationStats);

    this.loadData();

    // 當事件資料載入完成後，設定搜尋服務的資料來源
    this.events$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(events => {
      if (events.length > 0) {
        this.searchService.setEvents(events);
      }
    });
  }

  loadData(): void {
    // 透過 NgRx Effects 載入資料
    // 狀態會透過 Store 自動更新
    this.store.dispatch(TimeMapActions.loadEvents());
    this.store.dispatch(TimeMapActions.loadTimeline());
  }

  ngOnDestroy(): void {
    // 清理 debounce Subject
    this.timeRangeChange$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'valid':
        return 'badge-valid';
      case 'invalid-coordinates':
        return 'badge-invalid-coords';
      case 'incomplete-data':
        return 'badge-incomplete';
      default:
        return 'badge-unknown';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'valid':
        return '✓ 有效';
      case 'invalid-coordinates':
        return '⚠ 座標無效';
      case 'incomplete-data':
        return '⚠ 資料不完整';
      default:
        return '? 未知';
    }
  }

  /**
   * 處理時間範圍變化（來自時間軸組件）
   * 使用 debounce 優化效能（符合 Story 4.4: 同步延遲 < 200ms）
   */
  onTimeRangeChange(range: { startYear: number; endYear: number } | null): void {
    this.timeRangeChange$.next(range);
  }

  /**
   * 處理搜尋結果變化（來自搜尋框組件）
   * Story 5.2: 搜尋結果列表顯示與排序
   */
  onSearchResultsChange(results: SearchResult[]): void {
    this.searchResults = results;
    Logger.debug('搜尋結果更新:', results.length);
  }

  /**
   * 處理搜尋關鍵字變化（來自搜尋框組件）
   */
  onSearchKeywordChange(keyword: string): void {
    this.searchKeyword = keyword;
    if (!keyword || keyword.trim().length === 0) {
      this.searchResults = [];
    }
  }

  /**
   * 處理搜尋結果點擊（來自搜尋結果組件）
   * Story 5.3: 搜尋結果與時間軸/地圖同步跳轉
   */
  onSearchResultClick(event: ValidatedEvent): void {
    Logger.debug('搜尋結果點擊:', event.title, '年份:', event.year);
    
    // 跳轉時間軸到對應年份
    if (this.timelineComponent) {
      // 使用 setTimeout 確保動畫流暢
      setTimeout(() => {
        this.timelineComponent.scrollToYear(event.year);
      }, 100);
    } else {
      Logger.warn('時間軸組件未初始化');
    }

    // 跳轉地圖到對應位置並高亮標記
    if (this.mapComponent) {
      // 先飛到位置
      this.mapComponent.flyTo(event.lat, event.lng, 8);
      
      // 然後高亮標記（等待地圖動畫完成）
      setTimeout(() => {
        this.mapComponent.highlightMarker(event.id);
      }, 800); // 等待 flyTo 動畫完成（0.8秒）
    } else {
      Logger.warn('地圖組件未初始化');
    }

    // 發送時間範圍變化事件，確保地圖標記正確顯示
    // 使用一個小的時間範圍來確保該事件可見
    const yearRange = 10; // 前後 10 年
    this.store.dispatch(TimeMapActions.setTimeRange({
      startYear: event.year - yearRange,
      endYear: event.year + yearRange
    }));
  }
}
