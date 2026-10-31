import { Component, EventEmitter, OnDestroy, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { AppState } from '../../../core/state/app.state';
import * as TimeMapSelectors from '../../../core/state/time-map.selectors';
import { ValidatedEvent } from '../../../core/utils/data-validator';
import { getEventDynastyText, getEventTimeText } from '../../../core/utils/event-time';

@Component({
    selector: 'app-character-panel',
    imports: [CommonModule],
    templateUrl: './character-panel.component.html',
    styleUrl: './character-panel.component.scss'
})
export class CharacterPanelComponent implements OnDestroy {
  @Input() canGoBack = false;
  @Output() back = new EventEmitter<void>();
  @Output() focusEvent = new EventEmitter<ValidatedEvent>();
  @Output() openEvent = new EventEmitter<ValidatedEvent>();
  selectedEventId$: Observable<string | null>;
  @Output() close = new EventEmitter<void>();

  character$: Observable<string | null>;
  events$: Observable<ValidatedEvent[]>;
  novels$: Observable<string[]>;

  private destroy$ = new Subject<void>();

  constructor(private store: Store<AppState>) {
    this.selectedEventId$ = this.store.select(TimeMapSelectors.selectSelectedEventId);
    this.character$ = this.store.select(TimeMapSelectors.selectSelectedCharacter);
    this.events$ = this.store.select(TimeMapSelectors.selectCharacterEvents);
    this.novels$ = this.store.select(TimeMapSelectors.selectCharacterNovels);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  readonly getDynastyText = getEventDynastyText;
  readonly getTimeText = getEventTimeText;

  getActiveRangeText(events: ValidatedEvent[]): string {
    if (events.length === 0) return '—';
    const first = getEventTimeText(events[0]);
    const last = getEventTimeText(events[events.length - 1]);
    return first === last ? first : `${first} ~ ${last}`;
  }

  getLocationCount(events: ValidatedEvent[]): number {
    const set = new Set<string>();
    for (const e of events) {
      if (e.validationStatus === 'valid' && !isNaN(e.lat) && !isNaN(e.lng)) {
        set.add(`${e.lat.toFixed(4)},${e.lng.toFixed(4)}`);
      }
    }
    return set.size;
  }

  onEventClick(event: ValidatedEvent): void {
    this.focusEvent.emit(event);
  }

  getActiveIndex(events: ValidatedEvent[], selectedId: string | null): number {
    return Math.max(0, events.findIndex(event => event.id === selectedId));
  }

  isInvalidCoordinate(event: ValidatedEvent): boolean {
    return event.validationStatus !== 'valid' || isNaN(event.lat) || isNaN(event.lng);
  }
}
