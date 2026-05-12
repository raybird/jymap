import { Injectable } from '@angular/core';
import { ValidatedEvent } from '../utils/data-validator';

export interface ScoredEvent {
  event: ValidatedEvent;
  score: number;
  reasons: string[];
}

@Injectable({ providedIn: 'root' })
export class RelatedEventsService {
  findRelatedEvents(currentEvent: ValidatedEvent, allEvents: ValidatedEvent[], limit = 5): ValidatedEvent[] {
    const scored: ScoredEvent[] = [];

    for (const candidate of allEvents) {
      if (candidate.id === currentEvent.id) continue;
      const result = this.computeScore(currentEvent, candidate);
      if (result.score > 0) scored.push(result);
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.event);
  }

  private computeScore(current: ValidatedEvent, candidate: ValidatedEvent): ScoredEvent {
    let score = 0;
    const reasons: string[] = [];

    const latDiff = Math.abs(current.lat - candidate.lat);
    const lngDiff = Math.abs(current.lng - candidate.lng);

    if (latDiff < 0.01 && lngDiff < 0.01) {
      score += 10; reasons.push('相同地點');
    } else if (latDiff < 0.5 && lngDiff < 0.5) {
      score += 5; reasons.push('鄰近地點');
    }

    const sharedChars = current.characters.filter(c => candidate.characters.includes(c));
    if (sharedChars.length > 0) {
      score += sharedChars.length * 3;
      reasons.push(`共同人物：${sharedChars.join('、')}`);
    }

    if (current.novel === candidate.novel) {
      score += 2; reasons.push('同部作品');
    }

    const yearDiff = Math.abs(current.year - candidate.year);
    if (yearDiff === 0) {
      score += 3; reasons.push('同年事件');
    } else if (yearDiff <= 5) {
      score += 1; reasons.push('時間相近');
    }

    return { event: candidate, score, reasons };
  }
}
