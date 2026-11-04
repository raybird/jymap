import { ValidatedEvent } from '../../core/utils/data-validator';
import { buildChronicle, ESTIMATED_SECTION_LABEL } from './chronicle';

function makeEvent(overrides: Partial<ValidatedEvent>): ValidatedEvent {
  return {
    id: 'e', title: 't', dynasty: '南宋', year: 1200, lat: 30, lng: 110, novel: '射鵰英雄傳',
    characters: [], sources: [], tags: [], validationStatus: 'valid', validationErrors: [], ...overrides
  } as ValidatedEvent;
}

describe('buildChronicle', () => {
  it('依朝代分段、段內依年份分組並計數', () => {
    const sections = buildChronicle([
      makeEvent({ id: 'c', dynasty: '南宋', year: 1223 }),
      makeEvent({ id: 'a', dynasty: '春秋', year: -476 }),
      makeEvent({ id: 'b', dynasty: '南宋', year: 1223 }),
      makeEvent({ id: 'd', dynasty: '南宋', year: 1200 })
    ]);
    expect(sections.map(s => [s.label, s.count])).toEqual([['春秋', 1], ['南宋', 3]]);
    expect(sections[0].groups[0].label).toBe('西元前476年');
    expect(sections[1].groups.map(g => [g.label, g.events.map(e => e.id)])).toEqual([
      ['西元1200年', ['d']], ['西元1223年', ['c', 'b']]
    ]);
  });

  it('推估事件不進年份組，放在最後一段並依情節先後排序', () => {
    const era = (storyOrder: number) => ({ startYear: 1665, endYear: null, label: '約 1665 年後（確年未詳）', storyOrder });
    const sections = buildChronicle([
      makeEvent({ id: 'late', dynasty: '清', year: 1680, novel: '連城訣', eraEstimate: era(2) }),
      makeEvent({ id: 'early', dynasty: '清', year: 1700, novel: '連城訣', eraEstimate: era(1) }),
      makeEvent({ id: 'dated', dynasty: '清', year: 1680 })
    ]);
    expect(sections.map(s => s.label)).toEqual(['清', ESTIMATED_SECTION_LABEL]);
    expect(sections[0].groups.map(g => g.events.map(e => e.id))).toEqual([['dated']]);
    const estimated = sections[1].groups[0];
    expect(estimated.label).toBe('約 1665 年後（確年未詳）');
    expect(estimated.note).toBe('《連城訣》・清');
    expect(estimated.events.map(e => e.id)).toEqual(['early', 'late']);
  });

  it('沒有推估事件時不出現確年未詳段', () => {
    expect(buildChronicle([makeEvent({})]).map(s => s.label)).toEqual(['南宋']);
  });

  it('真實資料：全部事件都在年表中，且佔位年份沒有出現在任何標題', async () => {
    const events: ValidatedEvent[] = await (await fetch('/assets/data/events.json')).json();
    const sections = buildChronicle(events);
    const listed = sections.flatMap(s => s.groups.flatMap(g => g.events.map(e => e.id)));
    expect(listed.length).toBe(events.length);
    expect(new Set(listed).size).toBe(events.length);

    const estimated = events.filter(e => e.eraEstimate);
    expect(estimated.length).toBeGreaterThan(0);
    const datedLabels = sections.filter(s => !s.estimated).flatMap(s => s.groups.map(g => g.label));
    const datedIds = new Set(sections.filter(s => !s.estimated).flatMap(s => s.groups.flatMap(g => g.events.map(e => e.id))));
    for (const event of estimated) {
      expect(datedIds.has(event.id)).withContext(event.id).toBeFalse();
    }
    const estimatedSection = sections.find(s => s.estimated)!;
    expect(estimatedSection.count).toBe(estimated.length);
    for (const group of estimatedSection.groups) {
      expect(group.label).toBe(group.events[0].eraEstimate!.label);
    }
    // 確年段的朝代不重複，依時間先後
    const dynasties = sections.filter(s => !s.estimated).map(s => s.label);
    expect(new Set(dynasties).size).toBe(dynasties.length);
    expect(datedLabels.length).toBeGreaterThan(0);
  });
});
