import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { AppState } from '../../../core/state/app.state';
import * as TimeMapSelectors from '../../../core/state/time-map.selectors';
import * as TimeMapActions from '../../../core/state/time-map.actions';
import { ValidatedEvent } from '../../../core/utils/data-validator';

@Component({
    selector: 'app-character-panel',
    imports: [CommonModule],
    templateUrl: './character-panel.component.html',
    styleUrl: './character-panel.component.scss'
})
export class CharacterPanelComponent implements OnDestroy {
  @Output() close = new EventEmitter<void>();

  character$: Observable<string | null>;
  events$: Observable<ValidatedEvent[]>;
  novels$: Observable<string[]>;

  private destroy$ = new Subject<void>();

  constructor(private store: Store<AppState>) {
    this.character$ = this.store.select(TimeMapSelectors.selectSelectedCharacter);
    this.events$ = this.store.select(TimeMapSelectors.selectCharacterEvents);
    this.novels$ = this.store.select(TimeMapSelectors.selectCharacterNovels);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getYearText(year: number): string {
    return year < 0 ? `西元前${Math.abs(year)}年` : `西元${year}年`;
  }

  getActiveRangeText(events: ValidatedEvent[]): string {
    if (events.length === 0) return '—';
    const min = events[0].year;
    const max = events[events.length - 1].year;
    if (min === max) return this.getYearText(min);
    return `${this.getYearText(min)} ~ ${this.getYearText(max)}`;
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
    this.store.dispatch(TimeMapActions.selectEvent({ eventId: event.id }));
  }

  isInvalidCoordinate(event: ValidatedEvent): boolean {
    return event.validationStatus !== 'valid' || isNaN(event.lat) || isNaN(event.lng);
  }
}
