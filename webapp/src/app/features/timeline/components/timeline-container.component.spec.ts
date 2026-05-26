import { TimelineContainerComponent } from './timeline-container.component';

describe('TimelineContainerComponent', () => {
  let component: TimelineContainerComponent;

  beforeEach(() => {
    component = new TimelineContainerComponent();
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
});
