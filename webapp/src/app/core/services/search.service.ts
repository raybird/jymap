import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Fuse, { IFuseOptions } from 'fuse.js';
import { ValidatedEvent } from '../utils/data-validator';
import { Logger } from '../utils/logger';

/**
 * 搜尋結果介面
 */
export interface SearchResult {
  event: ValidatedEvent;
  score: number; // 相關性分數（0-1，1 為最相關）
  matchedFields: string[]; // 匹配的欄位名稱
}

/**
 * 搜尋服務
 * 使用 Fuse.js 進行模糊搜尋
 */
@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private fuseInstance: Fuse<ValidatedEvent> | null = null;
  private eventsSubject = new BehaviorSubject<ValidatedEvent[]>([]);
  private searchResultsSubject = new BehaviorSubject<SearchResult[]>([]);

  // 公開的 Observable
  public searchResults$ = this.searchResultsSubject.asObservable();

  constructor() {
    // 監聽事件資料變化，重新建立索引
    this.eventsSubject.pipe(
      distinctUntilChanged()
    ).subscribe(events => {
      this.buildIndex(events);
    });
  }

  /**
   * 設定搜尋資料來源
   * 當事件資料載入完成後調用此方法
   */
  setEvents(events: ValidatedEvent[]): void {
    this.eventsSubject.next(events);
  }

  /**
   * 建立 Fuse.js 索引
   * 在資料載入時預先建立索引，提升搜尋效能
   */
  private buildIndex(events: ValidatedEvent[]): void {
    if (events.length === 0) {
      this.fuseInstance = null;
      return;
    }

    // 配置 Fuse.js 搜尋選項
    // Story 5.4: 優化配置以確保 Top-3 命中率 ≥ 80%
    const options: IFuseOptions<ValidatedEvent> = {
      keys: [
        { name: 'title', weight: 0.5 }, // 標題權重最高（提升 Top-3 命中率）
        { name: 'novel', weight: 0.2 }, // 小說名稱
        { name: 'dynasty', weight: 0.15 }, // 朝代
        { name: 'characters', weight: 0.1 }, // 人物
        { name: 'tags', weight: 0.05 } // 標籤
      ],
      threshold: 0.4, // 模糊匹配閾值（調整為 0.4，平衡準確性和覆蓋率）
      includeScore: true, // 包含相關性分數
      includeMatches: true, // 包含匹配的欄位資訊
      minMatchCharLength: 1, // 最小匹配字元長度
      ignoreLocation: false, // 考慮字串位置
      findAllMatches: false, // 只找最佳匹配（提升效能）
      shouldSort: true, // 按相關性排序
      useExtendedSearch: false, // 不使用擴展搜尋（提升效能）
      getFn: (obj, path) => {
        // 自訂 getFn 處理陣列欄位（characters, tags）
        const pathStr = Array.isArray(path) ? path.join('.') : path;
        const keys = pathStr.split('.');
        let value: any = obj;
        for (const key of keys) {
          if (Array.isArray(value)) {
            // 如果是陣列，返回所有元素的字串連接
            return value.join(' ');
          }
          value = value?.[key];
        }
        return value;
      }
    };

    this.fuseInstance = new Fuse(events, options);
  }

  /**
   * 執行搜尋
   * Story 5.4: 搜尋效能優化（<300ms 回應時間）
   * @param keyword 搜尋關鍵字
   * @returns 搜尋結果陣列
   */
  search(keyword: string): SearchResult[] {
    const startTime = performance.now(); // 效能監控開始時間

    if (!keyword || keyword.trim().length === 0) {
      this.searchResultsSubject.next([]);
      return [];
    }

    if (!this.fuseInstance) {
      Logger.warn('Fuse.js 索引未建立，無法執行搜尋');
      return [];
    }

    const trimmedKeyword = keyword.trim();
    
    // 執行搜尋（限制結果數量，提升效能）
    const results = this.fuseInstance.search(trimmedKeyword, {
      limit: 30 // 限制結果數量，提升效能（符合 NFR10: 排序時間 < 300ms）
    });

    // 轉換為 SearchResult 格式
    const searchResults: SearchResult[] = results.map(result => ({
      event: result.item,
      score: result.score ? 1 - result.score : 0, // Fuse.js 分數是距離，轉換為相關性（0-1）
      matchedFields: result.matches?.map(m => {
        // 處理嵌套欄位（如 'characters' 陣列中的項目）
        const key = m.key || '';
        return key.split('.')[0]; // 只取頂層欄位名稱
      }) || []
    }));

    // 確保結果按相關性排序（Fuse.js 已經排序，但我們再次確認）
    searchResults.sort((a, b) => b.score - a.score);

    // 效能監控
    const endTime = performance.now();
    const searchTime = endTime - startTime;
    
    if (searchTime > 300) {
      Logger.warn(`搜尋時間 ${searchTime.toFixed(2)}ms 超過 300ms 限制`);
    } else {
      Logger.debug(`搜尋完成，耗時 ${searchTime.toFixed(2)}ms，結果數量: ${searchResults.length}`);
    }

    // 更新搜尋結果
    this.searchResultsSubject.next(searchResults);

    return searchResults;
  }

  /**
   * 獲取 Top-3 搜尋結果
   * 用於快速識別最相關的結果
   */
  getTopResults(keyword: string, limit: number = 3): SearchResult[] {
    const results = this.search(keyword);
    return results.slice(0, limit);
  }

  /**
   * 清除搜尋結果
   */
  clearResults(): void {
    this.searchResultsSubject.next([]);
  }
}

