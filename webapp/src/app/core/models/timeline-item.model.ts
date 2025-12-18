/**
 * 時間軸上的一個節點（年份/時期 + 對應事件）。
 */
export interface TimelineItem {
  /** 年份（可用負值表示西元前） */
  year: number;
  /** 所屬朝代名稱，例如「北宋」 */
  dynasty: string;
  /** 此時間點對應的事件 ID 清單 */
  eventIds: string[];
}



