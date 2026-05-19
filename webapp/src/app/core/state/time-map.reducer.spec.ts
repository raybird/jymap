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

  describe('selectEvent in character mode auto-exits', () => {
    it('selectEvent 時若處於人物模式：還原 snapshot 並選中事件', () => {
      const inCharMode: TimeMapState = {
        ...stateWithEvents(),
        selectedCharacter: '郭靖',
        selectedCharacterVersion: 1,
        currentTimeRange: { startYear: 1179, endYear: 1270 },
        preCharacterSnapshot: {
          timeRange: { startYear: 1000, endYear: 1300 },
          selectedNovel: '神鵰俠侶'
        }
      };
      const next = timeMapReducer(inCharMode, TimeMapActions.selectEvent({ eventId: 'e3' }));
      expect(next.selectedCharacter).toBeNull();
      expect(next.preCharacterSnapshot).toBeNull();
      expect(next.currentTimeRange).toEqual({ startYear: 1000, endYear: 1300 });
      expect(next.selectedNovel).toBe('神鵰俠侶');
      expect(next.selectedEventId).toBe('e3');
    });

    it('setNovelFilter 時若處於人物模式：先還原 snapshot 再套用 novel filter', () => {
      const inCharMode: TimeMapState = {
        ...stateWithEvents(),
        selectedCharacter: '郭靖',
        selectedCharacterVersion: 1,
        currentTimeRange: { startYear: 1179, endYear: 1270 },
        preCharacterSnapshot: {
          timeRange: { startYear: 1000, endYear: 1300 },
          selectedNovel: null
        }
      };
      const next = timeMapReducer(
        inCharMode,
        TimeMapActions.setNovelFilter({ novel: '神鵰俠侶' })
      );
      expect(next.selectedCharacter).toBeNull();
      expect(next.preCharacterSnapshot).toBeNull();
      expect(next.currentTimeRange).toEqual({ startYear: 1000, endYear: 1300 });
      expect(next.selectedNovel).toBe('神鵰俠侶');
    });

    it('非人物模式時 selectEvent 保持原行為', () => {
      const normal: TimeMapState = {
        ...stateWithEvents(),
        currentTimeRange: { startYear: 1000, endYear: 1300 }
      };
      const next = timeMapReducer(normal, TimeMapActions.selectEvent({ eventId: 'e1' }));
      expect(next.currentTimeRange).toEqual({ startYear: 1000, endYear: 1300 });
      expect(next.selectedEventId).toBe('e1');
    });
  });

  describe('clearSelectedCharacter', () => {
    it('還原 snapshot 中的 timeRange 與 selectedNovel', () => {
      const inCharMode: TimeMapState = {
        ...stateWithEvents(),
        selectedCharacter: '郭靖',
        selectedCharacterVersion: 1,
        currentTimeRange: { startYear: 1179, endYear: 1270 },
        selectedNovel: null,
        preCharacterSnapshot: {
          timeRange: { startYear: 1000, endYear: 1300 },
          selectedNovel: '神鵰俠侶'
        }
      };
      const next = timeMapReducer(inCharMode, TimeMapActions.clearSelectedCharacter());
      expect(next.currentTimeRange).toEqual({ startYear: 1000, endYear: 1300 });
      expect(next.selectedNovel).toBe('神鵰俠侶');
      expect(next.selectedCharacter).toBeNull();
      expect(next.preCharacterSnapshot).toBeNull();
    });

    it('snapshot 為 null 時退化為清空 timeRange 與 novel', () => {
      const noSnapshot: TimeMapState = {
        ...stateWithEvents(),
        selectedCharacter: '郭靖',
        currentTimeRange: { startYear: 1179, endYear: 1270 },
        preCharacterSnapshot: null
      };
      const next = timeMapReducer(noSnapshot, TimeMapActions.clearSelectedCharacter());
      expect(next.currentTimeRange).toBeNull();
      expect(next.selectedNovel).toBeNull();
      expect(next.selectedCharacter).toBeNull();
    });

    it('visibleEvents 依還原後的 range 與 novel 重算', () => {
      const inCharMode: TimeMapState = {
        ...stateWithEvents(),
        selectedCharacter: '郭靖',
        currentTimeRange: { startYear: 1179, endYear: 1270 },
        preCharacterSnapshot: {
          timeRange: { startYear: 1255, endYear: 1300 },
          selectedNovel: null
        }
      };
      const next = timeMapReducer(inCharMode, TimeMapActions.clearSelectedCharacter());
      const ids = next.visibleEvents.map(e => e.id).sort();
      expect(ids).toEqual(['e3']);
    });
  });
});
