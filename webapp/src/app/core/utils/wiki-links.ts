import { Event } from '../models';

export type WikiLinkKind = 'topic' | 'character' | 'novel';

export interface WikiLink {
  url: string;
  /** 解碼後去掉消歧義括號的條目名稱 */
  title: string;
  kind: WikiLinkKind;
}

const WIKI_PATH = /^https?:\/\/zh\.wikipedia\.org\/wiki\/(.+)$/;
const KIND_ORDER: WikiLinkKind[] = ['topic', 'character', 'novel'];

function decodeTitle(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** 去掉「_(小說)」這類消歧義後綴，底線換回空白 */
function displayTitle(title: string): string {
  return title.replace(/_\([^)]*\)$/, '').replace(/_/g, ' ');
}

/** 條目與小說名稱比對前的正規化：簡繁字形與「角色列表」條目 */
function normalizeNovelTitle(title: string): string {
  return displayTitle(title).replace(/角色列表$/, '').replace(/雕/g, '鵰').replace(/传/g, '傳');
}

/**
 * 從事件既有來源挑出中文維基連結並分類，不另外由人物或標題組網址
 */
export function getWikiLinks(event: Pick<Event, 'sources' | 'characters'>, novels: ReadonlySet<string>): WikiLink[] {
  const seen = new Set<string>();
  const links: WikiLink[] = [];
  for (const url of event.sources) {
    const match = WIKI_PATH.exec(url);
    if (!match || seen.has(url)) continue;
    seen.add(url);
    const raw = decodeTitle(match[1]);
    const title = displayTitle(raw);
    const kind: WikiLinkKind = novels.has(normalizeNovelTitle(raw))
      ? 'novel'
      : event.characters.includes(title) ? 'character' : 'topic';
    links.push({ url, title, kind });
  }
  return links.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
}

/**
 * 卡片要顯示的連結：先給歷史主題與人物，兩者都沒有時才退回作品頁
 */
export function getCardWikiLinks(event: Pick<Event, 'sources' | 'characters'>, novels: ReadonlySet<string>): WikiLink[] {
  const links = getWikiLinks(event, novels);
  const specific = links.filter(link => link.kind !== 'novel');
  return specific.length ? specific : links.filter(link => link.kind === 'novel').slice(0, 1);
}
