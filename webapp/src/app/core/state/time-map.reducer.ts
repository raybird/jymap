import { createReducer, on } from '@ngrx/store';
import * as TimeMapActions from './time-map.actions';
import { ValidatedEvent, ValidatedTimelineItem } from '../utils/data-validator';

export interface TimeRange {
  startYear: number;
  endYear: number;
}

export interface MapView {
  center: [number, number];
  zoom: number;
}

export interface TimeMapState {
  events: ValidatedEvent[];
  timeline: ValidatedTimelineItem[];
  visibleEvents: ValidatedEvent[];
  currentTimeRange: TimeRange | null;
  mapView: MapView;
  loadingEvents: boolean;
  loadingTimeline: boolean;
  error: string | null;
  validationStats: {
    total: number;
    valid: number;
    invalidCoordinates: number;
    incompleteData: number;
    invalidCoordinatesRate: number;
    requiredFieldsCoverage: number;
  } | null;
}

export const initialTimeMapState: TimeMapState = {
  events: [],
  timeline: [],
  visibleEvents: [],
  currentTimeRange: null,
  mapView: {
    center: [35.0, 105.0],
    zoom: 5
  },
  loadingEvents: false,
  loadingTimeline: false,
  error: null,
  validationStats: null
};

export const timeMapReducer = createReducer(
  initialTimeMapState,

  // 載入事件
  on(TimeMapActions.loadEvents, (state) => ({
    ...state,
    loadingEvents: true,
    error: null
  })),

  on(TimeMapActions.loadEventsSuccess, (state, { result }) => {
    const events = result.data;
    return {
      ...state,
      events,
      visibleEvents: applyTimeRangeFilter(events, state.currentTimeRange),
      loadingEvents: false,
      validationStats: result.validationStats || null
    };
  }),

  on(TimeMapActions.loadEventsFailure, (state, { error }) => ({
    ...state,
    loadingEvents: false,
    error
  })),

  // 載入時間軸
  on(TimeMapActions.loadTimeline, (state) => ({
    ...state,
    loadingTimeline: true,
    error: null
  })),

  on(TimeMapActions.loadTimelineSuccess, (state, { result }) => ({
    ...state,
    timeline: result.data,
    loadingTimeline: false
  })),

  on(TimeMapActions.loadTimelineFailure, (state, { error }) => ({
    ...state,
    loadingTimeline: false,
    error
  })),

  // 設定時間範圍（更新 visibleEvents）
  on(TimeMapActions.setTimeRange, (state, { startYear, endYear }) => {
    const range: TimeRange = {
      startYear: Math.min(startYear, endYear),
      endYear: Math.max(startYear, endYear)
    };

    return {
      ...state,
      currentTimeRange: range,
      visibleEvents: applyTimeRangeFilter(state.events, range)
    };
  }),

  // 清除時間範圍選擇
  on(TimeMapActions.clearTimeRange, (state) => ({
    ...state,
    currentTimeRange: null,
    visibleEvents: state.events // 顯示所有事件
  })),

  // 設定地圖視圖
  on(TimeMapActions.setMapView, (state, { center, zoom }) => ({
    ...state,
    mapView: { center, zoom }
  }))
);

/**
 * 依據時間範圍過濾事件
 */
function applyTimeRangeFilter(events: ValidatedEvent[], range: TimeRange | null): ValidatedEvent[] {
  if (!range) {
    return events;
  }
  return events.filter((event) => event.year >= range.startYear && event.year <= range.endYear);
}



