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
});
