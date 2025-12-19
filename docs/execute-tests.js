/**
 * 測試執行腳本 - 可在瀏覽器控制台直接執行
 * 
 * 使用方法：
 * 1. 打開 http://localhost:4200
 * 2. 打開瀏覽器開發工具（F12）
 * 3. 切換到 Console 標籤
 * 4. 複製並執行以下測試函數
 */

// 測試 1: 時間軸拖曳與地圖同步
async function testTimelineDragSync() {
  console.log('開始測試：時間軸拖曳與地圖同步');
  
  const timelineContainer = document.querySelector('app-timeline-container .timeline-container');
  if (!timelineContainer) {
    console.error('❌ 找不到時間軸容器');
    return { error: 'Timeline container not found' };
  }
  
  const rect = timelineContainer.getBoundingClientRect();
  const startX = rect.left + 100;
  const startY = rect.top + 50;
  const endX = rect.left + 500;
  const endY = rect.top + 50;
  
  const initialScroll = timelineContainer.scrollLeft;
  const initialMarkerCount = document.querySelectorAll('app-map-container .leaflet-marker-pane > div').length;
  const startTime = performance.now();
  
  console.log('初始狀態:', { initialScroll, initialMarkerCount });
  
  // 模擬拖曳操作
  const mouseDown = new MouseEvent('mousedown', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: startX,
    clientY: startY,
    button: 0
  });
  
  const mouseMove = new MouseEvent('mousemove', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: endX,
    clientY: endY,
    button: 0
  });
  
  const mouseUp = new MouseEvent('mouseup', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: endX,
    clientY: endY,
    button: 0
  });
  
  timelineContainer.dispatchEvent(mouseDown);
  document.dispatchEvent(mouseMove);
  document.dispatchEvent(mouseUp);
  
  // 等待 NgRx 處理和動畫完成
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const endTime = performance.now();
  const afterScroll = timelineContainer.scrollLeft;
  const afterMarkerCount = document.querySelectorAll('app-map-container .leaflet-marker-pane > div').length;
  const syncTime = endTime - startTime;
  
  const result = {
    test: 'timeline-drag-sync',
    initialScroll,
    afterScroll,
    scrollWorked: afterScroll !== initialScroll,
    initialMarkerCount,
    afterMarkerCount,
    syncTime: syncTime.toFixed(2) + 'ms',
    meetsRequirement: syncTime < 200
  };
  
  console.log('測試結果:', result);
  console.log(result.meetsRequirement ? '✅ 通過' : '❌ 失敗');
  
  return result;
}

// 測試 2: 標記淡入淡出動畫
async function testMarkerAnimation() {
  console.log('開始測試：標記淡入淡出動畫');
  
  const timelineContainer = document.querySelector('app-timeline-container .timeline-container');
  const markers = document.querySelectorAll('app-map-container .leaflet-marker-pane > div');
  
  if (!timelineContainer || markers.length === 0) {
    console.error('❌ 找不到時間軸或標記');
    return { error: 'Timeline or markers not found' };
  }
  
  const initialOpacities = Array.from(markers).map(m => 
    parseFloat(window.getComputedStyle(m).opacity)
  );
  
  console.log('初始透明度:', initialOpacities);
  
  const startTime = performance.now();
  timelineContainer.scrollLeft = 3000;
  
  let frameCount = 0;
  const animationFrames = [];
  
  return new Promise((resolve) => {
    const observeAnimation = () => {
      frameCount++;
      const currentOpacities = Array.from(markers).map(m => 
        parseFloat(window.getComputedStyle(m).opacity)
      );
      
      animationFrames.push({
        frame: frameCount,
        time: performance.now() - startTime,
        opacities: currentOpacities
      });
      
      if (frameCount < 30) {
        requestAnimationFrame(observeAnimation);
      } else {
        const endTime = performance.now();
        const duration = endTime - startTime;
        const fps = (frameCount / duration) * 1000;
        
        const result = {
          test: 'marker-animation',
          animationDuration: duration.toFixed(2) + 'ms',
          frameCount,
          fps: fps.toFixed(2),
          meetsDurationRequirement: duration < 200,
          meetsFPSRequirement: fps >= 30,
          initialOpacities,
          finalOpacities: currentOpacities
        };
        
        console.log('測試結果:', result);
        console.log(result.meetsDurationRequirement && result.meetsFPSRequirement ? '✅ 通過' : '❌ 失敗');
        
        resolve(result);
      }
    };
    
    requestAnimationFrame(observeAnimation);
    
    // 超時保護
    setTimeout(() => {
      if (frameCount < 30) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        const fps = (frameCount / duration) * 1000;
        const finalOpacities = Array.from(markers).map(m => 
          parseFloat(window.getComputedStyle(m).opacity)
        );
        
        const result = {
          test: 'marker-animation',
          animationDuration: duration.toFixed(2) + 'ms',
          frameCount,
          fps: fps.toFixed(2),
          meetsDurationRequirement: duration < 200,
          meetsFPSRequirement: fps >= 30,
          initialOpacities,
          finalOpacities
        };
        
        console.log('測試結果（超時）:', result);
        resolve(result);
      }
    }, 300);
  });
}

