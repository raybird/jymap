import { DataValidator } from './data-validator';

describe('DataValidator', () => {
  it('將格式錯誤的陣列欄位正規化，讓人物 selector 與地圖可安全使用', () => {
    const event = DataValidator.validateAndMarkEvent({
      id: 'e1', title: '襄陽守城', dynasty: '南宋', year: 1250,
      lat: 32, lng: 112, novel: '射鵰英雄傳',
      characters: null, sources: '來源', tags: undefined
    });
    expect(event.characters).toEqual([]);
    expect(event.sources).toEqual([]);
    expect(event.tags).toEqual([]);
    expect(event.validationErrors.length).toBe(3);
  });

  describe('eraEstimate', () => {
    const base = { id: 'e', title: 't', dynasty: '明', year: 1500, lat: 30, lng: 120, novel: 'n', characters: [], sources: [], tags: [] };

    it('接受只有下限的區間', () => {
      const era = { startYear: 1665, endYear: null, label: '約 1665 年後（確年未詳）', storyOrder: 1 };
      expect(DataValidator.validateEvent({ ...base, eraEstimate: era }).isValid).toBeTrue();
    });

    it('拒絕起訖顛倒的區間', () => {
      const era = { startYear: 1661, endYear: 1398, label: 'x', storyOrder: 1 };
      expect(DataValidator.validateEvent({ ...base, eraEstimate: era }).isValid).toBeFalse();
    });

    it('拒絕缺少顯示文字的區間', () => {
      const era = { startYear: 1398, endYear: 1661, storyOrder: 1 };
      expect(DataValidator.validateEvent({ ...base, eraEstimate: era }).isValid).toBeFalse();
    });
  });
});
