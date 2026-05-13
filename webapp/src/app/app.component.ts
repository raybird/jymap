import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, take, takeUntil } from 'rxjs/operators';
import { ValidatedEvent, ValidatedTimelineItem } from './core/utils/data-validator';
import { MapContainerComponent } from './features/map/components/map-container.component';
import { TimelineContainerComponent } from './features/timeline/components/timeline-container.component';
import { SearchBoxComponent } from './features/search/components/search-box.component';
import { SearchResultsComponent } from './features/search/components/search-results.component';
import { NovelFilterComponent } from './features/novel-filter/components/novel-filter.component';
import { EventCardComponent } from './features/event-detail/components/event-card.component';
import { AppState } from './core/state/app.state';
import * as TimeMapSelectors from './core/state/time-map.selectors';
import * as TimeMapActions from './core/state/time-map.actions';
import { SearchService, SearchResult } from './core/services/search.service';
import { Logger } from './core/utils/logger';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MatSidenavModule, MapContainerComponent, TimelineContainerComponent, SearchBoxComponent, SearchResultsComponent, NovelFilterComponent, EventCardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild(MapContainerComponent) mapComponent!: MapContainerComponent;
  @ViewChild(TimelineContainerComponent) timelineComponent!: TimelineContainerComponent;

  events$!: Observable<ValidatedEvent[]>;
  timeline$!: Observable<ValidatedTimelineItem[]>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  selectedEvent$!: Observable<ValidatedEvent | null>;
  selectedNovel$!: Observable<string | null>;
  validationStats$!: Observable<{
    total: number;
    valid: number;
    invalidCoordinates: number;
    incompleteData: number;
    invalidCoordinatesRate: number;
    requiredFieldsCoverage: number;
  } | null>;

  searchResults: SearchResult[] = [];
  searchKeyword = '';

  private timeRangeChange$ = new Subject<{ startYear: number; endYear: number } | null>();
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private searchService: SearchService
  ) {
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
    this.events$ = this.store.select(TimeMapSelectors.selectVisibleEvents);
    this.timeline$ = this.store.select(TimeMapSelectors.selectTimeline);
    this.loading$ = this.store.select(TimeMapSelectors.selectLoading);
    this.error$ = this.store.select(TimeMapSelectors.selectError);
    this.validationStats$ = this.store.select(TimeMapSelectors.selectValidationStats);
    this.selectedEvent$ = this.store.select(TimeMapSelectors.selectSelectedEvent);
    this.selectedNovel$ = this.store.select(TimeMapSelectors.selectSelectedNovel);

    this.loadData();

    // 搜尋服務使用全部事件（不受時間範圍或小說篩選影響）
    this.store.select(TimeMapSelectors.selectAllEvents).pipe(
      takeUntil(this.destroy$)
    ).subscribe(events => {
      if (events.length > 0) {
        this.searchService.setEvents(events);
      }
    });

    // 小說篩選變更時，捲動時間軸並飛到地圖到該小說的年份範圍
    this.selectedNovel$.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged()
    ).subscribe(novel => {
      if (!novel) {
        this.store.dispatch(TimeMapActions.clearTimeRange());
        return;
      }
      this.store.select(TimeMapSelectors.selectAllEvents).pipe(take(1)).subscribe(allEvents => {
        const novelEvents = allEvents.filter(e => e.novel === novel);
        if (novelEvents.length === 0) return;
        const years = novelEvents.map(e => e.year).sort((a, b) => a - b);
        const minYear = years[0];
        const maxYear = years[years.length - 1];
        const midYear = Math.round((minYear + maxYear) / 2);
        this.store.dispatch(TimeMapActions.setTimeRange({
          startYear: minYear - 20,
          endYear: maxYear + 20
        }));
        if (this.timelineComponent) {
          this.timelineComponent.scrollToYear(midYear);
        }
        if (this.mapComponent) {
          this.mapComponent.fitMapToEvents(novelEvents);
        }
      });
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

  onSearchResultClick(event: ValidatedEvent): void {
    Logger.debug('搜尋結果點擊:', event.title, '年份:', event.year);
    this.store.dispatch(TimeMapActions.selectEvent({ eventId: event.id }));

    if (this.timelineComponent) {
      setTimeout(() => this.timelineComponent.scrollToYear(event.year), 100);
    }

    if (this.mapComponent) {
      this.mapComponent.flyTo(event.lat, event.lng, 8);
      setTimeout(() => this.mapComponent.highlightMarker(event.id), 800);
    }

    const yearRange = 10;
    this.store.dispatch(TimeMapActions.setTimeRange({
      startYear: event.year - yearRange,
      endYear: event.year + yearRange
    }));
  }

  onMapEventClick(event: ValidatedEvent): void {
    this.store.dispatch(TimeMapActions.selectEvent({ eventId: event.id }));
    if (this.mapComponent) {
      this.mapComponent.flyTo(event.lat, event.lng, 7);
      setTimeout(() => this.mapComponent.highlightMarker(event.id), 800);
    }
  }

  onEventDotClick(eventId: string): void {
    this.store.select(TimeMapSelectors.selectAllEvents).pipe(take(1)).subscribe(events => {
      const event = events.find(e => e.id === eventId);
      if (event) {
        this.store.dispatch(TimeMapActions.selectEvent({ eventId }));
        if (this.timelineComponent) {
          setTimeout(() => this.timelineComponent.scrollToYear(event.year), 100);
        }
        if (this.mapComponent) {
          this.mapComponent.flyTo(event.lat, event.lng, 8);
          setTimeout(() => this.mapComponent.highlightMarker(eventId), 800);
        }
        this.store.dispatch(TimeMapActions.setTimeRange({
          startYear: event.year - 10,
          endYear: event.year + 10
        }));
      }
    });
  }

  onCloseEventCard(): void {
    this.store.dispatch(TimeMapActions.clearSelectedEvent());
  }

  onNavigateToEvent(event: ValidatedEvent): void {
    this.store.dispatch(TimeMapActions.selectEvent({ eventId: event.id }));
    if (this.timelineComponent) {
      setTimeout(() => this.timelineComponent.scrollToYear(event.year), 100);
    }
    if (this.mapComponent) {
      this.mapComponent.flyTo(event.lat, event.lng, 8);
      setTimeout(() => this.mapComponent.highlightMarker(event.id), 800);
    }
    const yearRange = 10;
    this.store.dispatch(TimeMapActions.setTimeRange({
      startYear: event.year - yearRange,
      endYear: event.year + yearRange
    }));
  }
}
