import { ElementRef } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Store, provideStore } from '@ngrx/store';
import * as L from 'leaflet';
import { AppState } from '../../../core/state/app.state';
import * as Actions from '../../../core/state/time-map.actions';
import { timeMapReducer } from '../../../core/state/time-map.reducer';
import { ValidatedEvent } from '../../../core/utils/data-validator';
import { MapContainerComponent } from './map-container.component';

const event: ValidatedEvent = {
  id: 'e1', title: '襄陽守城', dynasty: '南宋', year: 1250,
  lat: 32, lng: 112, novel: '射鵰英雄傳', characters: ['郭靖'],
  sources: [], tags: [], validationStatus: 'valid', validationErrors: []
};

describe('MapContainerComponent', () => {
  let component: MapContainerComponent;
  let map: L.Map;
  let container: HTMLDivElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideStore({ timeMap: timeMapReducer })] });
    container = document.createElement('div');
    container.style.cssText = 'width:800px;height:600px';
    document.body.appendChild(container);
    map = L.map(container).setView([30, 110], 5);
    component = new MapContainerComponent(TestBed.inject(Store<AppState>));
    (component as any).map = map;
  });

  afterEach(() => {
    component.ngOnDestroy();
    container.remove();
  });

  it('容器可用時直接初始化並呈現已載入的事件', () => {
    map.remove();
    (component as any).map = null;
    component.mapContainer = new ElementRef(container);
    spyOn(L.TileLayer.prototype, 'addTo').and.callFake(function(this: L.TileLayer) { return this; });
    TestBed.inject(Store<AppState>).dispatch(Actions.loadEventsSuccess({ result: { data: [event] } }));
    component.ngAfterViewInit();
    expect(component.getMap()).not.toBeNull();
    expect(container.querySelectorAll('.leaflet-marker-icon').length).toBe(1);
    const observer = (component as any).resizeObserver as ResizeObserver;
    const disconnect = spyOn(observer, 'disconnect').and.callThrough();
    component.ngOnDestroy();
    expect(disconnect).toHaveBeenCalled();
  });

  it('已在目標位置時立即高亮，不等待不存在的移動事件', () => {
    const highlight = spyOn(component, 'highlightMarker');
    component.flyTo(30, 110, 5, event.id);
    expect(highlight).toHaveBeenCalledOnceWith(event.id);
  });

  it('元件銷毀後取消尚未完成的導覽高亮', () => {
    spyOn(map, 'flyTo').and.returnValue(map);
    const highlight = spyOn(component, 'highlightMarker');
    component.flyTo(32, 112, 8, event.id);
    component.ngOnDestroy();
    map.fire('moveend');
    expect(highlight).not.toHaveBeenCalled();
  });

  it('手機詳情面板開啟時將事件移到剩餘地圖區域中央', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    const panel = document.createElement('div');
    Object.defineProperty(panel, 'clientHeight', { value: 300 });
    component.detailPanel = panel;
    const fly = spyOn(map, 'flyTo').and.returnValue(map);
    component.flyTo(event.lat, event.lng, 8, event.id);
    const target = fly.calls.mostRecent().args[0] as L.LatLng;
    const targetPoint = map.project(target, 8);
    const eventPoint = map.project([event.lat, event.lng], 8);
    expect(targetPoint.x).toBeCloseTo(eventPoint.x, 4);
    expect(targetPoint.y - eventPoint.y).toBeCloseTo(150, 4);
  });

  it('連續切換篩選後只保留最後一組標記', fakeAsync(() => {
    component.updateMarkers([event]);
    component.updateMarkers([]);
    tick(1000);
    const markers: L.Marker[] = [];
    map.eachLayer(layer => { if (layer instanceof L.Marker) markers.push(layer); });
    expect(markers.length).toBe(0);
  }));

  it('慢速飛行完成前不高亮，完成時才開啟目標標記', fakeAsync(() => {
    component.updateMarkers([event]);
    tick(1000);
    spyOn(map, 'flyTo').and.returnValue(map);
    const highlight = spyOn(component, 'highlightMarker');
    component.flyTo(event.lat, event.lng, 8, event.id);
    tick(1500);
    expect(highlight).not.toHaveBeenCalled();
    map.fire('moveend');
    expect(highlight).toHaveBeenCalledOnceWith(event.id);
  }));

  it('連續導覽時只高亮最後一次目標', () => {
    spyOn(map, 'flyTo').and.returnValue(map);
    const highlight = spyOn(component, 'highlightMarker');
    component.flyTo(32, 112, 8, 'e1');
    component.flyTo(33, 113, 8, 'e2');
    map.fire('moveend');
    expect(highlight).toHaveBeenCalledOnceWith('e2');
  });
});
