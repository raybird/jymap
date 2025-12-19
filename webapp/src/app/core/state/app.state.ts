import { TimeMapState } from './time-map.reducer';

/**
 * Root App State
 * 僅定義核心同步互動相關的狀態切片。
 */
export interface AppState {
  timeMap: TimeMapState;
}



