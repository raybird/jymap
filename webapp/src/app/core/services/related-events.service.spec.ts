import { ValidatedEvent } from '../utils/data-validator';
import { RelatedEventsService } from './related-events.service';

function makeEvent(overrides: Partial<ValidatedEvent>): ValidatedEvent {
  return {
    id: 'e', title: '事件', dynasty: '明', year: 1503, lat: 30, lng: 120, novel: '笑傲江湖',
    characters: ['令狐沖'], sources: [], tags: [], validationStatus: 'valid', validationErrors: [], ...overrides
  };
}

describe('RelatedEventsService', () => {
  const service = new RelatedEventsService();
  const era = { startYear: 1398, endYear: 1661, label: '約 1398–1661 年間（確年未詳）', storyOrder: 1 };

  it('推估事件的佔位年份相同時不算同年事件', () => {
    const current = makeEvent({ id: 'a', eraEstimate: era });
    const candidate = makeEvent({ id: 'b', eraEstimate: { ...era, storyOrder: 2 } });
    const [related] = service.findRelatedEventsWithReasons(current, [current, candidate]);
    expect(related.event.id).toBe('b');
    expect(related.reasons).not.toContain('同年事件');
    expect(related.reasons).not.toContain('時間相近');
  });

  it('一般事件維持同年判斷', () => {
    const current = makeEvent({ id: 'a' });
    const candidate = makeEvent({ id: 'b' });
    const [related] = service.findRelatedEventsWithReasons(current, [current, candidate]);
    expect(related.reasons).toContain('同年事件');
  });
});
