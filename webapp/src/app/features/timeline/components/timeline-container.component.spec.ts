import { NgZone, ChangeDetectorRef } from '@angular/core';
import { TimelineContainerComponent } from './timeline-container.component';

describe('TimelineContainerComponent', () => {
  let component: TimelineContainerComponent;

  beforeEach(() => {
    const ngZoneMock = { runOutsideAngular: (fn: () => void) => fn(), run: (fn: () => void) => fn() } as unknown as NgZone;
    const cdrMock = { detectChanges: () => {} } as unknown as ChangeDetectorRef;
    component = new TimelineContainerComponent(ngZoneMock, cdrMock);
  });

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
