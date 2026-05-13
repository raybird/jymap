import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../../../core/state/app.state';
import * as TimeMapSelectors from '../../../core/state/time-map.selectors';
import * as TimeMapActions from '../../../core/state/time-map.actions';

@Component({
  selector: 'app-novel-filter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="novel-filter">
      <select
        [value]="selectedNovel || ''"
        (change)="onNovelChange($event)"
        class="novel-select"
        aria-label="選擇小說篩選"
      >
        <option value="">所有小說（顯示全部）</option>
        <option *ngFor="let novel of novels$ | async" [value]="novel">
          {{ novel }}
        </option>
      </select>
    </div>
  `,
  styles: [`
    .novel-filter {
      margin-left: 12px;
    }
    .novel-select {
      padding: 8px 32px 8px 12px;
      font-size: 14px;
      font-family: 'Noto Sans TC', sans-serif;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      background: rgba(20, 20, 20, 0.85);
      color: #e0d5c0;
      backdrop-filter: blur(8px);
      cursor: pointer;
      min-width: 160px;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23e0d5c0' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
    }
    .novel-select:hover {
      border-color: rgba(196, 30, 58, 0.5);
    }
    .novel-select:focus {
      outline: none;
      border-color: #C41E3A;
      box-shadow: 0 0 0 2px rgba(196, 30, 58, 0.2);
    }
    .novel-select option {
      background: #1a1a1a;
      color: #e0d5c0;
    }
  `]
})
export class NovelFilterComponent implements OnInit, OnDestroy {
  novels$: Observable<string[]>;
  selectedNovel: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private store: Store<AppState>) {
    this.novels$ = this.store.select(TimeMapSelectors.selectAllNovels);
  }

  ngOnInit(): void {
    this.store.select(TimeMapSelectors.selectSelectedNovel)
      .pipe(takeUntil(this.destroy$))
      .subscribe(novel => this.selectedNovel = novel);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onNovelChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.store.dispatch(TimeMapActions.setNovelFilter({
      novel: value || null
    }));
  }
}
