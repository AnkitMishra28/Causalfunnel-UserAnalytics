'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/components/SocketProvider';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  ArrowUpDown,
  Clock,
  Activity,
  Eye,
  MousePointer,
  Monitor,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Copy,
  Check,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { SessionSummary, TrackedEvent } from '@/types';

type SortField = 'lastSeen' | 'firstSeen' | 'eventCount';
type SortOrder = 'asc' | 'desc';

export default function SessionsPage() {
  const { socket } = useSocket();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastSeen');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Selected session for Journey Timeline Dialog
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [journeyEvents, setJourneyEvents] = useState<TrackedEvent[]>([]);
  const [loadingJourney, setLoadingJourney] = useState(false);

  const itemsPerPage = 10;

  // Fetch Session summaries
  const fetchSessions = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch('/api/sessions');
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      const data = await response.json();
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSessions();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Fetch timeline events for a specific session when dialog opens
  useEffect(() => {
    if (!selectedSessionId) return;

    let active = true;
    const fetchJourney = async () => {
      setLoadingJourney(true);
      try {
        const response = await fetch(`/api/sessions/${selectedSessionId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch session journey');
        }
        const data = await response.json();
        if (active) setJourneyEvents(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoadingJourney(false);
      }
    };

    fetchJourney();
    return () => {
      active = false;
    };
  }, [selectedSessionId]);

  // Real-time socket updates for session aggregation
  useEffect(() => {
    if (!socket) return;

    const handleNewEvent = (event: TrackedEvent) => {
      setSessions((prev) => {
        const existingSessionIndex = prev.findIndex((s) => s.sessionId === event.sessionId);

        if (existingSessionIndex >= 0) {
          // Update existing session
          const updated = [...prev];
          const current = updated[existingSessionIndex];
          updated[existingSessionIndex] = {
            ...current,
            eventCount: current.eventCount + 1,
            lastSeen: event.timestamp,
          };
          return updated;
        } else {
          // Prepend new session
          return [
            {
              sessionId: event.sessionId,
              eventCount: 1,
              firstSeen: event.timestamp,
              lastSeen: event.timestamp,
            },
            ...prev,
          ];
        }
      });

      // If the currently open dialog session receives a live event, append it to timeline
      if (selectedSessionId === event.sessionId) {
        setJourneyEvents((prev) => [...prev, event]);
      }
    };

    socket.on('new_event', handleNewEvent);

    return () => {
      socket.off('new_event', handleNewEvent);
    };
  }, [socket, selectedSessionId]);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening dialog on copy click
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Filter & Sort Sessions
  const filteredSessions = sessions.filter((s) =>
    s.sessionId.toLowerCase().includes(search.toLowerCase())
  );

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'eventCount') {
      comparison = a.eventCount - b.eventCount;
    } else {
      const dateA = new Date(a[sortField]).getTime();
      const dateB = new Date(b[sortField]).getTime();
      comparison = dateA - dateB;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Paginated Sessions
  const totalPages = Math.ceil(sortedSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSessions = sortedSessions.slice(startIndex, startIndex + itemsPerPage);

  const getSystemDetails = () => {
    if (journeyEvents.length === 0) return null;
    const firstEvent = journeyEvents[0];
    return {
      userAgent: firstEvent.userAgent || 'Unknown User Agent',
      resolution: firstEvent.screenWidth && firstEvent.screenHeight 
        ? `${firstEvent.screenWidth}x${firstEvent.screenHeight}` 
        : 'Unknown Resolution',
    };
  };

  const details = getSystemDetails();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/20 border border-border/60 p-4 rounded-xl backdrop-blur-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Session ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 bg-background/50 border-border/80"
          />
        </div>

        <div className="text-xs text-muted-foreground w-full sm:w-auto text-left sm:text-right">
          Showing <span className="font-semibold text-foreground">{sortedSessions.length}</span> active sessions
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-border/60 rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm shadow-md">
        {loading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : paginatedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
            <User className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-base font-semibold">No Sessions Found</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {search ? 'Try adjusting your search criteria.' : 'Start tracking events to see active sessions here.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[30%]">Session ID</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => handleSort('eventCount')}
                >
                  <div className="flex items-center gap-1.5">
                    Events Tracked
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => handleSort('firstSeen')}
                >
                  <div className="flex items-center gap-1.5">
                    First Seen
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => handleSort('lastSeen')}
                >
                  <div className="flex items-center gap-1.5">
                    Last Active
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSessions.map((session) => (
                <TableRow
                  key={session.sessionId}
                  onClick={() => setSelectedSessionId(session.sessionId)}
                  className="cursor-pointer hover:bg-accent/40 active:bg-accent/60 transition-all duration-150 group"
                >
                  <TableCell className="font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[150px] md:max-w-none text-foreground font-semibold group-hover:text-primary transition-colors">
                        {session.sessionId}
                      </span>
                      <button
                        onClick={(e) => handleCopy(session.sessionId, e)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200"
                        title="Copy Session ID"
                      >
                        {copiedId === session.sessionId ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                      {session.eventCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(session.firstSeen), 'MMM d, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="font-medium text-foreground">
                      {formatDistanceToNow(new Date(session.lastSeen), { addSuffix: true })}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-card/50 hover:bg-accent disabled:opacity-40 disabled:hover:bg-card/50 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <span className="text-xs text-muted-foreground font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-card/50 hover:bg-accent disabled:opacity-40 disabled:hover:bg-card/50 transition-colors"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Journey Timeline Dialog */}
      <Dialog
        open={selectedSessionId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSessionId(null);
            setJourneyEvents([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col bg-card/95 border-border shadow-2xl backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary animate-pulse" />
              <span>User Journey Timeline</span>
            </DialogTitle>
            <DialogDescription className="font-mono text-xs truncate">
              Session: {selectedSessionId}
            </DialogDescription>
          </DialogHeader>

          {/* User Environment Meta */}
          {details && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-accent/25 border border-border/50 rounded-lg text-xs mb-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Monitor className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold text-foreground">Screen Size:</span>
                <span>{details.resolution}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground truncate" title={details.userAgent}>
                <Activity className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold text-foreground">Browser/OS:</span>
                <span className="truncate">{details.userAgent.split(' ')[0]} ({details.userAgent.includes('Windows') ? 'Windows' : details.userAgent.includes('Mac') ? 'macOS' : 'Linux'})</span>
              </div>
            </div>
          )}

          {/* Timeline Stream */}
          <div className="flex-1 overflow-y-auto pr-2 min-h-[300px] max-h-[50vh]">
            {loadingJourney ? (
              <div className="space-y-6 pl-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 items-start relative">
                    <Skeleton className="absolute -left-5 h-4 w-4 rounded-full" />
                    <div className="space-y-2 flex-1 pl-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : journeyEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Activity className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-semibold">No actions tracked in this session.</p>
              </div>
            ) : (
              <div className="relative border-l border-border pl-6 ml-3 space-y-6 py-2">
                <AnimatePresence initial={false}>
                  {journeyEvents.map((event, index) => {
                    const isPageView = event.eventType === 'page_view';
                    const isClick = event.eventType === 'click';

                    return (
                      <motion.div
                        key={event._id || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                        className="relative"
                      >
                        {/* Timeline Node Point Icon */}
                        <div
                          className={`absolute -left-[35px] top-1 p-1 rounded-full border shadow-sm ${
                            isPageView
                              ? 'bg-blue-500 text-white border-blue-600'
                              : isClick
                              ? 'bg-pink-500 text-white border-pink-600'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {isPageView ? (
                            <Eye className="h-3 w-3" />
                          ) : isClick ? (
                            <MousePointer className="h-3 w-3" />
                          ) : (
                            <Activity className="h-3 w-3" />
                          )}
                        </div>

                        {/* Timeline Content Block */}
                        <Card className="border-border/60 bg-card/60 shadow-sm">
                          <CardContent className="p-3 space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                                {isPageView ? 'Page View' : isClick ? 'Click Interaction' : event.eventType}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                                <Calendar className="h-2.5 w-2.5" />
                                {format(new Date(event.timestamp), 'HH:mm:ss.SSS')}
                              </span>
                            </div>
                            
                            <p className="text-xs font-mono font-medium text-foreground bg-accent/30 p-1.5 rounded border border-border/40 select-all overflow-x-auto whitespace-pre-wrap break-all">
                              {event.pageUrl}
                            </p>

                            {isClick && (
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono bg-pink-500/5 px-2 py-1 rounded border border-pink-500/10 w-fit">
                                <MousePointer className="h-3 w-3 text-pink-500" />
                                <span>Coordinates: X: <strong className="text-foreground">{event.clickX}</strong>, Y: <strong className="text-foreground">{event.clickY}</strong></span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
