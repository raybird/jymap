import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import * as L from 'leaflet';
import { ValidatedEvent } from '../../../core/utils/data-validator';
import { AppState } from '../../../core/state/app.state';
import * as TimeMapSelectors from '../../../core/state/time-map.selectors';
import * as TimeMapActions from '../../../core/state/time-map.actions';
import { Logger } from '../../../core/utils/logger';

/**
 * 地圖容器組件
 * 使用原生 Leaflet 整合，提供地圖顯示和互動功能
 * 直接訂閱 NgRx Store 以實現時間軸與地圖狀態同步（Story 4.2）
 */
@Component({
  selector: 'app-map-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-container.component.html',
  styleUrl: './map-container.component.scss'
})
export class MapContainerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;
  @Input() center: [number, number] = [35.0, 105.0];
  @Input() zoom: number = 5;
  @Input() set selectedNovel(novel: string | null) {
    this._selectedNovel = novel;
  }
  get selectedNovel(): string | null {
    return this._selectedNovel;
  }
  @Output() eventClick = new EventEmitter<ValidatedEvent>();

  // NgRx 訂閱
  visibleEvents$: Observable<ValidatedEvent[]>;

  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private baseLayer: L.TileLayer | null = null;
  private destroy$ = new Subject<void>();
  private _selectedNovel: string | null = null;

  constructor(private store: Store<AppState>) {
    this.visibleEvents$ = this.store.select(TimeMapSelectors.selectVisibleEvents);

    this.visibleEvents$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(events => {
      if (this.map) {
        requestAnimationFrame(() => {
          this.updateMarkers(events);
        });
      }
    });

    // 當小說篩選變更時，自動縮放地圖以顯示該小說的所有事件
    this.store.select(TimeMapSelectors.selectSelectedNovel).pipe(
      takeUntil(this.destroy$)
    ).subscribe(novel => {
      this._selectedNovel = novel;
      if (this.map && novel) {
        this.store.select(TimeMapSelectors.selectVisibleEvents).pipe(take(1)).subscribe(events => {
          this.fitMapToEvents(events);
        });
      }
    });
  }

  ngOnInit(): void {
    // 初始化邏輯可以在這裡執行
  }

  ngAfterViewInit(): void {
    // 使用 setTimeout 確保 DOM 完全渲染後再初始化地圖
    // 需要等待一個 tick 讓 ViewChild 完全初始化
    setTimeout(() => {
      if (!this.mapContainer || !this.mapContainer.nativeElement) {
        Logger.error('地圖容器 ViewChild 未初始化');
        // 重試一次
        setTimeout(() => this.ngAfterViewInit(), 100);
        return;
      }
      this.initMap();

      // 地圖初始化完成後，獲取當前可見事件並添加標記
      this.store.select(TimeMapSelectors.selectVisibleEvents).pipe(
        take(1),
        takeUntil(this.destroy$)
      ).subscribe(events => {
        if (this.map) {
          requestAnimationFrame(() => {
            this.updateMarkers(events);
          });
        }
      });
    }, 100);
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  /**
   * 初始化地圖
   */
  private initMap(): void {
    if (!this.mapContainer || !this.mapContainer.nativeElement) {
      Logger.error('地圖容器未找到');
      return;
    }

    const container = this.mapContainer.nativeElement;

    // 確保容器有尺寸
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      Logger.warn('地圖容器尺寸為 0，等待容器渲染...');
      setTimeout(() => this.initMap(), 100);
      return;
    }

    Logger.debug('初始化地圖，容器尺寸:', container.offsetWidth, 'x', container.offsetHeight);

    // 金庸世界觀地理範圍：涵蓋所有小說涉及地域
    // 緯度：10°N 到 55°N（從南洋到西伯利亞南部，涵蓋冰火島）
    // 經度：55°E 到 155°E（從中亞到西北太平洋，涵蓋西域、日本、冰火島）
    // 涵蓋：中國全境、西域/中亞、蒙古、朝鮮半島、日本、東南亞北部
    // 冰火島座標約 (48°N, 148°E)，經度需延伸至 155°E 以上
    const jymapBounds: L.LatLngBoundsExpression = [
      [10, 55],   // 西南角（南洋/緬甸，哈薩克東部）
      [55, 155]   // 東北角（西伯利亞南部/西北太平洋，涵蓋冰火島）
    ];

    // 建立地圖實例
    try {

      this.map = L.map(container, {
        center: this.center,
        zoom: this.zoom,
        zoomControl: true,
        attributionControl: true,
        // 設定縮放範圍（符合 Story 2.4 需求）
        // 提高 minZoom 以避免在最小縮放時顯示過大的範圍（歐洲、非洲等）
        minZoom: 3,  // 設定為 3 以支援西域與冰火島等較遠區域
        maxZoom: 15,
        // 優化觸控支援（符合 NFR31, NFR32）
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: true,
        // 優化效能（符合 NFR2: 互動 FPS ≥ 30fps）
        preferCanvas: false, // 使用 SVG 以獲得更好的動畫效果
        // 限制地圖範圍為金庸世界觀區域（避免顯示美洲、非洲等無關區域）
        maxBounds: jymapBounds,
        maxBoundsViscosity: 0.8 // 邊界彈性係數，避免拖曳時突然被限制
      });
      Logger.debug('地圖實例建立成功');
    } catch (error) {
      Logger.error('建立地圖實例失敗:', error);
      return;
    }

    this.baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      className: 'old-maps-layer'
    });

    // 添加底圖載入錯誤處理
    this.baseLayer.on('tileerror', (error: any) => {
      Logger.warn('底圖瓦片載入失敗:', error);
      // OpenStreetMap 通常不會有 CORS 問題，但保留錯誤處理以防萬一
    });

    // 載入底圖
    this.baseLayer.addTo(this.map);

    // 確保地圖視圖在邊界內，並限制最小縮放級別
    // 使用 setTimeout 確保地圖完全初始化後再調整視圖
    setTimeout(() => {
      if (this.map) {
        // 強制將地圖視圖限制在邊界內
        const bounds = L.latLngBounds(jymapBounds);
        const currentZoom = this.map.getZoom();
        // 如果當前縮放級別小於 minZoom，強制調整
        if (currentZoom < 3) {
          this.map.setZoom(3);
        }
        // 確保地圖中心在邊界內
        const currentCenter = this.map.getCenter();
        if (!bounds.contains(currentCenter)) {
          this.map.setView(bounds.getCenter(), Math.max(3, currentZoom));
        }
        // 觸發一次 invalidateSize 確保正確渲染
        this.map.invalidateSize();
      }
    }, 100);

    // 監聽地圖縮放事件，更新標記大小（符合 Story 2.3：標記在不同縮放級別下保持適當大小）
    this.map.on('zoomend', () => {
      this.updateMarkerSizes();
    });

    // 監聽地圖移動事件，更新 NgRx Store 中的地圖視圖狀態（Story 4.2）
    this.map.on('moveend', () => {
      if (this.map) {
        const center = this.map.getCenter();
        const zoom = this.map.getZoom();
        this.store.dispatch(TimeMapActions.setMapView({
          center: [center.lat, center.lng],
          zoom
        }));
      }
    });

    // 確保地圖正確渲染
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 100);
  }

  private getNovelColor(novel: string): string {
    const map: Record<string, string> = {
      '越女劍': '#2E7D32', '天龍八部': '#B8860B', '射鵰英雄傳': '#C62828',
      '神鵰俠侶': '#6A1B9A', '倚天屠龍記': '#1565C0', '笑傲江湖': '#00695C',
      '碧血劍': '#D84315', '鹿鼎記': '#F57F17', '書劍恩仇錄': '#33691E',
      '飛狐外傳': '#E65100', '雪山飛狐': '#455A64', '連城訣': '#4E342E',
      '俠客行': '#283593', '白馬嘯西風': '#827717', '鴛鴦刀': '#AD1457',
    };
    return map[novel] || '#666666';
  }

  /**
   * 建立標記
   */
  private createMarker(event: ValidatedEvent): L.Marker | null {
    if (!this.map) {
      return null;
    }

    const isWeighted = !this.selectedNovel || this.selectedNovel === event.novel;
    const icon = this.createInkStyleIcon(event, isWeighted);

    // 建立標記
    const marker = L.marker([event.lat, event.lng], { icon });

    // 儲存 eventId 以便後續比較（用於 updateMarkers）
    (marker as any).eventId = event.id;

    // 添加彈出視窗
    marker.bindPopup(`
      <div class="marker-popup">
        <h3>${event.title}</h3>
        <p><strong>朝代：</strong>${event.dynasty}</p>
        <p><strong>年份：</strong>${event.year}</p>
        <p><strong>作品：</strong>${event.novel}</p>
      </div>
    `);

    // 添加點擊事件（符合 NFR5: 點擊回應時間 < 500ms）
    marker.on('click', () => {
      Logger.debug('標記點擊:', event.title);

      // 添加點擊視覺回饋
      const markerElement = marker.getElement();
      if (markerElement) {
        const innerElement = markerElement.querySelector('.ink-marker-inner') as HTMLElement;
        if (innerElement) {
          // 點擊時放大並高亮
          innerElement.style.transform = 'scale(1.5)';
          innerElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.8), 0 0 0 4px rgba(255, 255, 255, 1)';

          // 200ms 後恢復
          setTimeout(() => {
            innerElement.style.transform = '';
            innerElement.style.boxShadow = '';
          }, 200);
        }
      }

      // 打開彈出視窗
      marker.openPopup();

      // 通知父組件
      this.eventClick.emit(event);
    });

    // 添加滑鼠懸停效果
    marker.on('mouseover', () => {
      const markerElement = marker.getElement();
      if (markerElement) {
        const innerElement = markerElement.querySelector('.ink-marker-inner') as HTMLElement;
        if (innerElement) {
          innerElement.style.transform = 'scale(1.2)';
        }
      }
    });

    marker.on('mouseout', () => {
      const markerElement = marker.getElement();
      if (markerElement) {
        const innerElement = markerElement.querySelector('.ink-marker-inner') as HTMLElement;
        if (innerElement && !marker.isPopupOpen()) {
          innerElement.style.transform = '';
        }
      }
    });

    return marker;
  }

  /**
   * 建立中國印章風格標記（各作品專屬顏色，SVG 仿朱文印章）
   */
  private createInkStyleIcon(event: ValidatedEvent, isWeighted: boolean = true): L.DivIcon {
    const currentZoom = this.map?.getZoom() || this.zoom;
    const baseSize = isWeighted ? 20 : 14;
    const size = Math.min(baseSize + (currentZoom - 5) * 2, isWeighted ? 32 : 24);
    const color = this.getNovelColor(event.novel);
    const c = 20, r = 18;
    const opacity = isWeighted ? 1 : 0.4;
    const glowOpacity = isWeighted ? 0.12 : 0.04;

    const svg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="ink-${event.id}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${color}" stop-opacity="${glowOpacity}"/>
            <stop offset="80%" stop-color="${color}" stop-opacity="${glowOpacity * 0.4}"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="${c}" cy="${c}" r="${r}" fill="url(#ink-${event.id})"/>
        <circle cx="${c}" cy="${c}" r="${r - 1.5}" fill="none" stroke="${color}" stroke-width="${isWeighted ? 2.5 : 1.5}" opacity="${opacity * 0.9}"/>
        <circle cx="${c}" cy="${c}" r="${r - 5}" fill="none" stroke="${color}" stroke-width="1" opacity="${opacity * 0.3}"/>
        <circle cx="${c}" cy="${c}" r="${isWeighted ? 5 : 3}" fill="#C41E3A" opacity="${opacity * 0.85}"/>
        <circle cx="${c}" cy="${c}" r="2" fill="#FFF" opacity="${opacity * 0.5}"/>
      </svg>`;

    return L.divIcon({
      className: 'ink-marker',
      html: `<div class="ink-marker-inner" style="width:${size}px;height:${size}px;opacity:${opacity}">${svg}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  }

  /**
   * 清除所有標記
   */
  clearMarkers(): void {
    this.markers.forEach(marker => {
      if (this.map) {
        this.map.removeLayer(marker);
      }
    });
    this.markers = [];
  }

  /**
   * 更新地圖標記（當事件資料變更時）
   * 實作淡入淡出動畫（符合 Story 4.3）
   */
  updateMarkers(events: ValidatedEvent[]): void {
    if (!this.map) {
      return;
    }

    const validEvents = events.filter(
      event => event.validationStatus === 'valid' &&
        !isNaN(event.lat) && !isNaN(event.lng) &&
        event.lat >= -90 && event.lat <= 90 &&
        event.lng >= -180 && event.lng <= 180
    );

    const newEventIds = new Set(validEvents.map(e => e.id));

    // 找出需要移除的標記（不在新事件列表中）
    const markersToRemove = this.markers.filter(m => {
      const eventId = (m as any).eventId;
      return eventId && !newEventIds.has(eventId);
    });

    // 移除舊標記（淡出動畫）
    markersToRemove.forEach((marker, index) => {
      const el = marker.getElement();
      if (el) {
        el.style.transition = 'opacity 200ms ease-out';
        el.style.opacity = '0';
      }
      setTimeout(() => {
        if (this.map) {
          this.map.removeLayer(marker);
        }
      }, 200 + index * 10);
    });

    // 等淡出完成後，清除 markers 陣列並重新加入所有新標記
    const delay = markersToRemove.length > 0 ? 250 : 0;
    setTimeout(() => {
      // 從 this.markers 中移除已被清除的標記
      this.markers = this.markers.filter(m => !markersToRemove.includes(m));

      // 找出真正需要新增的事件（不在當前 markers 中）
      const existingIds = new Set(this.markers.map(m => (m as any).eventId));
      const eventsToAdd = validEvents.filter(e => !existingIds.has(e.id));

      eventsToAdd.forEach((event, i) => {
        setTimeout(() => {
          const marker = this.createMarker(event);
          if (marker) {
            (marker as any).eventId = event.id;
            marker.addTo(this.map!);
            this.markers.push(marker);
          }
        }, i * 10);
      });
    }, delay);
  }

  /**
   * 縮放到指定位置
   */
  flyTo(lat: number, lng: number, zoom?: number): void {
    if (this.map) {
      this.map.flyTo([lat, lng], zoom || this.map.getZoom());
    }
  }

  /**
   * 更新標記大小（根據地圖縮放級別）
   */
  private updateMarkerSizes(): void {
    if (!this.map) {
      return;
    }

    const currentZoom = this.map.getZoom();
    const baseSize = 20;
    const size = Math.min(baseSize + (currentZoom - 5) * 2, 32);

    this.markers.forEach(marker => {
      const markerElement = marker.getElement();
      if (markerElement) {
        const innerElement = markerElement.querySelector('.ink-marker-inner') as HTMLElement;
        if (innerElement) {
          innerElement.style.width = `${size}px`;
          innerElement.style.height = `${size}px`;
        }
      }
    });
  }

  /**
   * 獲取地圖實例（供外部使用）
   */
  getMap(): L.Map | null {
    return this.map;
  }

  /**
   * 縮放地圖以容納所有指定事件
   */
  fitMapToEvents(events: ValidatedEvent[]): void {
    if (!this.map || events.length === 0) {
      return;
    }

    const validEvents = events.filter(
      event => event.validationStatus === 'valid' &&
        !isNaN(event.lat) && !isNaN(event.lng)
    );

    if (validEvents.length === 0) {
      return;
    }

    if (validEvents.length === 1) {
      this.map.flyTo([validEvents[0].lat, validEvents[0].lng], 7, {
        duration: 1.0,
        easeLinearity: 0.25
      });
      return;
    }

    const bounds = L.latLngBounds(
      validEvents.map(e => L.latLng(e.lat, e.lng))
    );
    this.map.flyToBounds(bounds, {
      padding: [50, 50],
      maxZoom: 8,
      duration: 1.0,
      easeLinearity: 0.25
    });
  }

  /**
   * 高亮顯示指定事件的標記（用於搜尋結果跳轉）
   * Story 5.3: 搜尋結果與時間軸/地圖同步跳轉
   */
  highlightMarker(eventId: string): void {
    if (!this.map) {
      Logger.warn('地圖未初始化，無法高亮標記');
      return;
    }

    // 找到對應的標記
    const marker = this.markers.find(m => (m as any).eventId === eventId);

    if (!marker) {
      Logger.warn('找不到對應的標記:', eventId);
      return;
    }

    // 獲取標記位置
    const position = marker.getLatLng();

    // 飛到標記位置並縮放（如果當前縮放級別太小）
    const currentZoom = this.map.getZoom();
    const targetZoom = Math.max(currentZoom, 8); // 至少縮放到 8 級

    this.map.flyTo(position, targetZoom, {
      duration: 0.8, // 動畫時間 0.8 秒
      easeLinearity: 0.25
    });

    // 高亮標記（添加視覺效果）
    const markerElement = marker.getElement();
    if (markerElement) {
      const innerElement = markerElement.querySelector('.ink-marker-inner') as HTMLElement;
      if (innerElement) {
        // 添加高亮樣式
        innerElement.style.transform = 'scale(1.5)';
        innerElement.style.boxShadow = '0 4px 16px rgba(255, 193, 7, 0.8), 0 0 0 4px rgba(255, 193, 7, 0.4)';
        innerElement.style.zIndex = '1000';

        // 打開彈出視窗
        marker.openPopup();

        // 3 秒後恢復正常樣式
        setTimeout(() => {
          if (innerElement) {
            innerElement.style.transform = '';
            innerElement.style.boxShadow = '';
            innerElement.style.zIndex = '';
          }
        }, 3000);
      }
    }

    Logger.debug('高亮標記:', eventId, '位置:', position);
  }
}

