// Type shim for leaflet - package is loaded via CDN/Vite alias at runtime
// This allows TypeScript to compile without leaflet in node_modules
declare module "leaflet" {
  interface MapOptions {
    center?: [number, number];
    zoom?: number;
    zoomControl?: boolean;
    attributionControl?: boolean;
    [key: string]: unknown;
  }
  interface TileLayerOptions {
    attribution?: string;
    subdomains?: string;
    maxZoom?: number;
    [key: string]: unknown;
  }
  interface CircleMarkerOptions {
    radius?: number;
    fillColor?: string;
    color?: string;
    weight?: number;
    opacity?: number;
    fillOpacity?: number;
    [key: string]: unknown;
  }
  interface Layer {
    addTo(map: Map): this;
    remove(): this;
    bindPopup(content: string, options?: unknown): this;
    on(event: string, fn: (...args: unknown[]) => void): this;
  }
  interface CircleMarker extends Layer {}
  interface TileLayer extends Layer {}
  interface Popup extends Layer {}
  interface Map {
    remove(): void;
    getContainer(): HTMLElement;
    setView(center: [number, number], zoom: number): this;
  }
  interface IconDefault {
    _getIconUrl?: unknown;
    mergeOptions(options: unknown): void;
    prototype: IconDefault;
  }
  const Icon: {
    Default: IconDefault;
  };
  function map(container: HTMLElement, options?: MapOptions): Map;
  function tileLayer(url: string, options?: TileLayerOptions): TileLayer;
  function circleMarker(
    latlng: [number, number],
    options?: CircleMarkerOptions,
  ): CircleMarker;
}

declare module "leaflet/dist/leaflet.css" {}
