'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '@/components/SocketProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, MousePointerClick, RefreshCw } from 'lucide-react';
import { HeatmapPoint, TrackedEvent } from '@/types';
import { HeatmapInstance } from 'heatmap.js';

export default function HeatmapPage() {
  const { socket } = useSocket();
  const [pages, setPages] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [points, setPoints] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [viewMode, setViewMode] = useState<'heatmap' | 'dots' | 'combined'>('combined');
  
  const heatmapInstanceRef = useRef<HeatmapInstance | null>(null);
  const heatmapContainerRef = useRef<HTMLDivElement>(null);

  // Fetch unique pages
  const fetchPages = async (autoSelect = true) => {
    setLoading(true);
    try {
      const response = await fetch('/api/heatmap?distinct=true');
      if (!response.ok) throw new Error('Failed to fetch distinct pages');
      const data: string[] = await response.json();
      
      // Default to /demo if not tracked yet so user has something to see
      const defaultDemoUrl = window.location.origin + '/demo';
      const updatedPages = data.includes(defaultDemoUrl) 
        ? data 
        : [defaultDemoUrl, ...data];

      setPages(updatedPages);
      
      if (autoSelect && updatedPages.length > 0) {
        setSelectedPage(updatedPages[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch points for selected page
  const fetchPoints = async (pageUrl: string | null) => {
    if (!pageUrl) return;
    setLoadingPoints(true);
    try {
      const encodedUrl = encodeURIComponent(pageUrl);
      const response = await fetch(`/api/heatmap?pageUrl=${encodedUrl}`);
      if (!response.ok) throw new Error('Failed to fetch heatmap points');
      const data: HeatmapPoint[] = await response.json();
      setPoints(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPoints(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPages();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selectedPage) {
      const timer = setTimeout(() => {
        fetchPoints(selectedPage);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedPage]);

  // Initialize and update heatmap.js instance
  useEffect(() => {
    const container = heatmapContainerRef.current;
    if (loadingPoints || !container) return;

    // Clear previous canvas elements inside container
    container.innerHTML = '';
    heatmapInstanceRef.current = null;

    if (viewMode === 'dots') return; // Do not load heatmap.js in pure dots mode

    const initHeatmap = async () => {
      try {
        const h337 = (await import('heatmap.js')).default;
        
        const config = {
          container: container,
          radius: 35,
          maxOpacity: 0.6,
          minOpacity: 0.05,
          blur: 0.85,
        };

        const heatmapInstance = h337.create(config);
        heatmapInstanceRef.current = heatmapInstance;

        // Set initial dataset
        if (points.length > 0) {
          heatmapInstance.setData({
            max: Math.max(...points.map(p => p.value), 5),
            data: points
          });
        }
      } catch (err) {
        console.error('Failed to load heatmap.js dynamically:', err);
      }
    };

    initHeatmap();
  }, [points, viewMode, loadingPoints]);

  // Real-time socket event updates
  useEffect(() => {
    if (!socket || !selectedPage) return;

    const handleNewEvent = (event: TrackedEvent) => {
      // Check if event is a click and matches the current selected page URL
      if (event.eventType === 'click' && event.pageUrl === selectedPage && event.clickX != null && event.clickY != null) {
        const newPoint: HeatmapPoint = {
          x: event.clickX,
          y: event.clickY,
          value: 1
        };

        // Add to React state dots list
        setPoints((prev) => [...prev, newPoint]);

        // Add directly to active heatmap.js canvas if initialized
        if (heatmapInstanceRef.current && viewMode !== 'dots') {
          heatmapInstanceRef.current.addData({
            x: event.clickX,
            y: event.clickY,
            value: 1
          });
        }
      }
    };

    socket.on('new_event', handleNewEvent);

    return () => {
      socket.off('new_event', handleNewEvent);
    };
  }, [socket, selectedPage, viewMode]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Settings & Select Page Toolbar */}
      <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-md">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full md:w-auto">
            {/* Page selection dropdown */}
            <div className="flex-1 sm:w-72">
              <label className="text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wide block mb-1">
                Select Tracked Page URL
              </label>
              {loading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedPage || ''} onValueChange={(val) => val && setSelectedPage(val)}>
                  <SelectTrigger className="bg-background/60 border-border/80">
                    <SelectValue placeholder="Select a page..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map((page) => (
                      <SelectItem key={page} value={page}>
                        {page.replace(window.location.origin, '') || '/'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* View mode buttons */}
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wide block mb-1">
                Visualization Overlay
              </label>
              <div className="inline-flex rounded-md shadow-sm border border-border/80 bg-background/50 p-1 gap-1">
                {(['heatmap', 'dots', 'combined'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded capitalize transition-all duration-200 ${
                      viewMode === mode
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => fetchPages(false)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-border bg-card/60 hover:bg-accent text-foreground transition-all duration-200"
              title="Refresh Pages List"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Visual Heatmap Canvas Container */}
      <Card className="border-border/60 bg-card/30 shadow-lg overflow-hidden relative">
        <CardHeader className="border-b border-border/50 bg-card/20 p-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Eye className="h-4.5 w-4.5 text-primary" />
                <span>Click Distribution Preview</span>
              </CardTitle>
              <CardDescription className="text-xs truncate max-w-sm sm:max-w-md">
                Tracking URL: {selectedPage || 'None'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-accent/30 px-2 py-1 rounded border border-border/40">
              <MousePointerClick className="h-3.5 w-3.5 text-primary" />
              <span>Clicks: <strong className="text-foreground">{points.length}</strong></span>
            </div>
          </div>
        </CardHeader>

        {!selectedPage ? (
          <div className="h-[400px] flex flex-col items-center justify-center space-y-4 p-8 text-center bg-card/10">
            <div className="rounded-full bg-muted/30 p-4 border border-border/40">
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="max-w-[400px] space-y-2">
              <h3 className="text-lg font-semibold tracking-tight">No Page Selected</h3>
              <p className="text-sm text-muted-foreground">
                Please select a tracked page from the dropdown menu above to visualize its user clicks and heatmaps.
              </p>
            </div>
          </div>
        ) : loadingPoints ? (
          <div className="h-[500px] flex flex-col items-center justify-center space-y-4">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading click locations...</span>
          </div>
        ) : (
          <div className="w-full overflow-auto max-h-[700px] bg-muted/10 relative p-4 scrollbar-thin">
            {/* Centered container with fixed canvas dimensions (matches standard desktop grid) */}
            <div className="mx-auto relative border border-border/80 rounded-lg shadow bg-white dark:bg-zinc-950 overflow-hidden" style={{ width: '1200px', height: '1000px' }}>
              
              {/* Background site representation */}
              {selectedPage && (
                <iframe
                  src={selectedPage}
                  className="absolute inset-0 w-full h-full border-0 pointer-events-none select-none opacity-90 dark:opacity-75"
                  style={{ width: '1200px', height: '1000px' }}
                  title="Page Heatmap Background"
                />
              )}

              {/* Cover mask in dark mode to improve preview contrast */}
              <div className="absolute inset-0 bg-transparent dark:bg-black/35 pointer-events-none z-5" />

              {/* heatmap.js Density Canvas Container */}
              <div
                ref={heatmapContainerRef}
                className="absolute inset-0 z-10 pointer-events-none"
                style={{ width: '1200px', height: '1000px' }}
              />

              {/* Custom SVG dots overlay */}
              {(viewMode === 'dots' || viewMode === 'combined') && (
                <svg
                  className="absolute inset-0 z-20 pointer-events-none w-full h-full"
                  style={{ width: '1200px', height: '1000px' }}
                >
                  {points.map((pt, idx) => (
                    <g key={idx}>
                      {/* Pulse ring for dot */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="8"
                        fill="rgba(236,72,153,0.15)"
                        className="animate-ping"
                        style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                      />
                      {/* Solid marker center */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="4"
                        fill="#ec4899"
                        stroke="#ffffff"
                        strokeWidth="1"
                        className="drop-shadow-sm shadow-black"
                      />
                    </g>
                  ))}
                </svg>
              )}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
