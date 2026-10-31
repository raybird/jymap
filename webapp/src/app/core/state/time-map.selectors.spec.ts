import * as Selectors from './time-map.selectors';
import { TimeMapState, initialTimeMapState } from './time-map.reducer';
import { ValidatedEvent } from '../utils/data-validator';
import { AppState } from './app.state';

function makeEvent(p: Partial<ValidatedEvent>): ValidatedEvent {
  return {
    id: 'e',
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
    ...p
  } as ValidatedEvent;
}

describe('character-mode selectors', () => {
  const events: ValidatedEvent[] = [
    makeEvent({ id: 'a', year: 1199, lat: 40, lng: 110, characters: ['郭靖'], novel: '射鵰英雄傳' }),
    makeEvent({ id: 'b', year: 1250, lat: 30, lng: 120, characters: ['郭靖', '黃蓉'], novel: '射鵰英雄傳' }),
    makeEvent({ id: 'c', year: 1260, lat: 25, lng: 115, characters: ['郭靖'], novel: '神鵰俠侶' }),
    makeEvent({ id: 'd', year: 1265, lat: NaN, lng: 100, characters: ['郭靖'], novel: '神鵰俠侶', validationStatus: 'invalid-coordinates' }),
    makeEvent({ id: 'e', year: 1100, lat: 35, lng: 110, characters: ['楊過'], novel: '神鵰俠侶' })
  ];

  function makeState(over: Partial<TimeMapState> = {}): AppState {
    return {
      timeMap: { ...initialTimeMapState, events, ...over }
    };
  }

  describe('selectSelectedCharacter / selectIsCharacterMode', () => {
    it('character null → 非人物模式', () => {
      expect(Selectors.selectSelectedCharacter(makeState())).toBeNull();
      expect(Selectors.selectIsCharacterMode(makeState())).toBe(false);
    });

    it('character 設定 → 人物模式', () => {
      const s = makeState({ selectedCharacter: '郭靖' });
      expect(Selectors.selectSelectedCharacter(s)).toBe('郭靖');
      expect(Selectors.selectIsCharacterMode(s)).toBe(true);
    });
  });

  describe('selectCharacterEvents', () => {
    it('未進入人物模式時回傳空陣列', () => {
      expect(Selectors.selectCharacterEvents.projector(events, null)).toEqual([]);
    });

    it('過濾並依年份升冪', () => {
      const got = Selectors.selectCharacterEvents.projector(events, '郭靖');
      expect(got.map(e => e.id)).toEqual(['a', 'b', 'c', 'd']);
    });
  });

  describe('selectCharacterEvents 的推估事件', () => {
    it('同作品依情節先後排序，不受佔位年份倒置影響', () => {
      const era = { startYear: 1665, endYear: null, label: '約 1665 年後（確年未詳）' };
      const list = [
        makeEvent({ id: 'jail', year: 1700, characters: ['狄雲'], novel: '連城訣', eraEstimate: { ...era, storyOrder: 2 } }),
        makeEvent({ id: 'home', year: 1701, characters: ['狄雲'], novel: '連城訣', eraEstimate: { ...era, storyOrder: 1 } })
      ];
      const got = Selectors.selectCharacterEvents.projector(list, '狄雲');
      expect(got.map(e => e.id)).toEqual(['home', 'jail']);
    });
  });

  describe('selectCharacterTrajectory', () => {
    it('未進入人物模式時回傳空陣列', () => {
      expect(Selectors.selectCharacterTrajectory.projector([])).toEqual([]);
    });

    it('過濾 invalid 並回傳 [lat,lng][]', () => {
      const charEvents = Selectors.selectCharacterEvents.projector(events, '郭靖');
      const traj = Selectors.selectCharacterTrajectory.projector(charEvents);
      expect(traj).toEqual([[40, 110], [30, 120], [25, 115]]);
    });
  });

  describe('selectCharacterNovels', () => {
    it('unique 並排序', () => {
      const charEvents = Selectors.selectCharacterEvents.projector(events, '郭靖');
      const novels = Selectors.selectCharacterNovels.projector(charEvents);
      expect(novels).toEqual(['射鵰英雄傳', '神鵰俠侶']);
    });
  });

  describe('selectCharacterDominantNovel', () => {
    it('回傳出現次數最多的小說', () => {
      const charEvents = Selectors.selectCharacterEvents.projector(events, '郭靖');
      expect(Selectors.selectCharacterDominantNovel.projector(charEvents)).toBe('射鵰英雄傳');
    });

    it('並列時取年份最早事件的小說（deterministic）', () => {
      const tied: ValidatedEvent[] = [
        makeEvent({ id: 'x', year: 1100, novel: '神鵰俠侶' }),
        makeEvent({ id: 'y', year: 1200, novel: '射鵰英雄傳' })
      ];
      expect(Selectors.selectCharacterDominantNovel.projector(tied)).toBe('神鵰俠侶');
    });

    it('空輸入回傳 null', () => {
      expect(Selectors.selectCharacterDominantNovel.projector([])).toBeNull();
    });
  });

  describe('selectAllCharacters', () => {
    it('蒐集所有事件的人物去重排序', () => {
      const list = Selectors.selectAllCharacters.projector(events);
      expect(list).toEqual(['楊過', '郭靖', '黃蓉'].sort((a, b) => a.localeCompare(b, 'zh-Hant')));
    });
  });
});
