import { createAction, props } from '@ngrx/store';
import { ValidatedEvent, ValidatedTimelineItem } from '../utils/data-validator';
import { DataLoadResult } from '../services/data.service';

// 載入事件資料
export const loadEvents = createAction('[TimeMap] Load Events');

export const loadEventsSuccess = createAction(
  '[TimeMap] Load Events Success',
  props<{ result: DataLoadResult<ValidatedEvent[]> }>()
);

export const loadEventsFailure = createAction(
  '[TimeMap] Load Events Failure',
  props<{ error: string }>()
);

// 載入時間軸資料
export const loadTimeline = createAction('[TimeMap] Load Timeline');

export const loadTimelineSuccess = createAction(
  '[TimeMap] Load Timeline Success',
  props<{ result: DataLoadResult<ValidatedTimelineItem[]> }>()
);

export const loadTimelineFailure = createAction(
  '[TimeMap] Load Timeline Failure',
  props<{ error: string }>()
);

// 設定時間範圍（來自時間軸拖曳 / 框選）
export const setTimeRange = createAction(
  '[TimeMap] Set Time Range',
  props<{ startYear: number; endYear: number }>()
);

// 清除時間範圍選擇
export const clearTimeRange = createAction('[TimeMap] Clear Time Range');

// 設定地圖視圖（來自地圖互動）
export const setMapView = createAction(
  '[TimeMap] Set Map View',
  props<{ center: [number, number]; zoom: number }>()
);

// 選中事件（來自地圖標記點擊 / 搜尋結果點擊）
export const selectEvent = createAction(
  '[TimeMap] Select Event',
  props<{ eventId: string }>()
);

// 清除選中事件
export const clearSelectedEvent = createAction('[TimeMap] Clear Selected Event');


