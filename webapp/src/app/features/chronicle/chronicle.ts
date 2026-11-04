import { ValidatedEvent } from '../../core/utils/data-validator';
import { compareEventsByTime, getEventDynastyText, getYearText } from '../../core/utils/event-time';

export interface ChronicleGroup {
  key: string;
  /** 年份標題，或推估事件的區間文字 */
  label: string;
  /** 推估組的作品與朝代說明；確年組沒有 */
  note?: string;
  events: ValidatedEvent[];
}

export interface ChronicleSection {
  key: string;
  label: string;
  estimated: boolean;
  count: number;
  groups: ChronicleGroup[];
}

export const ESTIMATED_SECTION_LABEL = '確年未詳';

/**
 * 把事件排成年表：確年事件依朝代分段、段內依年份分組；
 * 推估事件的 year 只是排序佔位（2026-10-31），不併入年份組，集中在最後一段，每部作品一組
 */
export function buildChronicle(events: readonly ValidatedEvent[]): ChronicleSection[] {
  const dated = events.filter(event => !event.eraEstimate).sort(compareEventsByTime);
  const sections = new Map<string, ChronicleSection>();

  for (const event of dated) {
    let section = sections.get(event.dynasty);
    if (!section) {
      section = { key: `dynasty-${event.dynasty}`, label: event.dynasty, estimated: false, count: 0, groups: [] };
      sections.set(event.dynasty, section);
    }
    let group = section.groups[section.groups.length - 1];
    const label = getYearText(event.year);
    if (group?.label !== label) {
      group = { key: `${section.key}-${event.year}`, label, events: [] };
      section.groups.push(group);
    }
    group.events.push(event);
    section.count++;
  }

  const result = [...sections.values()];
  const estimated = buildEstimatedGroups(events);
  if (estimated.length) {
    result.push({
      key: 'estimated',
      label: ESTIMATED_SECTION_LABEL,
      estimated: true,
      count: estimated.reduce((sum, group) => sum + group.events.length, 0),
      groups: estimated
    });
  }
  return result;
}

function buildEstimatedGroups(events: readonly ValidatedEvent[]): ChronicleGroup[] {
  const groups = new Map<string, { start: number; group: ChronicleGroup }>();
  for (const event of events) {
    const era = event.eraEstimate;
    if (!era) continue;
    const id = `${event.novel}|${era.label}`;
    let entry = groups.get(id);
    if (!entry) {
      entry = {
        start: era.startYear,
        group: {
          key: `estimated-${groups.size}`,
          label: era.label,
          note: `《${event.novel}》・${getEventDynastyText(event)}`,
          events: []
        }
      };
      groups.set(id, entry);
    }
    entry.group.events.push(event);
  }
  return [...groups.values()]
    .sort((a, b) => a.start - b.start || a.group.note!.localeCompare(b.group.note!, 'zh-Hant'))
    .map(({ group }) => ({
      ...group,
      events: group.events.sort((a, b) => a.eraEstimate!.storyOrder - b.eraEstimate!.storyOrder)
    }));
}
