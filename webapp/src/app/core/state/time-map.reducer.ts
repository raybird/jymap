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
  selectedNovel: string | null;
  mapView: MapView;
  selectedEventId: string | null;
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
  selectedNovel: null,
  mapView: {
    center: [35.0, 105.0],
    zoom: 5
  },
  selectedEventId: null,
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
      visibleEvents: applyFilters(events, state.currentTimeRange, state.selectedNovel),
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
      visibleEvents: applyFilters(state.events, range, state.selectedNovel)
    };
  }),

  // 清除時間範圍選擇
  on(TimeMapActions.clearTimeRange, (state) => ({
    ...state,
    currentTimeRange: null,
    visibleEvents: applyFilters(state.events, null, state.selectedNovel)
  })),

  // 設定小說篩選
  on(TimeMapActions.setNovelFilter, (state, { novel }) => ({
    ...state,
    selectedNovel: novel,
    visibleEvents: applyFilters(state.events, state.currentTimeRange, novel)
  })),

  // 設定地圖視圖
  on(TimeMapActions.setMapView, (state, { center, zoom }) => ({
    ...state,
    mapView: { center, zoom }
  })),

  // 選中事件
  on(TimeMapActions.selectEvent, (state, { eventId }) => ({
    ...state,
    selectedEventId: eventId
  })),

  // 清除選中事件
  on(TimeMapActions.clearSelectedEvent, (state) => ({
    ...state,
    selectedEventId: null
  }))
);

/**
 * 依據時間範圍 + 小說篩選過濾事件
 */
function applyFilters(events: ValidatedEvent[], range: TimeRange | null, novel: string | null): ValidatedEvent[] {
  let filtered = events;
  if (range) {
    filtered = filtered.filter((event) => event.year >= range.startYear && event.year <= range.endYear);
  }
  if (novel) {
    filtered = filtered.filter((event) => event.novel === novel);
  }
  return filtered;
}



