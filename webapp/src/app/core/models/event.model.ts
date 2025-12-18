export interface Event {
  /** 唯一識別碼 */
  id: string;
  /** 事件標題，例如「靖康之禍」 */
  title: string;
  /** 所屬朝代，例如「北宋」 */
  dynasty: string;
  /** 公元年份或簡化年份（可用負值表示西元前） */
  year: number;
  /** 地理座標：緯度 */
  lat: number;
  /** 地理座標：經度 */
  lng: number;
  /** 對應的金庸作品名稱，例如「射鵰英雄傳」 */
  novel: string;
  /** 相關人物名稱列表，例如 ["郭靖", "楊康"] */
  characters: string[];
  /** 資料來源連結（URL）列表 */
  sources: string[];
  /** 額外標籤，例如 ["戰役", "襄陽"] */
  tags: string[];
  /** 歷史事件描述（可選） */
  description?: string;
  /** 小說情節摘要（可选） */
  summary?: string;
}



