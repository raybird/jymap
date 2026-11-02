export type SheetState = 'peek' | 'half' | 'full';

export const SHEET_PEEK_HEIGHT = 150;
export const SHEET_TOP_GAP = 12;
const TAP_THRESHOLD = 8;

export function getInitialMapView(): { center: [number, number]; zoom: number } {
  // 事件集中在華中華東，手機寬度沿用桌面視角只看得到甘肅一帶
  if (window.matchMedia('(max-height: 500px)').matches) return { center: [33, 113], zoom: 4 };
  if (window.matchMedia('(max-width: 768px)').matches) return { center: [33, 113], zoom: 5 };
  return { center: [35, 105], zoom: 5.5 };
}

/** 依放開時的面板高度決定停靠點；幾乎沒移動時視為點擊，在一半與全高之間切換。 */
export function resolveSheetState(
  current: SheetState, startHeight: number, endHeight: number, viewportHeight: number
): SheetState {
  if (Math.abs(endHeight - startHeight) < TAP_THRESHOLD) return current === 'half' ? 'full' : 'half';
  const stops: [SheetState, number][] = [
    ['peek', SHEET_PEEK_HEIGHT],
    ['half', viewportHeight / 2],
    ['full', viewportHeight - SHEET_TOP_GAP]
  ];
  return stops.reduce((best, stop) =>
    Math.abs(stop[1] - endHeight) < Math.abs(best[1] - endHeight) ? stop : best)[0];
}
