import { Component, OnInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Store } from '@ngrx/store';
import { Observable, Subject, timer } from 'rxjs';
import { switchMap, map, take, takeUntil } from 'rxjs/operators';
import { ValidatedEvent, ValidatedTimelineItem } from './core/utils/data-validator';
import { MapContainerComponent } from './features/map/components/map-container.component';
import { TimelineContainerComponent } from './features/timeline/components/timeline-container.component';
import { SearchBoxComponent } from './features/search/components/search-box.component';
import { SearchResultsComponent } from './features/search/components/search-results.component';
import { EventCardComponent } from './features/event-detail/components/event-card.component';
import { CharacterPanelComponent } from './features/character-detail/components/character-panel.component';
import { AppState } from './core/state/app.state';
import { ExplorationState, TimeMapState } from './core/state/time-map.reducer';
import * as TimeMapSelectors from './core/state/time-map.selectors';
import * as TimeMapActions from './core/state/time-map.actions';
import { SearchService, SearchResult } from './core/services/search.service';
import { Logger } from './core/utils/logger';

@Component({
    selector: 'app-root',
    imports: [CommonModule, MatSidenavModule, MapContainerComponent, TimelineContainerComponent, SearchBoxComponent, SearchResultsComponent, EventCardComponent, CharacterPanelComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild(MapContainerComponent) mapComponent!: MapContainerComponent;
  @ViewChild(TimelineContainerComponent) timelineComponent!: TimelineContainerComponent;

  @ViewChild('eventSidenav', { read: ElementRef, static: true }) detailPanel!: ElementRef<HTMLElement>;
  view$!: Observable<TimeMapState>;
  suggestions = { characters: [] as string[], novels: [] as string[] };
  browseCategory: 'novels' | 'characters' = 'novels';
  notice = '';
  history: { state: ExplorationState; keyword: string; results: SearchResult[];
    timelineLeft: number; searchOpen: boolean }[] = [];
  private navigation$ = new Subject<void>();

  events$!: Observable<ValidatedEvent[]>;
  timeline$!: Observable<ValidatedTimelineItem[]>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  selectedEvent$!: Observable<ValidatedEvent | null>;
  selectedNovel$!: Observable<string | null>;
  selectedCharacter$!: Observable<string | null>;
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
  isSearchFocused = false;
  novels: string[] = [];
  characters: string[] = [];

  private timeRangeChange$ = new Subject<{ startYear: number; endYear: number } | null>();
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private searchService: SearchService
  ) {
    this.timeRangeChange$.pipe(
      switchMap(range => timer(120).pipe(map(() => range), takeUntil(this.navigation$))),
      takeUntil(this.destroy$)
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
    this.view$ = this.store.select(TimeMapSelectors.selectTimeMapState);
    this.events$ = this.store.select(TimeMapSelectors.selectVisibleEvents);
    this.timeline$ = this.store.select(TimeMapSelectors.selectTimeline);
    this.loading$ = this.store.select(TimeMapSelectors.selectLoading);
    this.error$ = this.store.select(TimeMapSelectors.selectError);
    this.validationStats$ = this.store.select(TimeMapSelectors.selectValidationStats);
    this.selectedEvent$ = this.store.select(TimeMapSelectors.selectSelectedEvent);
    this.selectedNovel$ = this.store.select(TimeMapSelectors.selectSelectedNovel);
    this.selectedCharacter$ = this.store.select(TimeMapSelectors.selectSelectedCharacter);

    this.loadData();

    // 搜尋服務使用全部事件（不受時間範圍或小說篩選影響）
    this.store.select(TimeMapSelectors.selectAllEvents).pipe(
      takeUntil(this.destroy$)
    ).subscribe(events => {
      this.searchService.setEvents(events);
      const counts = new Map<string, number>();
      events.forEach(event => event.characters.forEach(name => counts.set(name, (counts.get(name) ?? 0) + 1)));
      this.characters = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-Hant'))
        .slice(0, 8).map(([name]) => name);
      this.suggestions = this.searchService.suggest(this.searchKeyword);
    });

    // 訂閱小說列表供 autocomplete 下拉使用
    this.store.select(TimeMapSelectors.selectAllNovels).pipe(
      takeUntil(this.destroy$)
    ).subscribe(novels => {
      this.novels = novels;
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
    this.destroy$.next();
    this.destroy$.complete();
    this.timeRangeChange$.complete();
    this.navigation$.complete();
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
    this.suggestions = this.searchService.suggest(keyword);
    if (!keyword || keyword.trim().length === 0) {
      this.searchResults = [];
    }
  }

  onSearchResultClick(event: ValidatedEvent): void {
    this.onNavigateToEvent(event);
  }

  onMapEventClick(event: ValidatedEvent): void {
    this.rememberView();
    this.store.dispatch(TimeMapActions.selectEvent({ eventId: event.id }));
    this.mapComponent?.flyTo(event.lat, event.lng, 8, event.id);
  }

  onEventDotClick(eventId: string): void {
    this.store.select(TimeMapSelectors.selectAllEvents).pipe(take(1)).subscribe(events => {
      const event = events.find(e => e.id === eventId);
      if (event) this.onNavigateToEvent(event);
    });
  }

  onCloseEventCard(): void {
    this.store.dispatch(TimeMapActions.clearSelectedEvent());
  }

  onNavigateToEvent(event: ValidatedEvent): void {
    this.rememberView();
    this.store.dispatch(TimeMapActions.selectEvent({ eventId: event.id }));
    this.store.select(TimeMapSelectors.selectSelectedNovel).pipe(take(1)).subscribe(novel => {
      if (novel && novel !== event.novel) {
        this.store.dispatch(TimeMapActions.setNovelFilter({ novel: null }));
        this.notice = `已解除《${novel}》篩選，顯示《${event.novel}》的「${event.title}」。`;
      }
    });
    this.isSearchFocused = false;
    this.store.dispatch(TimeMapActions.setTimeRange({
      startYear: event.year - 10,
      endYear: event.year + 10
    }));
    this.timelineComponent?.scrollToYear(event.year);
    this.mapComponent?.flyTo(event.lat, event.lng, 8, event.id);
  }

  /**
   * 處理搜尋框聚焦狀態變化（控制下拉選單顯示）
   */
  onSearchFocusChange(isFocused: boolean): void {
    this.isSearchFocused = isFocused;
  }

  /**
   * 處理從 autocomplete 下拉選取小說
   */
  onNovelSelect(novel: string | null): void {
    this.rememberView();
    this.store.dispatch(TimeMapActions.setNovelFilter({ novel }));
    this.isSearchFocused = false;
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
  }

  onCharacterClick(name: string): void {
    if (!name) return;
    this.rememberView();
    this.store.dispatch(TimeMapActions.selectCharacter({ character: name }));
    this.isSearchFocused = false;
    this.store.select(TimeMapSelectors.selectCharacterEvents).pipe(take(1)).subscribe(events => {
      if (events.length === 0) return;
      this.onCharacterEventClick(events[0]);
    });
  }

  onCharacterEventClick(event: ValidatedEvent): void {
    this.navigation$.next();
    this.store.dispatch(TimeMapActions.focusCharacterEvent({ eventId: event.id }));
    this.store.select(TimeMapSelectors.selectTimeRange).pipe(take(1)).subscribe(range => {
      if (range && (event.year < range.startYear || event.year > range.endYear)) {
        this.store.dispatch(TimeMapActions.setTimeRange({ startYear: event.year - 10, endYear: event.year + 10 }));
      }
    });
    this.timelineComponent?.scrollToYear(event.year);
    this.mapComponent?.flyTo(event.lat, event.lng, 8, event.id);
  }

  onSearchAreaFocusOut(event: FocusEvent): void {
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) {
      this.isSearchFocused = false;
    }
  }

  clearNovelFilter(): void {
    this.rememberView();
    this.store.dispatch(TimeMapActions.setNovelFilter({ novel: null }));
  }

  clearTimeFilter(): void {
    this.rememberView();
    this.store.dispatch(TimeMapActions.clearTimeRange());
    this.timelineComponent?.clearRangeHighlight();
  }

  resetFilters(): void {
    this.rememberView();
    this.store.dispatch(TimeMapActions.resetFilters());
    this.timelineComponent?.clearRangeHighlight();
    this.isSearchFocused = false;
    this.store.select(TimeMapSelectors.selectAllEvents).pipe(take(1)).subscribe(events => {
      this.mapComponent?.fitMapToEvents(events);
    });
  }

  formatYear(year: number): string {
    return year < 0 ? `西元前${Math.abs(year)}年` : `${year}年`;
  }

  private rememberView(): void {
    this.navigation$.next();
    this.notice = '';
    this.store.select(TimeMapSelectors.selectTimeMapState).pipe(take(1)).subscribe(state => {
      const { currentTimeRange, selectedNovel, selectedCharacter, selectedEventId, preCharacterSnapshot, mapView } = state;
      const currentMap = this.mapComponent?.getMap?.();
      const savedMapView = currentMap
        ? { center: [currentMap.getCenter().lat, currentMap.getCenter().lng] as [number, number], zoom: currentMap.getZoom() }
        : mapView;
      this.history.push({
        state: { currentTimeRange, selectedNovel, selectedCharacter, selectedEventId, preCharacterSnapshot, mapView: savedMapView },
        keyword: this.searchKeyword, results: this.searchResults,
        timelineLeft: this.timelineComponent?.getScrollPosition() ?? 0,
        searchOpen: this.isSearchFocused
      });
    });
  }

  goBack(): void {
    const previous = this.history.pop();
    if (!previous) return;
    this.navigation$.next();
    this.store.dispatch(TimeMapActions.restoreExploration({ snapshot: previous.state }));
    this.searchKeyword = previous.keyword;
    this.searchResults = previous.results;
    this.suggestions = this.searchService.suggest(previous.keyword);
    this.isSearchFocused = previous.searchOpen;
    this.notice = '已返回上一個探索位置。';
    this.timelineComponent?.restoreScrollPosition(previous.timelineLeft);
    this.mapComponent?.restoreView(previous.state.mapView.center, previous.state.mapView.zoom);
    if (previous.state.selectedEventId) this.mapComponent?.highlightMarker(previous.state.selectedEventId);
  }

  onCloseCharacterPanel(): void {
    this.store.dispatch(TimeMapActions.clearSelectedCharacter());
  }

  onSidenavClosed(): void {
    if (this.isSearchFocused) return;
    this.store.select(TimeMapSelectors.selectSelectedCharacter).pipe(take(1)).subscribe(c => {
      if (c !== null) {
        this.store.dispatch(TimeMapActions.clearSelectedCharacter());
      } else {
        this.store.dispatch(TimeMapActions.clearSelectedEvent());
      }
    });
  }
}

