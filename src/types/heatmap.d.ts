declare module 'heatmap.js' {
  export interface HeatmapConfig {
    container: HTMLElement;
    radius?: number;
    maxOpacity?: number;
    minOpacity?: number;
    blur?: number;
  }

  export interface HeatmapInstance {
    setData(data: {
      max: number;
      data: { x: number; y: number; value: number }[];
    }): void;
    addData(data: { x: number; y: number; value: number }): void;
  }

  const h337: {
    create(config: HeatmapConfig): HeatmapInstance;
  };

  export default h337;
}
