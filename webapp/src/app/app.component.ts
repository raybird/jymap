import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataService } from './core/services/data.service';
import { ValidatedEvent, ValidatedTimelineItem } from './core/utils/data-validator';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'jymap';
  events: ValidatedEvent[] = [];
  timeline: ValidatedTimelineItem[] = [];
  loading = true;
  error: string | null = null;
  validationStats: {
    total: number;
    valid: number;
    invalidCoordinates: number;
    incompleteData: number;
    invalidCoordinatesRate: number;
    requiredFieldsCoverage: number;
  } | null = null;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;
    this.validationStats = null;

    // 載入事件資料
    this.dataService.loadEvents().subscribe({
      next: (result) => {
        this.events = result.data;
        this.validationStats = result.validationStats || null;
        this.checkLoadingComplete();
      },
      error: (err) => {
        this.error = err.message || '載入事件資料失敗';
        this.loading = false;
        console.error('載入事件資料錯誤:', err);
      }
    });

    // 載入時間軸資料
    this.dataService.loadTimeline().subscribe({
      next: (result) => {
        this.timeline = result.data;
        this.checkLoadingComplete();
      },
      error: (err) => {
        // 如果事件資料已載入，只顯示警告；否則顯示錯誤
        if (this.events.length > 0) {
          console.warn('載入時間軸資料失敗:', err);
        } else {
          this.error = err.message || '載入時間軸資料失敗';
          this.loading = false;
        }
        console.error('載入時間軸資料錯誤:', err);
      }
    });
  }

  private checkLoadingComplete(): void {
    // 只要事件資料載入完成即可（時間軸載入失敗不影響主要功能）
    if (this.events.length > 0) {
      this.loading = false;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'valid':
        return 'badge-valid';
      case 'invalid-coordinates':
        return 'badge-invalid-coords';
      case 'incomplete-data':
        return 'badge-incomplete';
      default:
        return 'badge-unknown';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'valid':
        return '✓ 有效';
      case 'invalid-coordinates':
        return '⚠ 座標無效';
      case 'incomplete-data':
        return '⚠ 資料不完整';
      default:
        return '? 未知';
    }
  }
}