// 測試 3: 時間範圍選擇與地圖過濾
async function testTimeRangeSelection() {
  console.log('開始測試：時間範圍選擇與地圖過濾');
  
  const timelineTrack = document.querySelector('app-timeline-container .timeline-track');
  const timelineContainer = document.querySelector('app-timeline-container .timeline-container');
  
  if (!timelineTrack || !timelineContainer) {
    console.error('❌ 找不到時間軸元素');
    return { error: 'Timeline elements not found' };
  }
  
  const rect = timelineTrack.getBoundingClientRect();
  const startX = rect.left + 200;
  const startY = rect.top + 50;
  const endX = rect.left + 600;
  const endY = rect.top + 50;
  
  const initialMarkerCount = document.querySelectorAll('app-map-container .leaflet-marker-pane > div').length;
  console.log('初始標記數量:', initialMarkerCount);
  
  // 模擬 Shift + 拖曳
  const mouseDown = new MouseEvent('mousedown', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: startX,
    clientY: startY,
    button: 0,
    shiftKey: true
  });
  
  const mouseMove = new MouseEvent('mousemove', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: endX,
    clientY: endY,
    button: 0,
    shiftKey: true
  });
  
  const mouseUp = new MouseEvent('mouseup', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: endX,
    clientY: endY,
    button: 0
  });
  
  timelineTrack.dispatchEvent(mouseDown);
  document.dispatchEvent(mouseMove);
  document.dispatchEvent(mouseUp);
  
  // 等待 NgRx 處理
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const timeSelection = document.querySelector('app-timeline-container .time-selection');
  const afterMarkerCount = document.querySelectorAll('app-map-container .leaflet-marker-pane > div').length;
  
  const result = {
    test: 'time-range-selection',
    timeSelectionVisible: !!timeSelection,
    timeSelectionText: timeSelection?.textContent || null,
    initialMarkerCount,
    afterMarkerCount,
    markersFiltered: afterMarkerCount !== initialMarkerCount
  };
  
  console.log('測試結果:', result);
  console.log(result.timeSelectionVisible ? '✅ 通過' : '❌ 失敗');
  
  return result;
}

// 測試 4: 效能測試 - 同步延遲
async function testSyncPerformance() {
  console.log('開始測試：同步延遲');
  
  const timelineContainer = document.querySelector('app-timeline-container .timeline-container');
  if (!timelineContainer) {
    console.error('❌ 找不到時間軸容器');
    return { error: 'Timeline container not found' };
  }
  
  performance.mark('sync-start');
  
  const initialScroll = timelineContainer.scrollLeft;
  timelineContainer.scrollLeft = 2000;
  
  const scrollEvent = new Event('scroll', { bubbles: true });
  timelineContainer.dispatchEvent(scrollEvent);
  
  await new Promise(resolve => {
    const checkSync = () => {
      const markers = document.querySelectorAll('app-map-container .leaflet-marker-pane > div');
      performance.mark('sync-end');
      performance.measure('sync-duration', 'sync-start', 'sync-end');
      const measure = performance.getEntriesByName('sync-duration')[0];
      resolve(measure ? measure.duration : null);
    };
    setTimeout(checkSync, 200);
  });
  
  const measure = performance.getEntriesByName('sync-duration')[0];
  const result = {
    test: 'sync-performance',
    syncDuration: measure ? measure.duration.toFixed(2) + 'ms' : 'N/A',
    meetsRequirement: measure ? measure.duration < 200 : false,
    initialScroll,
    afterScroll: timelineContainer.scrollLeft
  };
  
  console.log('測試結果:', result);
  console.log(result.meetsRequirement ? '✅ 通過' : '❌ 失敗');
  
  return result;
}

// 執行所有測試
async function runAllTests() {
  console.log('========================================');
  console.log('開始執行所有測試');
  console.log('========================================\n');
  
  const results = [];
  
  try {
    results.push(await testTimelineDragSync());
  } catch (error) {
    console.error('測試 1 失敗:', error);
    results.push({ test: 'timeline-drag-sync', error: error.message });
  }
  
  console.log('\n');
  
  try {
    results.push(await testMarkerAnimation());
  } catch (error) {
    console.error('測試 2 失敗:', error);
    results.push({ test: 'marker-animation', error: error.message });
  }
  
  console.log('\n');
  
  try {
    results.push(await testTimeRangeSelection());
  } catch (error) {
    console.error('測試 3 失敗:', error);
    results.push({ test: 'time-range-selection', error: error.message });
  }
  
  console.log('\n');
  
  try {
    results.push(await testSyncPerformance());
  } catch (error) {
    console.error('測試 4 失敗:', error);
    results.push({ test: 'sync-performance', error: error.message });
  }
  
  console.log('\n========================================');
  console.log('測試完成');
  console.log('========================================');
  console.log('測試結果摘要:', results);
  
  return results;
}

// 導出函數（如果在 Node.js 環境中）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testTimelineDragSync,
    testMarkerAnimation,
    testTimeRangeSelection,
    testSyncPerformance,
    runAllTests
  };
}

