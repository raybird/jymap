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
  selectedEventVersion: number;
  loadingEvents: boolean;
  loadingTimeline: boolean;
  error: string | null;
  selectedCharacter: string | null;
  selectedCharacterVersion: number;
  preCharacterSnapshot: {
    timeRange: TimeRange | null;
    selectedNovel: string | null;
  } | null;
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
  selectedEventVersion: 0,
  loadingEvents: false,
  loadingTimeline: false,
  error: null,
  selectedCharacter: null,
  selectedCharacterVersion: 0,
  preCharacterSnapshot: null,
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

  // 選中事件（每次遞增版本號，確保 selector 重複發射）
  on(TimeMapActions.selectEvent, (state, { eventId }) => ({
    ...state,
    selectedEventId: eventId,
    selectedEventVersion: state.selectedEventVersion + 1
  })),

  // 清除選中事件
  on(TimeMapActions.clearSelectedEvent, (state) => ({
    ...state,
    selectedEventId: null
  })),

  // 進入人物模式
  on(TimeMapActions.selectCharacter, (state, { character }) => {
    const name = (character || '').trim();
    if (name === '') {
      return state;
    }

    const charEvents = state.events.filter(e => e.characters.includes(name));
    if (charEvents.length === 0) {
      return state;
    }

    const years = charEvents.map(e => e.year).sort((a, b) => a - b);
    const startYear = years[0] - 20;
    const endYear = years[years.length - 1] + 20;
    const newRange: TimeRange = { startYear, endYear };

    const snapshot = state.preCharacterSnapshot ?? {
      timeRange: state.currentTimeRange,
      selectedNovel: state.selectedNovel
    };

    return {
      ...state,
      preCharacterSnapshot: snapshot,
      currentTimeRange: newRange,
      selectedNovel: null,
      selectedEventId: null,
      selectedCharacter: name,
      selectedCharacterVersion: state.selectedCharacterVersion + 1,
      visibleEvents: applyFilters(state.events, newRange, null)
    };
  }),

  // 退出人物模式
  on(TimeMapActions.clearSelectedCharacter, (state) => {
    const snapshot = state.preCharacterSnapshot;
    const restoredRange = snapshot?.timeRange ?? null;
    const restoredNovel = snapshot?.selectedNovel ?? null;

    return {
      ...state,
      selectedCharacter: null,
      preCharacterSnapshot: null,
      currentTimeRange: restoredRange,
      selectedNovel: restoredNovel,
      visibleEvents: applyFilters(state.events, restoredRange, restoredNovel)
    };
  })
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



