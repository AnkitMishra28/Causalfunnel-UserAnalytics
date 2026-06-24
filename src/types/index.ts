export interface TrackedEvent {
  _id: string;
  sessionId: string;
  eventType: 'page_view' | 'click' | string;
  pageUrl: string;
  timestamp: string;
  clickX?: number | null;
  clickY?: number | null;
  userAgent?: string;
  screenWidth?: number;
  screenHeight?: number;
}

export interface SessionSummary {
  sessionId: string;
  eventCount: number;
  firstSeen: string;
  lastSeen: string;
}

export interface HeatmapPoint {
  x: number;
  y: number;
  value: number;
}
