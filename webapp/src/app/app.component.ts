import { AfterViewInit, Component, OnInit, ViewChild, OnDestroy, ElementRef, afterEveryRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, Subject, timer } from 'rxjs';
import { switchMap, map, take, takeUntil } from 'rxjs/operators';
import { ValidatedEvent, ValidatedTimelineItem } from './core/utils/data-validator';
import { getEventFocusYear, getEventSpan, overlapsTimeRange } from './core/utils/event-time';
import { MapContainerComponent } from './features/map/components/map-container.component';
import { TimelineContainerComponent } from './features/timeline/components/timeline-container.component';
import { SearchBoxComponent } from './features/search/components/search-box.component';
import { SearchResultsComponent } from './features/search/components/search-results.component';
import { EventCardComponent } from './features/event-detail/components/event-card.component';
import { CharacterPanelComponent } from './features/character-detail/components/character-panel.component';
import { AppState } from './core/state/app.state';
import { ExplorationState, TimeMapState, ViewMode } from './core/state/time-map.reducer';
import * as TimeMapSelectors from './core/state/time-map.selectors';
import * as TimeMapActions from './core/state/time-map.actions';
import { SearchService, SearchResult } from './core/services/search.service';
import { Logger } from './core/utils/logger';
import { getInitialMapView, SheetState } from './core/utils/viewport';
import { SheetHandleDirective } from './shared/sheet-handle.directive';
import { ChronicleListComponent } from './features/chronicle/components/chronicle-list.component';
import { ViewModeToggleComponent } from './features/chronicle/components/view-mode-toggle.component';

/** 年表模式的網址參數：?view=chronicle */
const VIEW_PARAM = 'view';

