import { SearchService } from './search.service';
import { ValidatedEvent } from '../utils/data-validator';

const event: ValidatedEvent = {
  id: 'e1', title: '襄陽守城', dynasty: '南宋', year: 1250,
  lat: 32, lng: 112, novel: '射鵰英雄傳', characters: ['郭靖'],
  sources: [], tags: [], validationStatus: 'valid', validationErrors: []
};

describe('SearchService', () => {
  it('Fuse 回傳零距離時保留最高相關性並排在模糊匹配之前', () => {
    const service = new SearchService();
    service.setEvents([event]);
    const fuse = (service as any).fuseInstance;
    spyOn(fuse, 'search').and.returnValue([
      { item: event, score: 0 },
      { item: { ...event, id: 'e2' }, score: 0.2 }
    ]);
    const results = service.search('襄陽守城');
    expect(results.map(result => result.event.id)).toEqual(['e1', 'e2']);
    expect(results[0].score).toBe(1);
  });

  it('人物與小說索引獨立搜尋，資料清空時同步移除建議', () => {
    const service = new SearchService();
    service.setEvents([event]);
    expect(service.suggest('郭靖').characters).toEqual(['郭靖']);
    expect(service.suggest('射鵰').novels).toEqual(['射鵰英雄傳']);
    service.setEvents([]);
    expect(service.suggest('郭靖')).toEqual({ characters: [], novels: [] });
  });

  it('使用真實索引可搜尋人物，空白查詢會清除結果', () => {
    const service = new SearchService();
    service.setEvents([event]);
    expect(service.search('郭靖')[0].event.id).toBe(event.id);
    expect(service.search('  ')).toEqual([]);
  });
});
