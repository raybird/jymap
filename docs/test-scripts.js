// 測試腳本集合 - 用於 chrome-mcp-server chrome_inject_script

// 測試 1: 時間軸拖曳與地圖同步
const testTimelineDragSync = `
(async () => {
  const timelineContainer = document.querySelector('app-timeline-container .timeline-container');
  if (!timelineContainer) return { error: 'Timeline container not found' };
  
  const rect = timelineContainer.getBoundingClientRect();
  const startX = rect.left + 100;
  const startY = rect.top + 50;
  const endX = rect.left + 500;
  const endY = rect.top + 50;
  
  const initialScroll = timelineContainer.scrollLeft;
  const initialMarkerCount = document.querySelectorAll('app-map-container .leaflet-marker-pane > div').length;
  const startTime = performance.now();
  
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
  
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const endTime = performance.now();
  const afterScroll = timelineContainer.scrollLeft;
  const afterMarkerCount = document.querySelectorAll('app-map-container .leaflet-marker-pane > div').length;
  
  return {
    test: 'timeline-drag-sync',
    initialScroll,
    afterScroll,
    scrollWorked: afterScroll !== initialScroll,
    initialMarkerCount,
    afterMarkerCount,
    syncTime: (endTime - startTime).toFixed(2) + 'ms',
    meetsRequirement: (endTime - startTime) < 200
  };
})();
`;

// 測試 2: 標記淡入淡出動畫
const testMarkerAnimation = `
(async () => {
  const timelineContainer = document.querySelector('app-timeline-container .timeline-container');
  const markers = document.querySelectorAll('app-map-container .leaflet-marker-pane > div');
  
  if (!timelineContainer || markers.length === 0) {
    return { error: 'Timeline or markers not found' };
  }
  
  const initialOpacities = Array.from(markers).map(m => 
    parseFloat(window.getComputedStyle(m).opacity)
  );
  
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
        
        resolve({
          test: 'marker-animation',
          animationDuration: duration.toFixed(2) + 'ms',
          frameCount,
          fps: fps.toFixed(2),
          meetsDurationRequirement: duration < 200,
          meetsFPSRequirement: fps >= 30,
          initialOpacities,
          finalOpacities: currentOpacities
        });
      }
    };
    
    requestAnimationFrame(observeAnimation);
    setTimeout(() => {
      if (frameCount < 30) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        const fps = (frameCount / duration) * 1000;
        resolve({
          test: 'marker-animation',
          animationDuration: duration.toFixed(2) + 'ms',
          frameCount,
          fps: fps.toFixed(2),
          meetsDurationRequirement: duration < 200,
          meetsFPSRequirement: fps >= 30,
          initialOpacities,
          finalOpacities: Array.from(markers).map(m => 
            parseFloat(window.getComputedStyle(m).opacity)
          )
        });
      }
    }, 300);
  });
})();
`;

// 測試 3: 時間範圍選擇與地圖過濾
const testTimeRangeSelection = `
(async () => {
  const timelineTrack = document.querySelector('app-timeline-container .timeline-track');
  const timelineContainer = document.querySelector('app-timeline-container .timeline-container');
  
  if (!timelineTrack || !timelineContainer) {
    return { error: 'Timeline elements not found' };
  }
  
  const rect = timelineTrack.getBoundingClientRect();
  const startX = rect.left + 200;
  const startY = rect.top + 50;
  const endX = rect.left + 600;
  const endY = rect.top + 50;
  
  const initialMarkerCount = document.querySelectorAll('app-map-container .leaflet-marker-pane > div').length;
  
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
  
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const timeSelection = document.querySelector('app-timeline-container .time-selection');
  const afterMarkerCount = document.querySelectorAll('app-map-container .leaflet-marker-pane > div').length;
  
  return {
    test: 'time-range-selection',
    timeSelectionVisible: !!timeSelection,
    timeSelectionText: timeSelection?.textContent || null,
    initialMarkerCount,
    afterMarkerCount,
    markersFiltered: afterMarkerCount !== initialMarkerCount
  };
})();
`;

// 測試 4: 效能測試 - 同步延遲
const testSyncPerformance = `
(async () => {
  const timelineContainer = document.querySelector('app-timeline-container .timeline-container');
  if (!timelineContainer) return { error: 'Timeline container not found' };
  
  performance.mark('sync-start');
  
  const initialScroll = timelineContainer.scrollLeft;
  timelineContainer.scrollLeft = 2000;
  
  const rect = timelineContainer.getBoundingClientRect();
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
  return {
    test: 'sync-performance',
    syncDuration: measure ? measure.duration.toFixed(2) + 'ms' : 'N/A',
    meetsRequirement: measure ? measure.duration < 200 : false,
    initialScroll,
    afterScroll: timelineContainer.scrollLeft
  };
})();
`;

// 導出測試腳本
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testTimelineDragSync,
    testMarkerAnimation,
    testTimeRangeSelection,
    testSyncPerformance
  };
}

