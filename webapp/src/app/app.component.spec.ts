import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Store, provideStore } from '@ngrx/store';
import { AppComponent } from './app.component';
import { AppState } from './core/state/app.state';
import { timeMapReducer } from './core/state/time-map.reducer';
import * as Actions from './core/state/time-map.actions';
import * as Selectors from './core/state/time-map.selectors';
import { ValidatedEvent } from './core/utils/data-validator';
import { MapContainerComponent } from './features/map/components/map-container.component';

@Component({
  selector: 'app-map-container',
  template: '',
  providers: [{ provide: MapContainerComponent, useExisting: forwardRef(() => MapStubComponent) }]
})
class MapStubComponent {
  @Input() detailPanel: HTMLElement | null = null;
  @Input() center!: [number, number];
  @Input() zoom!: number;
  @Input() selectedNovel: string | null = null;
  @Output() eventClick = new EventEmitter<ValidatedEvent>();
  @Output() characterClick = new EventEmitter<string>();
  restoreView = jasmine.createSpy('restoreView');
  flyTo = jasmine.createSpy('flyTo');
  highlightMarker = jasmine.createSpy('highlightMarker');
  fitMapToEvents = jasmine.createSpy('fitMapToEvents');
}

const event: ValidatedEvent = {
  id: 'e1', title: '襄陽守城', dynasty: '南宋', year: 1250,
  lat: 32, lng: 112, novel: '射鵰英雄傳', characters: ['郭靖'],
  sources: [], tags: [], validationStatus: 'valid', validationErrors: []
};

