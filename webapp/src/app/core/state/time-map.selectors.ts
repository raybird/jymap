import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState } from './app.state';
import { TimeMapState } from './time-map.reducer';

export const selectTimeMapState = createFeatureSelector<AppState, TimeMapState>('timeMap');

export const selectAllEvents = createSelector(selectTimeMapState, (state) => state.events);

/**
 * 選擇可見事件（已過濾的事件）
 * 使用 memoized selector 確保效能（Story 4.4）
 * 優化：reducer 已經確保 visibleEvents 始終正確，直接返回即可
 */
export const selectVisibleEvents = createSelector(
  selectTimeMapState,
  (state) => state.visibleEvents
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

export const selectSelectedEventId = createSelector(
  selectTimeMapState,
  (state) => state.selectedEventId
);

export const selectSelectedEvent = createSelector(
  selectAllEvents,
  selectSelectedEventId,
  (events, id) => id ? events.find(e => e.id === id) || null : null
);



