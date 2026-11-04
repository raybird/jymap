import { getCardWikiLinks, getWikiLinks } from './wiki-links';

const novels = new Set(['射鵰英雄傳', '天龍八部', '書劍恩仇錄']);
const wiki = (title: string) => `https://zh.wikipedia.org/wiki/${encodeURIComponent(title)}`;

describe('wiki-links', () => {
  it('依作品、人物、歷史主題分類，並把歷史主題排在最前', () => {
    const links = getWikiLinks({
      characters: ['郭靖'],
      sources: [wiki('射雕英雄传'), wiki('郭靖'), 'https://read.99csw.com/book/1.html', wiki('靖康之變')]
    }, novels);
    expect(links.map(l => [l.title, l.kind])).toEqual([
      ['靖康之變', 'topic'], ['郭靖', 'character'], ['射雕英雄传', 'novel']
    ]);
  });

  it('作品名稱的消歧義括號與角色列表條目都算作品頁', () => {
    const links = getWikiLinks({
      characters: [],
      sources: [wiki('天龍八部_(小說)'), wiki('書劍恩仇錄角色列表')]
    }, novels);
    expect(links.map(l => [l.title, l.kind])).toEqual([['天龍八部', 'novel'], ['書劍恩仇錄角色列表', 'novel']]);
  });

  it('未編碼的中文網址也能辨識，重複連結只留一個', () => {
    const url = 'https://zh.wikipedia.org/wiki/靖康之變';
    expect(getWikiLinks({ characters: [], sources: [url, url] }, novels).length).toBe(1);
  });

  it('卡片沒有歷史主題與人物連結時才顯示一個作品頁', () => {
    expect(getCardWikiLinks({ characters: [], sources: [wiki('射雕英雄传'), wiki('射鵰英雄傳')] }, novels)
      .map(l => l.title)).toEqual(['射雕英雄传']);
    expect(getCardWikiLinks({ characters: ['郭靖'], sources: [wiki('射雕英雄传'), wiki('郭靖')] }, novels)
      .map(l => l.kind)).toEqual(['character']);
  });

  it('不由人物名稱自行組出連結', () => {
    expect(getWikiLinks({ characters: ['郭靖'], sources: ['https://www.jinyongbbs.com/a.html'] }, novels)).toEqual([]);
  });
});
