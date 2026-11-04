import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../../../core/state/app.state';
import * as TimeMapSelectors from '../../../core/state/time-map.selectors';
import { ValidatedEvent } from '../../../core/utils/data-validator';
import { getEventDynastyText, getEventTimeText } from '../../../core/utils/event-time';
import { getNovelColor } from '../../../core/utils/novel-colors';
import { getCardWikiLinks, WikiLink } from '../../../core/utils/wiki-links';
import { buildChronicle, ChronicleSection } from '../chronicle';

/** 卡片最多直接列出的人物數，其餘以「等 N 人」帶過 */
const MAX_CHARACTERS = 6;
/** 摘要超過這個字數才提供展開鈕 */
const LONG_SUMMARY = 60;

@Component({
  selector: 'app-chronicle-list',
  templateUrl: './chronicle-list.component.html',
  styleUrl: './chronicle-list.component.scss'
})
export class ChronicleListComponent implements AfterViewInit, OnDestroy {
  @Output() openEvent = new EventEmitter<ValidatedEvent>();
  @Output() showOnMap = new EventEmitter<ValidatedEvent>();
  @Output() novelClick = new EventEmitter<string>();
  @Output() characterClick = new EventEmitter<string>();

  @ViewChild('scroller', { static: true }) scroller!: ElementRef<HTMLElement>;

  sections: ChronicleSection[] = [];
  selectedEventId: string | null = null;
  character: string | null = null;
  readonly expanded = new Set<string>();
  private wikiLinks = new Map<string, WikiLink[]>();
  private destroy$ = new Subject<void>();

  readonly maxCharacters = MAX_CHARACTERS;
  readonly getTimeText = getEventTimeText;
  readonly getDynastyText = getEventDynastyText;
  readonly getNovelColor = getNovelColor;

  constructor(
    private store: Store<AppState>,
    private host: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef
  ) {
    combineLatest([
      this.store.select(TimeMapSelectors.selectVisibleEvents),
      this.store.select(TimeMapSelectors.selectAllNovels)
    ]).pipe(takeUntil(this.destroy$)).subscribe(([events, novels]) => {
      const novelSet = new Set(novels);
      this.sections = buildChronicle(events);
      this.wikiLinks = new Map(events.map(event => [event.id, getCardWikiLinks(event, novelSet)]));
      // 條件改變後從頭看；要定位某張卡的呼叫端會接著呼叫 scrollToEvent
      if (this.scroller) this.scroller.nativeElement.scrollTop = 0;
    });
    this.store.select(TimeMapSelectors.selectSelectedEventId).pipe(takeUntil(this.destroy$))
      .subscribe(id => this.selectedEventId = id);
    this.store.select(TimeMapSelectors.selectSelectedCharacter).pipe(takeUntil(this.destroy$))
      .subscribe(name => this.character = name);
  }

  ngAfterViewInit(): void {
    if (this.selectedEventId) this.scrollToEvent(this.selectedEventId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  linksOf(event: ValidatedEvent): WikiLink[] {
    return this.wikiLinks.get(event.id) ?? [];
  }

  isTracked(event: ValidatedEvent): boolean {
    return this.character !== null && event.characters.includes(this.character);
  }

  hasLongSummary(event: ValidatedEvent): boolean {
    return (event.summary || event.description || '').length > LONG_SUMMARY;
  }

  toggleSummary(id: string): void {
    if (!this.expanded.delete(id)) this.expanded.add(id);
  }

  /** 點卡片空白處開詳情；卡片內的按鈕與連結各自處理 */
  onCardClick(event: ValidatedEvent, click: MouseEvent): void {
    if ((click.target as HTMLElement).closest('a, button')) return;
    this.openEvent.emit(event);
  }

  scrollToSection(key: string): void {
    this.find(`[data-section-key="${CSS.escape(key)}"]`)?.scrollIntoView({ block: 'start', behavior: this.behavior() });
  }

  /**
   * 先同步重繪，條件剛改變時目標卡片才會在 DOM 裡。
   * 直接跳轉不用平滑捲動：時間軸同時在平滑捲動，Chrome 會讓後者取消前者
   */
  scrollToEvent(id: string): void {
    this.cdr.detectChanges();
    this.find(`[data-event-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'start' });
  }

  private find(selector: string): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>(selector);
  }

  private behavior(): ScrollBehavior {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }
}
