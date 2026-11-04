/** 每部小說的代表色；地圖標記、人物軌跡與年表色標共用 */
export const NOVEL_COLORS: Readonly<Record<string, string>> = {
  '越女劍': '#2E7D32', '天龍八部': '#B8860B', '射鵰英雄傳': '#C62828',
  '神鵰俠侶': '#6A1B9A', '倚天屠龍記': '#1565C0', '笑傲江湖': '#00695C',
  '碧血劍': '#D84315', '鹿鼎記': '#F57F17', '書劍恩仇錄': '#33691E',
  '飛狐外傳': '#E65100', '雪山飛狐': '#455A64', '連城訣': '#4E342E',
  '俠客行': '#283593', '白馬嘯西風': '#827717', '鴛鴦刀': '#AD1457',
};

export const DEFAULT_NOVEL_COLOR = '#666666';

export function getNovelColor(novel: string): string {
  return NOVEL_COLORS[novel] ?? DEFAULT_NOVEL_COLOR;
}
