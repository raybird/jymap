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
    } else {
      expect(parseFloat(style.width)).toBe(420);
    }
    expect(fixture.nativeElement.querySelector('.character-step').textContent).toContain(event.title);
    expect(fixture.nativeElement.querySelector('.panel-body').clientHeight).toBeGreaterThan(0);
    expect(fixture.componentInstance.mapComponent.getMap()).not.toBeNull();
    fixture.destroy();
    tick(400);
  }));
});