@Component({
    selector: 'app-root',
    imports: [CommonModule, MatSidenavModule, SheetHandleDirective, MapContainerComponent, TimelineContainerComponent, SearchBoxComponent, SearchResultsComponent, EventCardComponent, CharacterPanelComponent, ChronicleListComponent, ViewModeToggleComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MapContainerComponent) mapComponent!: MapContainerComponent;
  @ViewChild(TimelineContainerComponent) timelineComponent!: TimelineContainerComponent;
  @ViewChild(ChronicleListComponent) chronicleComponent?: ChronicleListComponent;
  @ViewChild('viewport', { static: true }) viewportRef!: ElementRef<HTMLElement>;
  @ViewChild('topOverlay', { static: true }) topOverlayRef!: ElementRef<HTMLElement>;

  @ViewChild('eventSidenav', { read: ElementRef, static: true }) detailPanel!: ElementRef<HTMLElement>;
  readonly initialView = getInitialMapView();
  hasDetail = false;
  sheetState: SheetState = 'half';
  private sheetEventId: string | null = null;
  private viewportListeners = new AbortController();
  private topOverlayObserver?: ResizeObserver;
  viewMode: ViewMode = 'map';
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
    // 條件列會隨「返回上一步」、提示、搜尋與面板開關變高變矮，中間狀態 ResizeObserver 可能漏掉，每次重繪後核對
    afterEveryRender(() => {
      if (this.viewMode === 'chronicle') this.updateChronicleTop();
    });
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

    const initialMode = new URLSearchParams(window.location.search).get(VIEW_PARAM);
    if (initialMode === 'chronicle') this.store.dispatch(TimeMapActions.setViewMode({ mode: 'chronicle' }));
    this.store.select(TimeMapSelectors.selectViewMode).pipe(takeUntil(this.destroy$)).subscribe(mode => {
      this.viewMode = mode;
      this.syncViewParam(mode);
    });

    this.loadData();

    combineLatest([this.selectedEvent$, this.selectedCharacter$]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([event, character]) => {
      const open = event !== null || character !== null;
      // 收起時改看別的事件要重新展開；關閉後下次都從一半高度開始
      if (!open || (this.sheetState === 'peek' && (event?.id ?? null) !== this.sheetEventId)) {
        this.setSheetState('half');
      }
      this.sheetEventId = event?.id ?? null;
      this.hasDetail = open;
    });

    // iOS 的 dvh 不會扣掉鍵盤，搜尋清單高度改看 visualViewport
    const viewport = window.visualViewport;
    if (viewport) {
      const update = () => document.documentElement.style.setProperty('--vvh', `${viewport.height}px`);
      update();
      viewport.addEventListener('resize', update, { signal: this.viewportListeners.signal });
    }

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

  // 年表接在搜尋列與條件列下方；視窗尺寸改變不一定觸發重繪，另外用 ResizeObserver 補
  ngAfterViewInit(): void {
    this.topOverlayObserver = new ResizeObserver(() => this.updateChronicleTop());
    this.topOverlayObserver.observe(this.topOverlayRef.nativeElement);
    this.updateChronicleTop();
  }

  /** 量搜尋列、條件列與提示的下緣；搜尋清單是浮在年表上的下拉，不算在內 */
  private updateChronicleTop(): void {
    const overlay = this.topOverlayRef.nativeElement;
    const viewport = this.viewportRef.nativeElement;
    const bottom = Array.from(overlay.children)
      .filter(child => !child.classList.contains('search-results-overlay'))
      .reduce((max, child) => Math.max(max, child.getBoundingClientRect().bottom), overlay.getBoundingClientRect().top);
    const value = `${Math.ceil(bottom - viewport.getBoundingClientRect().top + 8)}px`;
    if (viewport.style.getPropertyValue('--chronicle-top') !== value) viewport.style.setProperty('--chronicle-top', value);
  }

  loadData(): void {
    // 透過 NgRx Effects 載入資料
    // 狀態會透過 Store 自動更新
    this.store.dispatch(TimeMapActions.loadEvents());
    this.store.dispatch(TimeMapActions.loadTimeline());
  }

  ngOnDestroy(): void {
    this.viewportListeners.abort();
    this.topOverlayObserver?.disconnect();
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
    if (this.viewMode === 'chronicle') {
      this.focusInChronicle(event);
    } else {
      this.focusOnMap(event);
    }
  }

  setViewMode(mode: ViewMode): void {
    if (mode === this.viewMode) return;
    this.rememberView();
    this.store.dispatch(TimeMapActions.setViewMode({ mode }));

  }

  /** 年表卡片的「在地圖上看」：結果與在地圖上選取該事件相同 */
  onShowOnMap(event: ValidatedEvent): void {
    this.rememberView();
    this.store.dispatch(TimeMapActions.setViewMode({ mode: 'map' }));
    this.focusOnMap(event);
  }

  onChronicleEventOpen(event: ValidatedEvent): void {
    this.rememberView();
    this.store.dispatch(TimeMapActions.selectEvent({ eventId: event.id }));
  }

  private focusOnMap(event: ValidatedEvent): void {
    this.store.dispatch(TimeMapActions.selectEvent({ eventId: event.id }));
    this.clearConflictingNovel(event);
    this.isSearchFocused = false;
    const span = getEventSpan(event);
    this.store.dispatch(TimeMapActions.setTimeRange({
      startYear: span.start - 10,
      endYear: span.end + 10
    }));
    this.timelineComponent?.scrollToYear(getEventFocusYear(event));
    this.mapComponent?.flyTo(event.lat, event.lng, 8, event.id);
  }

  /** 年表不縮時間範圍，只解除擋住這個事件的條件，再捲到它的卡片 */
  private focusInChronicle(event: ValidatedEvent): void {
    this.store.dispatch(TimeMapActions.selectEvent({ eventId: event.id }));
    this.clearConflictingNovel(event);
    this.isSearchFocused = false;
    this.store.select(TimeMapSelectors.selectTimeRange).pipe(take(1)).subscribe(range => {
      if (range && !overlapsTimeRange(event, range)) {
        this.store.dispatch(TimeMapActions.clearTimeRange());
        this.timelineComponent?.clearRangeHighlight();
      }
    });
    this.timelineComponent?.scrollToYear(getEventFocusYear(event));
    this.chronicleComponent?.scrollToEvent(event.id);
  }

  private clearConflictingNovel(event: ValidatedEvent): void {
    this.store.select(TimeMapSelectors.selectSelectedNovel).pipe(take(1)).subscribe(novel => {
      if (novel && novel !== event.novel) {
        this.store.dispatch(TimeMapActions.setNovelFilter({ novel: null }));
        this.notice = `已解除《${novel}》篩選，顯示《${event.novel}》的「${event.title}」。`;
      }
    });
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
      const spans = novelEvents.map(getEventSpan);
      const minYear = Math.min(...spans.map(s => s.start));
      const maxYear = Math.max(...spans.map(s => s.end));
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
      if (range && !overlapsTimeRange(event, range)) {
        const span = getEventSpan(event);
        this.store.dispatch(TimeMapActions.setTimeRange({ startYear: span.start - 10, endYear: span.end + 10 }));
      }
    });
    this.timelineComponent?.scrollToYear(getEventFocusYear(event));
    if (this.viewMode === 'chronicle') {
      this.chronicleComponent?.scrollToEvent(event.id);
    } else {
      this.mapComponent?.flyTo(event.lat, event.lng, 8, event.id);
    }
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
      const { currentTimeRange, selectedNovel, selectedCharacter, selectedEventId, preCharacterSnapshot, mapView, viewMode } = state;
      const currentMap = this.mapComponent?.getMap?.();
      const savedMapView = currentMap
        ? { center: [currentMap.getCenter().lat, currentMap.getCenter().lng] as [number, number], zoom: currentMap.getZoom() }
        : mapView;
      this.history.push({
        state: { currentTimeRange, selectedNovel, selectedCharacter, selectedEventId, preCharacterSnapshot, mapView: savedMapView, viewMode },
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
    if (previous.state.selectedEventId) {
      this.mapComponent?.highlightMarker(previous.state.selectedEventId);
      if (previous.state.viewMode === 'chronicle') this.chronicleComponent?.scrollToEvent(previous.state.selectedEventId);
    }
  }

  /** 只改網址參數，不新增瀏覽紀錄；GitHub Pages 的 /jymap/ 路徑原樣保留 */
  private syncViewParam(mode: ViewMode): void {
    const url = new URL(window.location.href);
    if ((url.searchParams.get(VIEW_PARAM) === 'chronicle') === (mode === 'chronicle')) return;
    if (mode === 'chronicle') {
      url.searchParams.set(VIEW_PARAM, 'chronicle');
    } else {
      url.searchParams.delete(VIEW_PARAM);
    }
    window.history.replaceState(window.history.state, '', url);
  }

  // 直接改 class：同一輪接著 flyTo 要讀面板高度，等不到下一次變更偵測
  setSheetState(state: SheetState): void {
    this.sheetState = state;
    const panel = this.detailPanel.nativeElement;
    panel.classList.toggle('sheet-peek', state === 'peek');
    panel.classList.toggle('sheet-full', state === 'full');
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

