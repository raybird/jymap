import * as L from 'leaflet';

declare module 'leaflet' {
  interface PolylineDecoratorOptions {
    patterns: Array<{
      offset?: number | string;
      endOffset?: number | string;
      repeat: number | string;
      symbol: any;
    }>;
  }

  function polylineDecorator(
    paths: L.Polyline | L.Polyline[],
    options?: PolylineDecoratorOptions
  ): L.Layer;

  namespace Symbol {
    function arrowHead(options?: {
      pixelSize?: number;
      polygon?: boolean;
      pathOptions?: L.PathOptions;
    }): any;
    function dash(options?: any): any;
    function marker(options?: any): any;
  }
}

declare module 'leaflet-polylinedecorator';
