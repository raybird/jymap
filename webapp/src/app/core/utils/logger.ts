/**
 * 日誌工具類別
 * 在開發環境中輸出日誌，生產環境中可選擇性禁用
 */
export class Logger {
  private static readonly isDevelopment = 
    typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' || 
     window.location.hostname.includes('localhost'));

  /**
   * 輸出一般日誌
   */
  static log(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`[Jymap] ${message}`, ...args);
    }
  }

  /**
   * 輸出警告日誌
   */
  static warn(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.warn(`[Jymap] ${message}`, ...args);
    }
  }

  /**
   * 輸出錯誤日誌（生產環境也輸出）
   */
  static error(message: string, ...args: any[]): void {
    console.error(`[Jymap] ${message}`, ...args);
  }

  /**
   * 輸出除錯日誌（僅開發環境）
   */
  static debug(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.debug(`[Jymap] ${message}`, ...args);
    }
  }
}

