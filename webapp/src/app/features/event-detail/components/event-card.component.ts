import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { ValidatedEvent } from '../../../core/utils/data-validator';
import { RelatedEventsService } from '../../../core/services/related-events.service';
import { AppState } from '../../../core/state/app.state';
import * as TimeMapSelectors from '../../../core/state/time-map.selectors';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.scss'
})
export class EventCardComponent implements OnChanges, OnDestroy {
  @Input() event: ValidatedEvent | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() navigateToEvent = new EventEmitter<ValidatedEvent>();

  relatedEvents: ValidatedEvent[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private relatedEventsService: RelatedEventsService
  ) {}

  ngOnChanges(): void {
    if (this.event) {
      this.findRelated();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private findRelated(): void {
    if (!this.event) return;
    this.store.select(TimeMapSelectors.selectAllEvents).pipe(
      takeUntil(this.destroy$)
    ).subscribe(allEvents => {
      this.relatedEvents = this.relatedEventsService.findRelatedEvents(this.event!, allEvents, 5);
    });
  }

  onRelatedClick(e: ValidatedEvent): void {
    this.navigateToEvent.emit(e);
  }

  getYearText(year: number): string {
    return year < 0 ? `西元前${Math.abs(year)}年` : `西元${year}年`;
  }
}