// 2026-10-29：保留真實模板、Store、搜尋與側欄，只替換原生地圖邊界。
describe('AppComponent integration', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideStore({ timeMap: timeMapReducer }), provideNoopAnimations()]
    }).overrideComponent(AppComponent, {
      remove: { imports: [MapContainerComponent] },
      add: { imports: [MapStubComponent] }
    });
  });

  function setup() {
    const fixture = TestBed.createComponent(AppComponent);
    const store = TestBed.inject(Store<AppState>);
    fixture.detectChanges();
    store.dispatch(Actions.loadEventsSuccess({ result: { data: [event] } }));
    store.dispatch(Actions.loadTimelineSuccess({ result: { data: [] } }));
    fixture.detectChanges();
    tick(400);
    return { fixture, store, app: fixture.componentInstance };
  }

  it('輸入搜尋並點擊結果後同步選取事件、範圍、側欄與地圖', fakeAsync(() => {
    const { fixture, store } = setup();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.dispatchEvent(new Event('focus'));
    input.value = '襄陽';
    input.dispatchEvent(new Event('input'));
    tick(200);
    fixture.detectChanges();
    const result: HTMLButtonElement = fixture.nativeElement.querySelector('.result-button');
    expect(result).not.toBeNull();
    result.click();
    tick(900);
    fixture.detectChanges();
    let selected: ValidatedEvent | null = null;
    store.select(Selectors.selectSelectedEvent).subscribe(value => selected = value).unsubscribe();
    expect<ValidatedEvent | null>(selected).toEqual(event);
    let range: unknown;
    store.select(Selectors.selectTimeRange).subscribe(value => range = value).unsubscribe();
    expect(range).toEqual({ startYear: 1240, endYear: 1260 });
    expect(fixture.nativeElement.querySelector('app-event-card').textContent).toContain(event.title);
    const map = fixture.debugElement.query(By.directive(MapStubComponent)).componentInstance as MapStubComponent;
    expect(map.flyTo).toHaveBeenCalledWith(event.lat, event.lng, 8, event.id);
    fixture.destroy();
    tick(400);
  }));

  it('銷毀時取消尚未送出的時間範圍更新', fakeAsync(() => {
    const { fixture, store, app } = setup();
    app.onTimeRangeChange({ startYear: 1000, endYear: 1100 });
    fixture.destroy();
    tick(400);
    let range: unknown;
    store.select(Selectors.selectTimeRange).subscribe(value => range = value).unsubscribe();
    expect(range).toBeNull();
  }));

  it('搜尋其他小說事件時解除衝突篩選並說明變更', fakeAsync(() => {
    const { fixture, store, app } = setup();
    const other = { ...event, id: 'e2', novel: '神鵰俠侶', title: '絕情谷', year: 1260 };
    store.dispatch(Actions.loadEventsSuccess({ result: { data: [event, other] } }));
    app.onNovelSelect(event.novel);
    app.onTimeRangeChange({ startYear: 1000, endYear: 1100 });
    app.onSearchResultClick(other);
    tick(200);
    fixture.detectChanges();
    let visible: ValidatedEvent[] = [];
    store.select(Selectors.selectVisibleEvents).subscribe(value => visible = value).unsubscribe();
    expect(visible).toContain(other);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('已解除');
    fixture.destroy();
    tick(400);
  }));

  it('人物搜尋有獨立入口，不必從事件結果找人物', fakeAsync(() => {
    const { fixture } = setup();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.dispatchEvent(new Event('focus'));
    input.value = '郭靖';
    input.dispatchEvent(new Event('input'));
    tick(200);
    fixture.detectChanges();
    const person: HTMLButtonElement = fixture.nativeElement.querySelector('[data-kind="characters"] button');
    expect(person).not.toBeNull();
    if (person) {
      person.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-character-panel').textContent).toContain('郭靖');
    }
    fixture.destroy();
    tick(400);
  }));

  it('移除小說條件保留時間範圍，顯示全部則重設兩者', fakeAsync(() => {
    const { fixture, store, app } = setup();
    app.onNovelSelect(event.novel);
    store.dispatch(Actions.setTimeRange({ startYear: 1245, endYear: 1255 }));
    fixture.detectChanges();
    const clear: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="移除小說條件"]');
    expect(clear).not.toBeNull();
    if (clear) clear.click();
    let range: unknown;
    store.select(Selectors.selectTimeRange).subscribe(value => range = value).unsubscribe();
    expect(range).toEqual({ startYear: 1245, endYear: 1255 });
    fixture.detectChanges();
    const reset: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="顯示全部事件"]');
    expect(reset).not.toBeNull();
    if (reset) reset.click();
    store.select(Selectors.selectTimeRange).subscribe(value => range = value).unsubscribe();
    expect(range).toBeNull();
    fixture.destroy();
    tick(400);
  }));

  it('返回搜尋時恢復查詢、範圍、地圖與時間軸位置', fakeAsync(() => {
    const { fixture, store, app } = setup();
    store.dispatch(Actions.setTimeRange({ startYear: 1200, endYear: 1300 }));
    store.dispatch(Actions.setMapView({ center: [25, 115], zoom: 6 }));
    app.timelineComponent.timelineContainer.nativeElement.scrollTo({ left: 300, behavior: 'instant' });
    expect(app.timelineComponent.getScrollPosition()).toBe(300);
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.dispatchEvent(new Event('focus'));
    input.value = '襄陽';
    input.dispatchEvent(new Event('input'));
    tick(200);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.result-button').click();
    fixture.detectChanges();
    app.goBack();
    tick(400);
    fixture.detectChanges();
    expect(input.value).toBe('襄陽');
    expect(fixture.nativeElement.querySelector('.result-button').textContent).toContain(event.title);
    let range: unknown;
    store.select(Selectors.selectTimeRange).subscribe(value => range = value).unsubscribe();
    expect(range).toEqual({ startYear: 1200, endYear: 1300 });
    expect(app.timelineComponent.getScrollPosition()).toBe(300);
    const map = fixture.debugElement.query(By.directive(MapStubComponent)).componentInstance as MapStubComponent;
    expect(map.restoreView).toHaveBeenCalledWith([25, 115], 6);
    fixture.destroy();
    tick(400);
  }));

  it('人物逐步探索保持人物模式，查看詳情後可返回原本進度', fakeAsync(() => {
    const { fixture, store, app } = setup();
    const later = { ...event, id: 'e2', title: '重返襄陽', year: 1260 };
    store.dispatch(Actions.loadEventsSuccess({ result: { data: [later, event] } }));
    app.onCharacterClick('郭靖');
    fixture.detectChanges();
    const panel: HTMLElement = fixture.nativeElement.querySelector('app-character-panel');
    let controls = panel.querySelectorAll<HTMLButtonElement>('.step-controls button');
    expect(controls[0].disabled).toBeTrue();
    controls[1].click();
    fixture.detectChanges();
    expect(panel.querySelector('.character-step')!.textContent).toContain(later.title);
    controls = panel.querySelectorAll<HTMLButtonElement>('.step-controls button');
    expect(controls[1].disabled).toBeTrue();
    let character: unknown;
    store.select(Selectors.selectSelectedCharacter).subscribe(value => character = value).unsubscribe();
    expect(character).toBe('郭靖');
    const map = fixture.debugElement.query(By.directive(MapStubComponent)).componentInstance as MapStubComponent;
    expect(map.flyTo).toHaveBeenCalledWith(later.lat, later.lng, 8, later.id);
    panel.querySelector<HTMLButtonElement>('.open-event')!.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-event-card').textContent).toContain(later.title);
    app.goBack();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.character-step').textContent).toContain('第 2 / 2 件');
    fixture.destroy();
    tick(400);
  }));

  it('相關事件提供可閱讀的推薦原因與鍵盤可操作的入口', fakeAsync(() => {
    const { fixture, store, app } = setup();
    const related = { ...event, id: 'e2', title: '重返襄陽', year: 1260 };
    store.dispatch(Actions.loadEventsSuccess({ result: { data: [event, related] } }));
    app.onNavigateToEvent(event);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.rel-reason').textContent).toContain('共同人物：郭靖');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button.related-item');
    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-event-card h3').textContent).toContain(related.title);
    fixture.destroy();
    tick(400);
  }));

  it('人物模式進出後保留原本小說與自訂時間範圍', fakeAsync(() => {
    const { fixture, store, app } = setup();
    app.onNovelSelect(event.novel);
    store.dispatch(Actions.setTimeRange({ startYear: 1245, endYear: 1255 }));
    app.onCharacterClick('郭靖');
    tick(100);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-character-panel').textContent).toContain('郭靖');
    const close: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="關閉人物面板"]');
    close.click();
    tick(400);
    fixture.detectChanges();
    let range: unknown;
    let novel: unknown;
    store.select(Selectors.selectTimeRange).subscribe(value => range = value).unsubscribe();
    store.select(Selectors.selectSelectedNovel).subscribe(value => novel = value).unsubscribe();
    expect(range).toEqual({ startYear: 1245, endYear: 1255 });
    expect(novel).toBe(event.novel);
    fixture.destroy();
    tick(400);
  }));
  describe('年表模式', () => {
    const originalUrl = window.location.href;
    const other: ValidatedEvent = { ...event, id: 'e2', novel: '神鵰俠侶', title: '絕情谷', year: 1260, characters: ['楊過'],
      sources: ['https://zh.wikipedia.org/wiki/%E7%B5%95%E6%83%85%E8%B0%B7'] };
    afterEach(() => window.history.replaceState(null, '', originalUrl));

    function select<T>(store: Store<AppState>, selector: (state: AppState) => T): T {
      let value!: T;
      store.select(selector).subscribe(v => value = v).unsubscribe();
      return value;
    }

    function toggle(fixture: { nativeElement: HTMLElement; detectChanges(): void }, label: string): void {
      const button = Array.from(fixture.nativeElement.querySelectorAll<HTMLButtonElement>('app-view-mode-toggle button'))
        .find(b => b.textContent?.trim() === label)!;
      button.click();
      fixture.detectChanges();
    }

    it('切換時更新網址參數但不新增瀏覽紀錄，地圖只隱藏不銷毀', fakeAsync(() => {
      const { fixture, store } = setup();
      const historyLength = window.history.length;
      const map = fixture.debugElement.query(By.directive(MapStubComponent)).componentInstance;
      toggle(fixture, '年表');
      expect(new URLSearchParams(window.location.search).get('view')).toBe('chronicle');
      expect(window.history.length).toBe(historyLength);
      expect(select(store, Selectors.selectViewMode)).toBe('chronicle');
      const layer: HTMLElement = fixture.nativeElement.querySelector('.map-layer');
      expect(layer.style.visibility).toBe('hidden');
      expect(fixture.nativeElement.querySelector('app-chronicle-list').textContent).toContain(event.title);
      expect(fixture.nativeElement.querySelector('app-view-mode-toggle [aria-pressed="true"]').textContent).toContain('年表');

      toggle(fixture, '地圖');
      expect(window.location.search).not.toContain('view=');
      expect(layer.style.visibility).toBe('');
      expect(fixture.nativeElement.querySelector('app-chronicle-list')).toBeNull();
      expect(fixture.debugElement.query(By.directive(MapStubComponent)).componentInstance).toBe(map);
      fixture.destroy();
      tick(400);
    }));

    it('網址帶 view=chronicle 時直接進入年表', fakeAsync(() => {
      window.history.replaceState(null, '', '?view=chronicle');
      const { fixture, store } = setup();
      expect(select(store, Selectors.selectViewMode)).toBe('chronicle');
      expect(fixture.nativeElement.querySelector('app-chronicle-list')).not.toBeNull();
      fixture.destroy();
      tick(400);
    }));

    it('點搜尋結果不縮時間範圍，只解除擋住的條件並捲到卡片', fakeAsync(() => {
      const { fixture, store, app } = setup();
      store.dispatch(Actions.loadEventsSuccess({ result: { data: [event, other] } }));
      app.onNovelSelect(event.novel);
      store.dispatch(Actions.setTimeRange({ startYear: 1240, endYear: 1255 }));
      toggle(fixture, '年表');
      const scroll = spyOn(Element.prototype, 'scrollIntoView');
      app.onSearchResultClick(other);
      fixture.detectChanges();
      expect(select(store, Selectors.selectTimeRange)).toBeNull();
      expect(select(store, Selectors.selectSelectedNovel)).toBeNull();
      expect(select(store, Selectors.selectVisibleEvents).length).toBe(2);
      expect(scroll).toHaveBeenCalled();
      expect((scroll.calls.mostRecent().object as HTMLElement).dataset['eventId']).toBe(other.id);
      expect(fixture.nativeElement.querySelector('.card.selected').dataset.eventId).toBe(other.id);
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('已解除');
      const map = fixture.debugElement.query(By.directive(MapStubComponent)).componentInstance as MapStubComponent;
      expect(map.flyTo).not.toHaveBeenCalled();
      fixture.destroy();
      tick(400);
    }));

    it('事件在目前範圍內時保留範圍', fakeAsync(() => {
      const { fixture, store, app } = setup();
      store.dispatch(Actions.setTimeRange({ startYear: 1200, endYear: 1300 }));
      toggle(fixture, '年表');
      app.onSearchResultClick(event);
      expect(select(store, Selectors.selectTimeRange)).toEqual({ startYear: 1200, endYear: 1300 });
      fixture.destroy();
      tick(400);
    }));

    it('卡片顯示維基外連，點卡片開詳情，在地圖上看會切回地圖並飛到事件', fakeAsync(() => {
      const { fixture, store } = setup();
      store.dispatch(Actions.loadEventsSuccess({ result: { data: [event, other] } }));
      toggle(fixture, '年表');
      const card: HTMLElement = fixture.nativeElement.querySelector(`[data-event-id="${other.id}"]`);
      const link: HTMLAnchorElement = card.querySelector('.wiki-link')!;
      expect(link.textContent).toContain('絕情谷');
      expect(link.target).toBe('_blank');
      expect(link.rel).toBe('noopener');
      card.querySelector<HTMLElement>('.card-meta')!.click();
      fixture.detectChanges();
      expect(select(store, Selectors.selectSelectedEventId)).toBe(other.id);

      card.querySelector<HTMLButtonElement>('.map-button')!.click();
      fixture.detectChanges();
      expect(select(store, Selectors.selectViewMode)).toBe('map');
      const map = fixture.debugElement.query(By.directive(MapStubComponent)).componentInstance as MapStubComponent;
      expect(map.flyTo).toHaveBeenCalledWith(other.lat, other.lng, 8, other.id);
      fixture.destroy();
      tick(400);
    }));

    it('返回上一步還原切換前的地圖模式', fakeAsync(() => {
      const { fixture, store, app } = setup();
      toggle(fixture, '年表');
      expect(app.history.length).toBe(1);
      app.goBack();
      fixture.detectChanges();
      expect(select(store, Selectors.selectViewMode)).toBe('map');
      expect(window.location.search).not.toContain('view=');
      fixture.destroy();
      tick(400);
    }));

    it('追蹤人物時保留全部事件，只標示該人物並捲到第一筆', fakeAsync(() => {
      const { fixture, store, app } = setup();
      store.dispatch(Actions.loadEventsSuccess({ result: { data: [event, other] } }));
      toggle(fixture, '年表');
      const scroll = spyOn(Element.prototype, 'scrollIntoView');
      app.onCharacterClick('郭靖');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.card').length).toBe(2);
      expect(fixture.nativeElement.querySelector('.card.tracked').dataset.eventId).toBe(event.id);
      expect(fixture.nativeElement.querySelector('.card.dimmed').dataset.eventId).toBe(other.id);
      expect((scroll.calls.mostRecent().object as HTMLElement).dataset['eventId']).toBe(event.id);
      expect(select(store, Selectors.selectViewMode)).toBe('chronicle');
      fixture.destroy();
      tick(400);
    }));
  });
});
