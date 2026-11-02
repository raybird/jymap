import { resolveSheetState } from './viewport';

describe('resolveSheetState', () => {
  it('幾乎沒移動時視為點擊，在一半與全高之間切換', () => {
    expect(resolveSheetState('half', 400, 403, 800)).toBe('full');
    expect(resolveSheetState('full', 788, 788, 800)).toBe('half');
    expect(resolveSheetState('peek', 150, 150, 800)).toBe('half');
  });

  it('放開時停在最接近的高度', () => {
    expect(resolveSheetState('half', 400, 200, 800)).toBe('peek');
    expect(resolveSheetState('half', 400, 700, 800)).toBe('full');
    expect(resolveSheetState('full', 788, 450, 800)).toBe('half');
  });
});
