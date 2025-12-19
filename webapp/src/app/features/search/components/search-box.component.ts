import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { SearchService, SearchResult } from '../../../core/services/search.service';
import { Logger } from '../../../core/utils/logger';

/**
 * 搜尋框組件
 * 提供搜尋輸入框和搜尋結果觸發功能
 */
@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-box.component.html',
  styleUrl: './search-box.component.scss'
})
export class SearchBoxComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef<HTMLInputElement>;
  
  @Output() searchResultsChange = new EventEmitter<SearchResult[]>();
  @Output() searchKeywordChange = new EventEmitter<string>();

  searchKeyword = '';
  isSearching = false;
  hasResults = false;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private searchService: SearchService) {
    // 訂閱搜尋結果
    this.searchService.searchResults$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.hasResults = results.length > 0;
      this.searchResultsChange.emit(results);
      this.isSearching = false;
    });
  }

  ngOnInit(): void {
    // 設定搜尋關鍵字 debounce（200ms，符合 NFR6: < 300ms）
    // Story 5.4: 搜尋效能優化
    // debounce 200ms + 搜尋執行 < 100ms = 總回應時間 < 300ms
    this.searchSubject.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(keyword => {
      this.performSearch(keyword);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  /**
   * 處理搜尋輸入變化
   */
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const keyword = input.value;
    this.searchKeyword = keyword;
    this.searchKeywordChange.emit(keyword);

    if (keyword.trim().length === 0) {
      this.searchService.clearResults();
      this.hasResults = false;
      this.isSearching = false;
      return;
    }

    this.isSearching = true;
    // 透過 Subject 觸發 debounced 搜尋
    this.searchSubject.next(keyword);
  }

  /**
   * 執行搜尋
   */
  private performSearch(keyword: string): void {
    if (!keyword || keyword.trim().length === 0) {
      return;
    }

    Logger.debug('執行搜尋:', keyword);
    const results = this.searchService.search(keyword);
    Logger.debug('搜尋結果數量:', results.length);
  }

  /**
   * 清除搜尋
   */
  clearSearch(): void {
    this.searchKeyword = '';
    this.searchService.clearResults();
    this.hasResults = false;
    this.isSearching = false;
    this.searchKeywordChange.emit('');
    
    // 聚焦到搜尋框
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  /**
   * 處理鍵盤事件（Enter 鍵提交搜尋）
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      // Enter 鍵時立即執行搜尋（不等待 debounce）
      if (this.searchKeyword.trim().length > 0) {
        this.performSearch(this.searchKeyword);
      }
    } else if (event.key === 'Escape') {
      this.clearSearch();
    }
  }
}

