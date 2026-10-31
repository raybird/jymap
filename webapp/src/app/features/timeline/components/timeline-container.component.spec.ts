import { fakeAsync, tick } from '@angular/core/testing';
import { NgZone, ChangeDetectorRef, ElementRef } from '@angular/core';
import { ValidatedEvent } from '../../../core/utils/data-validator';
import { TimelineContainerComponent } from './timeline-container.component';

describe('TimelineContainerComponent', () => {
  let component: TimelineContainerComponent;

  beforeEach(() => {
    const ngZoneMock = { runOutsideAngular: (fn: () => void) => fn(), run: (fn: () => void) => fn() } as unknown as NgZone;
    const cdrMock = { detectChanges: () => {} } as unknown as ChangeDetectorRef;
    component = new TimelineContainerComponent(ngZoneMock, cdrMock);
  });

  it('銷毀後不再回應 document 的框選結束事件', fakeAsync(() => {
    component.timelineContainer = new ElementRef(document.createElement('div'));
    component.timelineTrack = new ElementRef(document.createElement('div'));
    component.ngOnInit();
    component.ngAfterViewInit();
    tick(400);
    component.selectedStartYear = 1200;
    component.selectedEndYear = 1250;
    const emit = spyOn(component.timeRangeChange, 'emit');
    document.dispatchEvent(new MouseEvent('mouseup'));
    expect(emit).toHaveBeenCalled();
    component.ngOnDestroy();
    emit.calls.reset();
    document.dispatchEvent(new MouseEvent('mouseup'));
    expect(emit).not.toHaveBeenCalled();
  }));

  describe('getEventStaggerTop', () => {
    it('同 bucket 只有一個事件時回傳 50', () => {
      const dots = [{ year: 1200 }];
      expect(component.getEventStaggerTop(dots[0], dots)).toBe(50);
    });

    it('同 bucket 兩個事件回傳不同垂直位置', () => {
      const dots = [{ year: 1200 }, { year: 1203 }];
      expect(component.getEventStaggerTop(dots[0], dots)).toBe(30);
      expect(component.getEventStaggerTop(dots[1], dots)).toBe(70);
    });

    it('不同 bucket 的事件各自獨立，各回傳 50', () => {
      const dots = [{ year: 1200 }, { year: 1210 }];
      expect(component.getEventStaggerTop(dots[0], dots)).toBe(50);
      expect(component.getEventStaggerTop(dots[1], dots)).toBe(50);
    });

    it('同 bucket 五個事件使用完整 positions 陣列', () => {
      const dots = [
        { year: 1200 }, { year: 1201 }, { year: 1202 }, { year: 1203 }, { year: 1204 }
      ];
      expect(component.getEventStaggerTop(dots[0], dots)).toBe(30);
      expect(component.getEventStaggerTop(dots[1], dots)).toBe(70);
      expect(component.getEventStaggerTop(dots[2], dots)).toBe(15);
      expect(component.getEventStaggerTop(dots[3], dots)).toBe(85);
      expect(component.getEventStaggerTop(dots[4], dots)).toBe(50);
    });
  });

  describe('年代推估區間帶', () => {
    function makeEvent(id: string, novel: string, eraEstimate?: ValidatedEvent['eraEstimate']): ValidatedEvent {
      return {
        id, title: id, dynasty: '明', year: 1500, lat: 30, lng: 120, novel, characters: [], sources: [], tags: [],
        validationStatus: 'valid', validationErrors: [], eraEstimate
      };
    }
    const xiaoao = { startYear: 1398, endYear: 1661, label: '約 1398–1661 年間（確年未詳）', storyOrder: 1 };
    const xiake = { startYear: 1358, endYear: null, label: '元末明初以後（確年未詳）', storyOrder: 1 };
    const liancheng = { startYear: 1665, endYear: null, label: '約 1665 年後（確年未詳）', storyOrder: 1 };

    it('推估事件不畫成點，避免佔位年份看起來像確年', () => {
      component.events = [makeEvent('a', '笑傲江湖', xiaoao), makeEvent('b', '射鵰英雄傳')];
      expect(component.getEventDots().map(dot => dot.id)).toEqual(['b']);
    });

    it('同一作品合併成一條區間帶並顯示筆數', () => {
      component.events = [makeEvent('a', '笑傲江湖', xiaoao), makeEvent('b', '笑傲江湖', xiaoao)];
      const bands = component.getEraBands();
      expect(bands.length).toBe(1);
      expect(bands[0].label).toBe('《笑傲江湖》約 1398–1661 年間（確年未詳）・2 筆');
      expect(bands[0].openEnded).toBeFalse();
    });

    it('只有下限的區間延伸到時間軸終點並標記為開放', () => {
      component.events = [makeEvent('a', '俠客行', xiake)];
      const [band] = component.getEraBands();
      expect(band.openEnded).toBeTrue();
      expect(band.left + band.width).toBeCloseTo(100, 5);
    });

    it('區間重疊時分列，不重疊時可共用一列', () => {
      component.events = [
        makeEvent('a', '俠客行', xiake), makeEvent('b', '笑傲江湖', xiaoao), makeEvent('c', '連城訣', liancheng)
      ];
      const lanes = Object.fromEntries(component.getEraBands().map(band => [band.novel, band.lane]));
      expect(lanes).toEqual({ '俠客行': 0, '笑傲江湖': 1, '連城訣': 1 });
    });

    it('區間離開視窗後，其餘區間的列位不變', () => {
      const all = [makeEvent('a', '俠客行', xiake), makeEvent('b', '笑傲江湖', xiaoao)];
      component.events = all;
      component.getEraBands();
      component.events = [all[1]];
      expect(component.getEraBands()[0].lane).toBe(1);
    });

    function startDragAt(target: HTMLElement, clientX: number): void {
      const down = new MouseEvent('mousedown', { clientX });
      Object.defineProperty(down, 'target', { value: target });
      (component as any).onDragStart(down);
    }

    it('點擊區間帶時發送作品名稱', () => {
      const emit = spyOn(component.eraBandClick, 'emit');
      component.onEraBandClick('笑傲江湖', new MouseEvent('click', { detail: 1 }));
      expect(emit).toHaveBeenCalledOnceWith('笑傲江湖');
    });

    it('拖曳後放開不算點擊區間帶', () => {
      const container = document.createElement('div');
      component.timelineContainer = new ElementRef(container);
      const emit = spyOn(component.eraBandClick, 'emit');
      startDragAt(container, 100);
      (component as any).onDragMove(new MouseEvent('mousemove', { clientX: 160 }));
      component.onEraBandClick('笑傲江湖', new MouseEvent('click', { detail: 1 }));
      expect(emit).not.toHaveBeenCalled();
    });

    it('拖曳後仍可用鍵盤啟動區間帶', () => {
      const container = document.createElement('div');
      component.timelineContainer = new ElementRef(container);
      const emit = spyOn(component.eraBandClick, 'emit');
      startDragAt(container, 100);
      (component as any).onDragMove(new MouseEvent('mousemove', { clientX: 160 }));
      component.onEraBandClick('笑傲江湖', new MouseEvent('click', { detail: 0 }));
      expect(emit).toHaveBeenCalled();
    });

    it('拖曳距離未達門檻時仍算點擊', () => {
      const container = document.createElement('div');
      component.timelineContainer = new ElementRef(container);
      const emit = spyOn(component.eraBandClick, 'emit');
      startDragAt(container, 100);
      (component as any).onDragMove(new MouseEvent('mousemove', { clientX: 103 }));
      component.onEraBandClick('笑傲江湖', new MouseEvent('click', { detail: 1 }));
      expect(emit).toHaveBeenCalled();
    });
  });

  describe('updateCenterYear', () => {
    it('捲動到中間位置時計算正確的中心年份', () => {
      const el = { scrollLeft: 5750, clientWidth: 375, scrollWidth: 11875 } as HTMLElement;
      (component as any).updateCenterYear(el);
      expect(component.currentCenterYear).toBe(650);
    });

    it('捲動到最左邊時顯示最早的可見年份', () => {
      const el = { scrollLeft: 0, clientWidth: 375, scrollWidth: 11875 } as HTMLElement;
      (component as any).updateCenterYear(el);
      expect(component.currentCenterYear).toBe(-500);
    });

    it('年份相同時不更新 currentCenterYear（避免多餘 detectChanges）', () => {
      component.currentCenterYear = 650;
      const cdrMock = (component as any).cdr;
      spyOn(cdrMock, 'detectChanges');
      const el = { scrollLeft: 5750, clientWidth: 375, scrollWidth: 11875 } as HTMLElement;
      (component as any).updateCenterYear(el);
      expect(cdrMock.detectChanges).not.toHaveBeenCalled();
    });
  });
});
