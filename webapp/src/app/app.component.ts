import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataService } from './core/services/data.service';
import { Event, TimelineItem } from './core/models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'jymap';
  events: Event[] = [];
  timeline: TimelineItem[] = [];
  loading = true;
  error: string | null = null;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    // 載入事件資料
    this.dataService.loadEvents().subscribe({
      next: (events) => {
        this.events = events;
        this.checkLoadingComplete();
      },
      error: (err) => {
        this.error = `載入事件資料失敗: ${err.message}`;
        this.loading = false;
        console.error('載入事件資料錯誤:', err);
      }
    });

    // 載入時間軸資料
    this.dataService.loadTimeline().subscribe({
      next: (timeline) => {
        this.timeline = timeline;
        this.checkLoadingComplete();
      },
      error: (err) => {
        this.error = `載入時間軸資料失敗: ${err.message}`;
        this.loading = false;
        console.error('載入時間軸資料錯誤:', err);
      }
    });
  }

  private checkLoadingComplete(): void {
    if (this.events.length > 0 && this.timeline.length > 0) {
      this.loading = false;
    }
  }
}
