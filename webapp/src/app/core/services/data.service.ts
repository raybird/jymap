import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Event, TimelineItem } from '../models';
import { DataValidator, ValidatedEvent, ValidatedTimelineItem } from '../utils/data-validator';
import { Logger } from '../utils/logger';

/**
 * 資料載入結果（包含驗證資訊）
 */
export interface DataLoadResult<T> {
  data: T;
  validationStats?: {
    total: number;
    valid: number;
    invalidCoordinates: number;
    incompleteData: number;
    invalidCoordinatesRate: number;
    requiredFieldsCoverage: number;
  };
}

/**
 * 資料載入服務
 * 負責從靜態 JSON 檔案載入金庸事件資料和時間軸資料，並進行驗證
 */
@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly eventsUrl = 'assets/data/events.json';
  private readonly timelineUrl = 'assets/data/timeline.json';

  constructor(private http: HttpClient) {}

  /**
   * 載入所有事件資料（含驗證）
   * @returns Observable<DataLoadResult<ValidatedEvent[]>> 驗證後的事件陣列與統計資訊
   */
  loadEvents(): Observable<DataLoadResult<ValidatedEvent[]>> {
    return this.http.get<Event[]>(this.eventsUrl).pipe(
      map((events) => {
               // 驗證資料
               const result = DataValidator.validateEvents(events);

               // 記錄驗證統計
               Logger.log('事件資料驗證統計:', result.stats);

               // 檢查是否符合 NFR 要求
               if (result.stats.invalidCoordinatesRate >= 5) {
                 Logger.warn(
                   `警告：無效座標率 ${result.stats.invalidCoordinatesRate.toFixed(2)}% 超過 5% 限制`
                 );
               }

               if (result.stats.requiredFieldsCoverage < 95) {
                 Logger.warn(
                   `警告：必填欄位覆蓋率 ${result.stats.requiredFieldsCoverage.toFixed(2)}% 低於 95% 要求`
                 );
               }

        // 轉換為 DataLoadResult 格式
        return {
          data: result.validated,
          validationStats: result.stats
        };
      }),
             catchError((error: HttpErrorResponse) => {
               Logger.error('載入事件資料失敗:', error);
               return this.handleError(error, '事件資料');
             })
    );
  }

  /**
   * 載入時間軸資料（含驗證）
   * @returns Observable<DataLoadResult<ValidatedTimelineItem[]>> 驗證後的時間軸項目陣列
   */
  loadTimeline(): Observable<DataLoadResult<ValidatedTimelineItem[]>> {
    return this.http.get<TimelineItem[]>(this.timelineUrl).pipe(
      map((items) => {
        // 驗證資料
        const validated = DataValidator.validateTimelineItems(items);

               // 記錄驗證結果
               const invalidCount = validated.filter(item => item.validationStatus === 'invalid').length;
               if (invalidCount > 0) {
                 Logger.warn(`警告：發現 ${invalidCount} 個無效的時間軸項目`);
               }

        return {
          data: validated
        };
      }),
             catchError((error: HttpErrorResponse) => {
               Logger.error('載入時間軸資料失敗:', error);
               return this.handleError(error, '時間軸資料');
             })
    );
  }

  /**
   * 統一的錯誤處理方法
   */
  private handleError(error: HttpErrorResponse, dataType: string): Observable<never> {
    let errorMessage = '';

    if (error.error instanceof ErrorEvent) {
      // 客戶端錯誤（網路錯誤、JSON 解析錯誤等）
      errorMessage = `無法載入${dataType}：${error.error.message}`;
    } else {
      // 伺服器端錯誤
      switch (error.status) {
        case 404:
          errorMessage = `無法載入${dataType}：檔案不存在（404）`;
          break;
        case 0:
          errorMessage = `無法載入${dataType}：網路連線失敗或 CORS 問題`;
          break;
        default:
          errorMessage = `無法載入${dataType}：伺服器錯誤（${error.status}）`;
      }
    }

    // 如果是 JSON 解析錯誤，提供更詳細的訊息
    if (error.error && typeof error.error === 'string') {
      try {
        JSON.parse(error.error);
      } catch (parseError) {
        errorMessage = `無法載入${dataType}：JSON 格式錯誤，請檢查資料檔案格式`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}

