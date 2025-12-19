import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState } from './app.state';
import { TimeMapState } from './time-map.reducer';

export const selectTimeMapState = createFeatureSelector<AppState, TimeMapState>('timeMap');

export const selectAllEvents = createSelector(selectTimeMapState, (state) => state.events);

/**
 * 選擇可見事件（已過濾的事件）
 * 使用 memoized selector 確保效能（Story 4.4）
 * 如果 visibleEvents 為空，返回所有事件（無時間範圍過濾）
 */
export const selectVisibleEvents = createSelector(
  selectTimeMapState,
  (state) => {
    // 如果已經有過濾後的事件，直接返回（避免重複計算）
    if (state.visibleEvents.length > 0) {
      return state.visibleEvents;
    }
    // 如果沒有時間範圍過濾，返回所有事件
    return state.events;
  }
);

export const selectTimeline = createSelector(selectTimeMapState, (state) => state.timeline);

export const selectTimeRange = createSelector(selectTimeMapState, (state) => state.currentTimeRange);

export const selectMapView = createSelector(selectTimeMapState, (state) => state.mapView);

export const selectLoadingEvents = createSelector(
  selectTimeMapState,
  (state) => state.loadingEvents
);

export const selectLoadingTimeline = createSelector(
  selectTimeMapState,
  (state) => state.loadingTimeline
);

export const selectLoading = createSelector(
  selectLoadingEvents,
  selectLoadingTimeline,
  (loadingEvents, loadingTimeline) => loadingEvents || loadingTimeline
);

export const selectError = createSelector(selectTimeMapState, (state) => state.error);

export const selectValidationStats = createSelector(
  selectTimeMapState,
  (state) => state.validationStats
);



