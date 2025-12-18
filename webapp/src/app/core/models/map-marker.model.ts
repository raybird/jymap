/**
 * 地圖上使用的標記資料模型，由 Event 衍生而來。
 */
export interface MapMarker {
  /** 對應的事件 ID */
  eventId: string;
  /** 地理座標：緯度 */
  lat: number;
  /** 地理座標：經度 */
  lng: number;
  /** 標記顏色（CSS 顏色值，可選） */
  color?: string;
  /** 標記圖示名稱或 URL（可選） */
  icon?: string;
  /** 聚合 ID（用於 cluster 分組，可選） */
  clusterId?: string;
}



