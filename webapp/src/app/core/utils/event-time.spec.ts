import { Event } from '../models';
import {
  TIMELINE_MAX_YEAR,
  compareEventsByTime,
  getEventDynastyText,
  getEventFocusYear,
  getEventSpan,
  getEventTimeText,
  overlapsTimeRange
} from './event-time';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'e', title: '事件', dynasty: '明', year: 1500, lat: 30, lng: 120,
    novel: '笑傲江湖', characters: [], sources: [], tags: [], ...overrides
  };
}

const era = { startYear: 1398, endYear: 1661, label: '約 1398–1661 年間（確年未詳）', dynastyLabel: '約明代', storyOrder: 1 };

describe('event-time', () => {
  it('一般事件的範圍是單一年份', () => {
    expect(getEventSpan(makeEvent({ year: -473 }))).toEqual({ start: -473, end: -473 });
  });

  it('推估事件的範圍取區間，不使用佔位 year', () => {
    expect(getEventSpan(makeEvent({ eraEstimate: era }))).toEqual({ start: 1398, end: 1661 });
  });

  it('沒有上限的區間以時間軸終點為界', () => {
    const open = makeEvent({ eraEstimate: { ...era, endYear: null } });
    expect(getEventSpan(open).end).toBe(TIMELINE_MAX_YEAR);
  });

  it('跳轉推估事件時取區間中點', () => {
    expect(getEventFocusYear(makeEvent({ eraEstimate: era }))).toBe(1530);
    expect(getEventFocusYear(makeEvent({ year: 1092 }))).toBe(1092);
  });

  it('視窗只要與區間重疊就算在範圍內，即使不含佔位 year', () => {
    const event = makeEvent({ eraEstimate: era });
    expect(overlapsTimeRange(event, { startYear: 1600, endYear: 1650 })).toBeTrue();
    expect(overlapsTimeRange(event, { startYear: 1700, endYear: 1750 })).toBeFalse();
  });

  it('一般事件維持年份落在範圍內才算', () => {
    const event = makeEvent({ year: 1500 });
    expect(overlapsTimeRange(event, { startYear: 1500, endYear: 1500 })).toBeTrue();
    expect(overlapsTimeRange(event, { startYear: 1501, endYear: 1600 })).toBeFalse();
  });

  it('顯示文字優先使用推估資料，否則沿用年份與朝代', () => {
    expect(getEventTimeText(makeEvent({ eraEstimate: era }))).toBe(era.label);
    expect(getEventDynastyText(makeEvent({ eraEstimate: era }))).toBe('約明代');
    expect(getEventTimeText(makeEvent({ year: -473 }))).toBe('西元前473年');
    expect(getEventDynastyText(makeEvent())).toBe('明');
  });

  it('沒有 dynastyLabel 時沿用 dynasty', () => {
    const { dynastyLabel, ...withoutLabel } = era;
    expect(getEventDynastyText(makeEvent({ dynasty: '清', eraEstimate: withoutLabel }))).toBe('清');
  });

  it('同作品推估事件依情節先後排序，佔位年份倒置也不受影響', () => {
    const before = makeEvent({ year: 1701, eraEstimate: { ...era, storyOrder: 1 } });
    const after = makeEvent({ year: 1700, eraEstimate: { ...era, storyOrder: 2 } });
    expect([after, before].sort(compareEventsByTime)).toEqual([before, after]);
  });

  it('其他情況依年份排序', () => {
    const early = makeEvent({ year: 1200 });
    const late = makeEvent({ year: 1300 });
    expect([late, early].sort(compareEventsByTime)).toEqual([early, late]);
  });
});
