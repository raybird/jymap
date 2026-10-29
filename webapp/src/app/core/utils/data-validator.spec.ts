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
});
