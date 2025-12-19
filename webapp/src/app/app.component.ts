import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ValidatedEvent, ValidatedTimelineItem } from './core/utils/data-validator';
import { MapContainerComponent } from './features/map/components/map-container.component';
import { TimelineContainerComponent } from './features/timeline/components/timeline-container.component';
import { AppState } from './core/state/app.state';
import * as TimeMapSelectors from './core/state/time-map.selectors';
import * as TimeMapActions from './core/state/time-map.actions';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MapContainerComponent, TimelineContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild(MapContainerComponent) mapComponent!: MapContainerComponent;

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

  // 所有狀態都通過 Observable 和 async pipe 管理，無需本地變數

  // 用於 debounce 時間範圍變化事件（符合 Story 4.4: 同步延遲 < 200ms）
  private timeRangeChange$ = new Subject<{ startYear: number; endYear: number } | null>();

  constructor(private store: Store<AppState>) {
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
    // 所有狀態都通過 Observable 和 async pipe 在模板中管理，無需手動訂閱
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
}
