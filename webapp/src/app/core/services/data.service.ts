import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Event, TimelineItem } from '../models';

/**
 * 資料載入服務
 * 負責從靜態 JSON 檔案載入金庸事件資料和時間軸資料
 */
@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly eventsUrl = '/assets/data/events.json';
  private readonly timelineUrl = '/assets/data/timeline.json';

  constructor(private http: HttpClient) {}

  /**
   * 載入所有事件資料
   * @returns Observable<Event[]> 事件陣列
   */
  loadEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.eventsUrl).pipe(
      catchError((error) => {
        console.error('載入事件資料失敗:', error);
        return throwError(() => new Error(`無法載入事件資料: ${error.message}`));
      })
    );
  }

  /**
   * 載入時間軸資料
   * @returns Observable<TimelineItem[]> 時間軸項目陣列
   */
  loadTimeline(): Observable<TimelineItem[]> {
    return this.http.get<TimelineItem[]>(this.timelineUrl).pipe(
      catchError((error) => {
        console.error('載入時間軸資料失敗:', error);
        return throwError(() => new Error(`無法載入時間軸資料: ${error.message}`));
      })
    );
  }
}

