import { Event } from '../models';

/** 時間軸最晚年份；推估區間沒有上限時以此為界 */
export const TIMELINE_MAX_YEAR = 1800;

export interface EventSpan {
  start: number;
  end: number;
}

/**
 * 事件在時間軸上佔據的範圍：一般事件是單一年份，推估事件是整段區間
 */
export function getEventSpan(event: Event): EventSpan {
  const era = event.eraEstimate;
  return era
    ? { start: era.startYear, end: era.endYear ?? TIMELINE_MAX_YEAR }
    : { start: event.year, end: event.year };
}

/**
 * 跳轉時間軸時的目標年份；推估事件取區間中點，不使用佔位的 year
 */
export function getEventFocusYear(event: Event): number {
  const { start, end } = getEventSpan(event);
  return Math.round((start + end) / 2);
}

/**
 * 事件是否落在時間範圍內；推估事件只要區間有重疊就算
 */
export function overlapsTimeRange(event: Event, range: { startYear: number; endYear: number }): boolean {
  const { start, end } = getEventSpan(event);
  return end >= range.startYear && start <= range.endYear;
}

export function getYearText(year: number): string {
  return year < 0 ? `西元前${Math.abs(year)}年` : `西元${year}年`;
}

export function getEventTimeText(event: Event): string {
  return event.eraEstimate?.label ?? getYearText(event.year);
}

export function getEventDynastyText(event: Event): string {
  return event.eraEstimate?.dynastyLabel ?? event.dynasty;
}

/**
 * 依時間排序；同作品的推估事件改看情節先後，因為它們的 year 只是佔位
 */
export function compareEventsByTime(a: Event, b: Event): number {
  if (a.eraEstimate && b.eraEstimate && a.novel === b.novel) {
    return a.eraEstimate.storyOrder - b.eraEstimate.storyOrder;
  }
  return a.year - b.year;
}
