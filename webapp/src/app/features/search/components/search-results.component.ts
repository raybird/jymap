import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchResult } from '../../../core/services/search.service';
import { ValidatedEvent } from '../../../core/utils/data-validator';

/**
 * 搜尋結果組件
 * 顯示搜尋結果列表，支援點擊跳轉
 */
@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss'
})
export class SearchResultsComponent implements OnInit, OnDestroy {
  @Input() results: SearchResult[] = [];
  @Input() maxResults: number = 20; // 最多顯示的結果數量
  @Input() showTopResults: boolean = true; // 是否高亮顯示 Top-3 結果

  @Output() resultClick = new EventEmitter<ValidatedEvent>();

  displayedResults: SearchResult[] = [];
  topResults: SearchResult[] = [];

  ngOnInit(): void {
    this.updateDisplayedResults();
  }

  ngOnDestroy(): void {
    // 清理邏輯（目前無需清理）
  }

  /**
   * 更新顯示的結果列表
   */
  private updateDisplayedResults(): void {
    // 限制顯示數量，提升效能
    this.displayedResults = this.results.slice(0, this.maxResults);
    
    // 提取 Top-3 結果（用於高亮顯示）
    this.topResults = this.results.slice(0, 3);
  }

  /**
   * 當輸入結果變化時更新顯示
   */
  ngOnChanges(): void {
    this.updateDisplayedResults();
  }

  /**
   * 處理結果點擊事件
   */
  onResultClick(result: SearchResult): void {
    this.resultClick.emit(result.event);
  }

  /**
   * 判斷是否為 Top-3 結果
   */
  isTopResult(result: SearchResult): boolean {
    return this.showTopResults && this.topResults.includes(result);
  }

  /**
   * 獲取相關性分數顯示文字
   */
  getRelevanceText(score: number): string {
    if (score >= 0.8) return '高度相關';
    if (score >= 0.6) return '相關';
    if (score >= 0.4) return '部分相關';
    return '低相關';
  }

  /**
   * 獲取匹配欄位顯示文字
   */
  getMatchedFieldsText(matchedFields: string[]): string {
    if (matchedFields.length === 0) return '';
    
    const fieldMap: { [key: string]: string } = {
      'title': '標題',
      'novel': '小說',
      'dynasty': '朝代',
      'characters': '人物',
      'tags': '標籤'
    };

    return matchedFields
      .map(field => fieldMap[field] || field)
      .join('、');
  }
}

