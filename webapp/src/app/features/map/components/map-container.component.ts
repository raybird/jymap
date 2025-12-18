import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { ValidatedEvent } from '../../../core/utils/data-validator';

/**
 * 地圖容器組件
 * 使用原生 Leaflet 整合，提供地圖顯示和互動功能
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
  @Input() events: ValidatedEvent[] = [];
  @Input() center: [number, number] = [35.0, 105.0]; // 中國中心位置
  @Input() zoom: number = 5;

  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private baseLayer: L.TileLayer | null = null;

  ngOnInit(): void {
    // 初始化邏輯可以在這裡執行
  }

  ngAfterViewInit(): void {
    // 使用 setTimeout 確保 DOM 完全渲染後再初始化地圖
    // 需要等待一個 tick 讓 ViewChild 完全初始化
    setTimeout(() => {
      if (!this.mapContainer || !this.mapContainer.nativeElement) {
        console.error('地圖容器 ViewChild 未初始化');
        // 重試一次
        setTimeout(() => this.ngAfterViewInit(), 100);
        return;
      }
      this.initMap();
      if (this.events.length > 0) {
        this.addMarkers();
      }
    }, 100);
  }

  ngOnDestroy(): void {
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
      console.error('地圖容器未找到');
      return;
    }

    const container = this.mapContainer.nativeElement;
    
    // 確保容器有尺寸
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.warn('地圖容器尺寸為 0，等待容器渲染...');
      setTimeout(() => this.initMap(), 100);
      return;
    }

    console.log('初始化地圖，容器尺寸:', container.offsetWidth, 'x', container.offsetHeight);
    console.log('容器元素:', container);
    console.log('容器樣式:', window.getComputedStyle(container).width, window.getComputedStyle(container).height);

    // 建立地圖實例
    try {
      this.map = L.map(container, {
        center: this.center,
        zoom: this.zoom,
        zoomControl: true,
        attributionControl: true,
        // 設定縮放範圍（符合 Story 2.4 需求）
        minZoom: 3,
        maxZoom: 15,
        // 優化觸控支援（符合 NFR31, NFR32）
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: true,
        // 優化效能（符合 NFR2: 互動 FPS ≥ 30fps）
        preferCanvas: false, // 使用 SVG 以獲得更好的動畫效果
        // 設定地圖邊界（避免過度平移）
        maxBounds: [[-90, -180], [90, 180]]
      });
      console.log('地圖實例建立成功:', this.map);
    } catch (error) {
      console.error('建立地圖實例失敗:', error);
      return;
    }

    // 設定 Old Maps 風格底圖
    // 使用 OpenStreetMap 並應用復古濾鏡效果（因為 Stamen 服務有 CORS 限制）
    // 符合 FR29：Old Maps 風格底圖，呈現復古風格（紙張紋理、褪色效果、手繪風格）
    // 透過 CSS 濾鏡（sepia、contrast、brightness）實現復古效果
    this.baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      // 應用復古濾鏡效果的 CSS 類別
      className: 'old-maps-layer'
    });

    // 添加底圖載入錯誤處理
    this.baseLayer.on('tileerror', (error: any) => {
      console.warn('底圖瓦片載入失敗:', error);
      // OpenStreetMap 通常不會有 CORS 問題，但保留錯誤處理以防萬一
    });

    // 載入底圖
    this.baseLayer.addTo(this.map);

    // 監聽地圖縮放事件，更新標記大小（符合 Story 2.3：標記在不同縮放級別下保持適當大小）
    this.map.on('zoomend', () => {
      this.updateMarkerSizes();
    });

    // 確保地圖正確渲染
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 100);
  }

  /**
   * 添加事件標記到地圖
   */
  addMarkers(): void {
    if (!this.map || !this.events || this.events.length === 0) {
      return;
    }

    // 清除現有標記
    this.clearMarkers();

    // 只添加有效座標的事件
    const validEvents = this.events.filter(
      event => event.validationStatus === 'valid' && 
               !isNaN(event.lat) && !isNaN(event.lng) &&
               event.lat >= -90 && event.lat <= 90 &&
               event.lng >= -180 && event.lng <= 180
    );

    // 批次添加標記，並實作淡入動畫（符合 NFR8: 60fps，NFR3: < 200ms）
    validEvents.forEach((event, index) => {
      const marker = this.createMarker(event);
      if (marker) {
        // 先將標記設為透明
        const markerElement = marker.getElement();
        if (markerElement) {
          markerElement.style.opacity = '0';
          markerElement.style.transition = 'opacity 150ms ease-in-out';
        }

        marker.addTo(this.map!);
        this.markers.push(marker);

        // 使用 requestAnimationFrame 確保流暢動畫（60fps）
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (markerElement) {
              markerElement.style.opacity = '1';
            }
          }, index * 10); // 錯開動畫時間，避免同時觸發造成卡頓
        });
      }
    });

    console.log(`已在地圖上添加 ${this.markers.length} 個標記`);
  }

  /**
   * 建立標記
   */
  private createMarker(event: ValidatedEvent): L.Marker | null {
    if (!this.map) {
      return null;
    }

    // 建立中國水墨風格的圖示
    const icon = this.createInkStyleIcon();

    // 建立標記
    const marker = L.marker([event.lat, event.lng], { icon });

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
      console.log('標記點擊:', event);
      
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
      
      // 後續可以發送事件給父組件（使用 @Output 或 EventEmitter）
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
   * 建立中國水墨風格的圖示
   * 使用 DivIcon 建立自訂樣式的標記
   * 標記大小會根據地圖縮放級別動態調整（符合 Story 2.3 需求）
   */
  private createInkStyleIcon(): L.DivIcon {
    // 根據當前縮放級別調整標記大小
    const currentZoom = this.map?.getZoom() || this.zoom;
    const baseSize = 20;
    // 縮放級別越高，標記稍微變大（但不會過大）
    const size = Math.min(baseSize + (currentZoom - 5) * 2, 32);
    
    return L.divIcon({
      className: 'ink-marker',
      html: `<div class="ink-marker-inner" style="width: ${size}px; height: ${size}px;"></div>`,
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
   */
  updateMarkers(events: ValidatedEvent[]): void {
    this.events = events;
    if (this.map) {
      this.addMarkers();
    }
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
}

