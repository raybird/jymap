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

export const selectSelectedNovel = createSelector(
  selectTimeMapState,
  (state) => state.selectedNovel
);

export const selectAllNovels = createSelector(
  selectAllEvents,
  (events) => {
    const novelSet = new Set(events.map(e => e.novel));
    return Array.from(novelSet).sort();
  }
);

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

export const selectSelectedEventVersion = createSelector(
  selectTimeMapState,
  (state) => state.selectedEventVersion
);

export const selectSelectedEvent = createSelector(
  selectAllEvents,
  selectSelectedEventId,
  selectSelectedEventVersion,
  (events, id) => id ? events.find(e => e.id === id) || null : null
);

export const selectSelectedCharacter = createSelector(
  selectTimeMapState,
  (state) => state.selectedCharacter
);

export const selectSelectedCharacterVersion = createSelector(
  selectTimeMapState,
  (state) => state.selectedCharacterVersion
);

export const selectIsCharacterMode = createSelector(
  selectSelectedCharacter,
  (c) => c !== null
);

export const selectCharacterEvents = createSelector(
  selectAllEvents,
  selectSelectedCharacter,
  (events, character) => {
    if (!character) return [] as typeof events;
    return events
      .filter((e) => e.characters.includes(character))
      .slice()
      .sort((a, b) => a.year - b.year);
  }
);

export const selectCharacterTrajectory = createSelector(
  selectCharacterEvents,
  (charEvents) => charEvents
    .filter((e) => e.validationStatus === 'valid'
      && !isNaN(e.lat) && !isNaN(e.lng)
      && e.lat >= -90 && e.lat <= 90
      && e.lng >= -180 && e.lng <= 180)
    .map((e) => [e.lat, e.lng] as [number, number])
);

export const selectCharacterNovels = createSelector(
  selectCharacterEvents,
  (charEvents) => Array.from(new Set(charEvents.map((e) => e.novel))).sort()
);

export const selectCharacterDominantNovel = createSelector(
  selectCharacterEvents,
  (charEvents) => {
    if (charEvents.length === 0) return null;
    const counts = new Map<string, number>();
    for (const e of charEvents) {
      counts.set(e.novel, (counts.get(e.novel) ?? 0) + 1);
    }
    let bestCount = -1;
    let bestNovel: string | null = null;
    // charEvents 已依年份升冪，第一個達到最高 count 的小說即為 deterministic winner
    for (const e of charEvents) {
      const c = counts.get(e.novel) ?? 0;
      if (c > bestCount) {
        bestCount = c;
        bestNovel = e.novel;
      }
    }
    return bestNovel;
  }
);

export const selectAllCharacters = createSelector(
  selectAllEvents,
  (events) => {
    const set = new Set<string>();
    for (const e of events) {
      for (const c of e.characters) {
        if (c && c.trim() !== '') set.add(c);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-Hant'));
  }
);
