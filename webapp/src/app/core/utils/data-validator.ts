import { Event, TimelineItem } from '../models';

/**
 * 資料驗證結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 驗證後的事件（包含驗證狀態）
 */
export interface ValidatedEvent extends Event {
  validationStatus: 'valid' | 'invalid-coordinates' | 'incomplete-data';
  validationErrors: string[];
}

/**
 * 驗證後的時間軸項目（包含驗證狀態）
 */
export interface ValidatedTimelineItem extends TimelineItem {
  validationStatus: 'valid' | 'invalid';
  validationErrors: string[];
}

/**
 * 資料驗證工具類別
 */
export class DataValidator {
  /**
   * 驗證事件資料
   */
  static validateEvent(event: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 驗證必填欄位
    if (!event.id || typeof event.id !== 'string' || event.id.trim() === '') {
      errors.push('事件 ID 為必填欄位且必須為非空字串');
    }

    if (!event.title || typeof event.title !== 'string' || event.title.trim() === '') {
      errors.push('事件標題為必填欄位且必須為非空字串');
    }

    if (!event.dynasty || typeof event.dynasty !== 'string' || event.dynasty.trim() === '') {
      errors.push('朝代名稱為必填欄位且必須為非空字串');
    }

    if (typeof event.year !== 'number' || isNaN(event.year)) {
      errors.push('年份為必填欄位且必須為數字');
    } else {
      // 驗證年份範圍（春秋前 473 年到清乾隆 18 世紀，允許一些緩衝）
      if (event.year < -500 || event.year > 1800) {
        warnings.push(`年份 ${event.year} 超出預期範圍（-500 到 1800）`);
      }
    }

    if (!event.novel || typeof event.novel !== 'string' || event.novel.trim() === '') {
      errors.push('小說作品名稱為必填欄位且必須為非空字串');
    }

    // 驗證地理座標
    if (typeof event.lat !== 'number' || isNaN(event.lat)) {
      errors.push('緯度為必填欄位且必須為數字');
    } else if (event.lat < -90 || event.lat > 90) {
      errors.push(`緯度 ${event.lat} 超出有效範圍（-90 到 90）`);
    }

    if (typeof event.lng !== 'number' || isNaN(event.lng)) {
      errors.push('經度為必填欄位且必須為數字');
    } else if (event.lng < -180 || event.lng > 180) {
      errors.push(`經度 ${event.lng} 超出有效範圍（-180 到 180）`);
    }

    // 驗證陣列欄位
    if (!Array.isArray(event.characters)) {
      warnings.push('相關人物欄位應為陣列');
    }

    if (!Array.isArray(event.sources)) {
      warnings.push('資料來源欄位應為陣列');
    }

    if (!Array.isArray(event.tags)) {
      warnings.push('標籤欄位應為陣列');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 驗證時間軸項目資料
   */
  static validateTimelineItem(item: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof item.year !== 'number' || isNaN(item.year)) {
      errors.push('年份為必填欄位且必須為數字');
    } else {
      if (item.year < -500 || item.year > 1800) {
        warnings.push(`年份 ${item.year} 超出預期範圍（-500 到 1800）`);
      }
    }

    if (!item.dynasty || typeof item.dynasty !== 'string' || item.dynasty.trim() === '') {
      errors.push('朝代名稱為必填欄位且必須為非空字串');
    }

    if (!Array.isArray(item.eventIds)) {
      errors.push('事件 ID 陣列為必填欄位且必須為陣列');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 驗證並標記事件
   */
  static validateAndMarkEvent(event: any): ValidatedEvent {
    const validation = this.validateEvent(event);
    let validationStatus: 'valid' | 'invalid-coordinates' | 'incomplete-data' = 'valid';

    // 判斷驗證狀態
    if (!validation.isValid) {
      const hasCoordinateError = validation.errors.some(
        err => err.includes('緯度') || err.includes('經度')
      );
      const hasRequiredFieldError = validation.errors.some(
        err => err.includes('必填欄位')
      );

      if (hasCoordinateError) {
        validationStatus = 'invalid-coordinates';
      } else if (hasRequiredFieldError) {
        validationStatus = 'incomplete-data';
      }
    }

    return {
      ...event,
      validationStatus,
      validationErrors: [...validation.errors, ...validation.warnings]
    };
  }

  /**
   * 驗證並標記時間軸項目
   */
  static validateAndMarkTimelineItem(item: any): ValidatedTimelineItem {
    const validation = this.validateTimelineItem(item);

    return {
      ...item,
      validationStatus: validation.isValid ? 'valid' : 'invalid',
      validationErrors: [...validation.errors, ...validation.warnings]
    };
  }

  /**
   * 驗證事件陣列並計算統計資訊
   */
  static validateEvents(events: any[]): {
    validated: ValidatedEvent[];
    stats: {
      total: number;
      valid: number;
      invalidCoordinates: number;
      incompleteData: number;
      invalidCoordinatesRate: number;
      requiredFieldsCoverage: number;
    };
  } {
    const validated = events.map(event => this.validateAndMarkEvent(event));

    const total = validated.length;
    const valid = validated.filter(e => e.validationStatus === 'valid').length;
    const invalidCoordinates = validated.filter(e => e.validationStatus === 'invalid-coordinates').length;
    const incompleteData = validated.filter(e => e.validationStatus === 'incomplete-data').length;

    // 計算必填欄位覆蓋率（至少有一個必填欄位缺失的事件視為不完整）
    const incompleteCount = invalidCoordinates + incompleteData;
    const requiredFieldsCoverage = total > 0 ? ((total - incompleteCount) / total) * 100 : 100;

    // 計算無效座標率
    const invalidCoordinatesRate = total > 0 ? (invalidCoordinates / total) * 100 : 0;

    return {
      validated,
      stats: {
        total,
        valid,
        invalidCoordinates,
        incompleteData,
        invalidCoordinatesRate,
        requiredFieldsCoverage
      }
    };
  }

  /**
   * 驗證時間軸項目陣列
   */
  static validateTimelineItems(items: any[]): ValidatedTimelineItem[] {
    return items.map(item => this.validateAndMarkTimelineItem(item));
  }
}

