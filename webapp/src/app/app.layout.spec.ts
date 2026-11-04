import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Store, provideStore } from '@ngrx/store';
import * as L from 'leaflet';
import { AppComponent } from './app.component';
import { AppState } from './core/state/app.state';
import { timeMapReducer } from './core/state/time-map.reducer';
import * as Actions from './core/state/time-map.actions';
import { ValidatedEvent } from './core/utils/data-validator';

declare const __karma__: { config: { args?: string[] } };

const event: ValidatedEvent = {
  id: 'e1', title: '襄陽守城', dynasty: '南宋', year: 1250,
  lat: 32, lng: 112, novel: '射鵰英雄傳', characters: ['郭靖'],
  sources: [], tags: [], validationStatus: 'valid', validationErrors: []
};

// 2026-10-29：在桌面與手機 ChromeHeadless 視窗各執行一次，檢查真實 CSS 與 Leaflet。
describe('App layout', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideStore({ timeMap: timeMapReducer }), provideNoopAnimations()]
    });
    spyOn(L.TileLayer.prototype, 'addTo').and.callFake(function(this: L.TileLayer) { return this; });
  });

  it('詳情面板依視窗寬度保留地圖空間，且人物探索可操作', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const store = TestBed.inject(Store<AppState>);
    fixture.detectChanges();
    store.dispatch(Actions.loadEventsSuccess({ result: { data: [event] } }));
    store.dispatch(Actions.loadTimelineSuccess({ result: { data: [] } }));
    const initialZoom = fixture.componentInstance.mapComponent.getMap()!.getZoom();
    fixture.componentInstance.onCharacterClick('郭靖');
    expect(fixture.componentInstance.history[0].state.mapView.zoom).toBe(initialZoom);
    fixture.detectChanges();
    tick(1200);
    fixture.detectChanges();
    const panel: HTMLElement = fixture.nativeElement.querySelector('mat-sidenav');
    const style = getComputedStyle(panel);
    if (__karma__.config.args?.includes('desktop')) expect(window.innerWidth).toBeGreaterThan(768);
    if (__karma__.config.args?.includes('mobile')) expect(window.innerWidth).toBeLessThanOrEqual(768);
    console.info('Layout viewport', window.innerWidth, window.innerHeight, 'panel', style.width, style.height);
    expect(panel.classList.contains('mat-drawer-opened')).toBeTrue();
    if (window.innerWidth <= 768) {
      expect(parseFloat(style.height)).toBeLessThan(window.innerHeight * 0.7);
      expect(parseFloat(style.width)).toBeCloseTo(window.innerWidth, -1);
      expect(style.top).not.toBe('0px');
      const handle: HTMLElement = fixture.nativeElement.querySelector('.sheet-handle');
      expect(getComputedStyle(handle).display).toBe('flex');
      expect(getComputedStyle(fixture.nativeElement.querySelector('.filter-summary')).display).toBe('none');
      fixture.componentInstance.setSheetState('peek');
      expect(panel.classList.contains('sheet-peek')).toBeTrue();
      fixture.componentInstance.setSheetState('half');
    } else {
      expect(parseFloat(style.width)).toBe(420);
    }
    expect(fixture.nativeElement.querySelector('.character-step').textContent).toContain(event.title);
    expect(fixture.nativeElement.querySelector('.panel-body').clientHeight).toBeGreaterThan(0);
    expect(fixture.componentInstance.mapComponent.getMap()).not.toBeNull();
    fixture.destroy();
    tick(400);
  }));
  it('年表接在條件列下方、不橫向捲動，切回地圖時地圖尺寸與視角不變', fakeAsync(() => {
    const originalUrl = window.location.href;
    const fixture = TestBed.createComponent(AppComponent);
    const store = TestBed.inject(Store<AppState>);
    fixture.detectChanges();
    const other: ValidatedEvent = { ...event, id: 'e2', title: '絕情谷', year: 1260, novel: '神鵰俠侶',
      sources: ['https://zh.wikipedia.org/wiki/%E7%B5%95%E6%83%85%E8%B0%B7'] };
    store.dispatch(Actions.loadEventsSuccess({ result: { data: [event, other] } }));
    store.dispatch(Actions.loadTimelineSuccess({ result: { data: [] } }));
    fixture.detectChanges();
    tick(400);
    const map = fixture.componentInstance.mapComponent.getMap()!;
    const before = { size: map.getSize(), center: map.getCenter(), zoom: map.getZoom() };

    fixture.componentInstance.setViewMode('chronicle');
    fixture.detectChanges();
    tick(100);
    const host: HTMLElement = fixture.nativeElement.querySelector('app-chronicle-list');
    const nav: HTMLElement = host.querySelector('.dynasty-nav')!;
    const filter: HTMLElement = fixture.nativeElement.querySelector('.filter-summary');
    const topBar: HTMLElement = fixture.nativeElement.querySelector('.top-bar');
    const landscape = window.innerHeight <= 500;
    console.info('Chronicle viewport', window.innerWidth, window.innerHeight, 'list top', host.getBoundingClientRect().top);
    if (landscape) {
      expect(host.getBoundingClientRect().left).toBeGreaterThanOrEqual(topBar.getBoundingClientRect().right);
    } else {
      expect(nav.getBoundingClientRect().top).toBeGreaterThanOrEqual(filter.getBoundingClientRect().bottom);
    }
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth);
    const touch = window.innerWidth <= 768 || window.innerHeight <= 500 ? ', .character, .novel-chip, .text-button' : '';
    const targets = host.querySelectorAll<HTMLElement>('.dynasty-nav button, .card-title, .wiki-link, .map-button' + touch);
    expect(targets.length).toBeGreaterThan(0);
    targets.forEach(target => expect(target.getBoundingClientRect().height).toBeGreaterThanOrEqual(44));
    fixture.nativeElement.querySelectorAll('app-view-mode-toggle button').forEach((button: HTMLElement) =>
      expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(44));

    fixture.componentInstance.setViewMode('map');
    fixture.detectChanges();
    tick(100);
    expect(map.getSize()).toEqual(before.size);
    expect(map.getZoom()).toBe(before.zoom);
    expect(map.getCenter().distanceTo(before.center)).toBeLessThan(1);
    window.history.replaceState(null, '', originalUrl);
    fixture.destroy();
    tick(400);
  }));
});
