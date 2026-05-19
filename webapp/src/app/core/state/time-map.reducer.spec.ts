import { timeMapReducer, initialTimeMapState, TimeMapState } from './time-map.reducer';
import * as TimeMapActions from './time-map.actions';
import { ValidatedEvent } from '../utils/data-validator';

function makeEvent(overrides: Partial<ValidatedEvent>): ValidatedEvent {
  return {
    id: 'e1',
    title: 't',
    dynasty: '南宋',
    year: 1200,
    lat: 30,
    lng: 110,
    novel: '射鵰英雄傳',
    characters: [],
    sources: [],
    tags: [],
    description: '',
    summary: '',
    validationStatus: 'valid',
    validationErrors: [],
    ...overrides
  } as ValidatedEvent;
}

describe('timeMapReducer - character mode', () => {
  const guoJing1 = makeEvent({ id: 'e1', year: 1199, characters: ['郭靖'] });
  const guoJing2 = makeEvent({ id: 'e2', year: 1250, characters: ['郭靖', '黃蓉'] });
  const yangGuo = makeEvent({ id: 'e3', year: 1260, characters: ['楊過'] });

  function stateWithEvents(extra: Partial<TimeMapState> = {}): TimeMapState {
    return {
      ...initialTimeMapState,
      events: [guoJing1, guoJing2, yangGuo],
      visibleEvents: [guoJing1, guoJing2, yangGuo],
      ...extra
    };
  }

  describe('selectCharacter', () => {
    it('保存當前 timeRange/novel 為 snapshot', () => {
      const before = stateWithEvents({
        currentTimeRange: { startYear: 1000, endYear: 1300 },
        selectedNovel: '神鵰俠侶'
      });
      const next = timeMapReducer(before, TimeMapActions.selectCharacter({ character: '郭靖' }));
      expect(next.preCharacterSnapshot).toEqual({
        timeRange: { startYear: 1000, endYear: 1300 },
        selectedNovel: '神鵰俠侶'
      });
    });

    it('擴展 timeRange 至人物活躍期 ±20 年', () => {
      const next = timeMapReducer(
        stateWithEvents(),
        TimeMapActions.selectCharacter({ character: '郭靖' })
      );
      expect(next.currentTimeRange).toEqual({ startYear: 1199 - 20, endYear: 1250 + 20 });
    });

    it('清空 selectedNovel 與 selectedEventId', () => {
      const before = stateWithEvents({ selectedNovel: '射鵰英雄傳', selectedEventId: 'e1' });
      const next = timeMapReducer(before, TimeMapActions.selectCharacter({ character: '郭靖' }));
      expect(next.selectedNovel).toBeNull();
      expect(next.selectedEventId).toBeNull();
    });

    it('設定 selectedCharacter 並遞增 version', () => {
      const next = timeMapReducer(
        stateWithEvents(),
        TimeMapActions.selectCharacter({ character: '郭靖' })
      );
      expect(next.selectedCharacter).toBe('郭靖');
      expect(next.selectedCharacterVersion).toBe(1);
    });

    it('連續切換人物：snapshot 不被覆蓋', () => {
      const before = stateWithEvents({
        currentTimeRange: { startYear: 1000, endYear: 1300 },
        selectedNovel: '神鵰俠侶'
      });
      const after1 = timeMapReducer(before, TimeMapActions.selectCharacter({ character: '郭靖' }));
      const after2 = timeMapReducer(after1, TimeMapActions.selectCharacter({ character: '楊過' }));
      expect(after2.preCharacterSnapshot).toEqual({
        timeRange: { startYear: 1000, endYear: 1300 },
        selectedNovel: '神鵰俠侶'
      });
      expect(after2.selectedCharacter).toBe('楊過');
    });

    it('空字串 character 不改變 state', () => {
      const before = stateWithEvents();
      const next = timeMapReducer(before, TimeMapActions.selectCharacter({ character: '  ' }));
      expect(next).toBe(before);
    });

    it('該人物 0 筆事件：不改變 state', () => {
      const before = stateWithEvents();
      const next = timeMapReducer(before, TimeMapActions.selectCharacter({ character: '不存在' }));
      expect(next).toBe(before);
    });

    it('visibleEvents 依新 range 重算（且不再套用 novel filter）', () => {
      const before = stateWithEvents({
        currentTimeRange: { startYear: 1000, endYear: 1100 },
        selectedNovel: '神鵰俠侶'
      });
      const next = timeMapReducer(before, TimeMapActions.selectCharacter({ character: '郭靖' }));
      const ids = next.visibleEvents.map(e => e.id).sort();
      expect(ids).toEqual(['e1', 'e2', 'e3']);
    });
  });
});
