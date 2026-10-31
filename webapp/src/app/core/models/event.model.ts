/**
 * 年代只能由情節推估區間時的資料；有值時 year 僅作排序佔位，不對外顯示
 */
export interface EraEstimate {
  /** 推估區間起始年（可用負值表示西元前） */
  startYear: number;
  /** 推估區間結束年；null 表示正文只給下限 */
  endYear: number | null;
  /** 顯示文字，例如「約 1665 年後（確年未詳）」 */
  label: string;
  /** 取代朝代顯示的文字；省略時沿用 dynasty */
  dynastyLabel?: string;
  /** 同作品內依正文章回排定的情節先後 */
  storyOrder: number;
}

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
  /** 年代推估區間（可選） */
  eraEstimate?: EraEstimate;
}



