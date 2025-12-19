import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import * as TimeMapActions from './time-map.actions';
import { DataService } from '../services/data.service';

@Injectable()
export class TimeMapEffects {
  private actions$ = inject(Actions);
  private dataService = inject(DataService);

  loadEvents$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TimeMapActions.loadEvents),
      mergeMap(() =>
        this.dataService.loadEvents().pipe(
          map((result) => TimeMapActions.loadEventsSuccess({ result })),
          catchError((error: Error) => of(TimeMapActions.loadEventsFailure({ error: error.message })))
        )
      )
    )
  );

  loadTimeline$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TimeMapActions.loadTimeline),
      mergeMap(() =>
        this.dataService.loadTimeline().pipe(
          map((result) => TimeMapActions.loadTimelineSuccess({ result })),
          catchError((error: Error) => of(TimeMapActions.loadTimelineFailure({ error: error.message })))
        )
      )
    )
  );
}



