'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Users,
  MousePointerClick,
  Activity,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { TrackedEvent } from '@/types';

interface OverviewData {
  totalSessions: number;
  totalEvents: number;
  totalClicks: number;
  sessionsTrend: { date: string; sessions: number }[];
  eventsDistribution: { name: string; value: number }[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#6366f1'];

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch metrics from API
  const fetchOverviewData = async (showLoading = true) => {
    if (showLoading) {
      // Only set if not already true
      setLoading(true);
    }
    try {
      const response = await fetch('/api/overview');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard overview metrics.');
      }
      const result: OverviewData = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      const errorVal = err as Error;
      console.error(errorVal);
      setError(errorVal.message || 'Failed to connect to database.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();

    // Set up polling interval to refresh analytics every 5 seconds
    const interval = setInterval(() => {
      fetchOverviewData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Loading Skeleton View
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* KPI Cards Skeleton */}
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/60 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/60 bg-card/50">
            <CardHeader>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-3 w-56" />
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <Skeleton className="h-[260px] w-full" />
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/50">
            <CardHeader>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-3 w-56" />
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <Skeleton className="h-[200px] w-[200px] rounded-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error State View
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="p-3 rounded-full bg-destructive/10 text-destructive text-lg border border-destructive/20 font-mono">
          ⚠️ Connection Error
        </div>
        <h3 className="text-xl font-semibold">Failed to Load Dashboard Data</h3>
        <p className="text-muted-foreground max-w-md">
          Could not establish a connection to your MongoDB instance. Make sure MongoDB is running and MONGODB_URI is correctly defined in .env.local.
        </p>
        <button
          onClick={() => fetchOverviewData()}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty State View
  const isEmpty = !data || data.totalEvents === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-8"
    >


      {/* KPI Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1: Sessions */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="relative overflow-hidden border-border/60 bg-card/40 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sessions
              </CardTitle>
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-md">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {data?.totalSessions}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                <span>Unique browser sessions</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 2: Events */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="relative overflow-hidden border-border/60 bg-card/40 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Events
              </CardTitle>
              <div className="p-2 bg-purple-500/10 text-purple-500 rounded-md">
                <Activity className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {data?.totalEvents}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Real-time clicks & pageviews</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 3: Clicks */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="relative overflow-hidden border-border/60 bg-card/40 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Clicks
              </CardTitle>
              <div className="p-2 bg-pink-500/10 text-pink-500 rounded-md">
                <MousePointerClick className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {data?.totalClicks}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span>{data?.totalEvents ? Math.round(((data.totalClicks) / data.totalEvents) * 100) : 0}% click interaction rate</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {isEmpty ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border/80 rounded-xl bg-card/25 text-center space-y-5"
        >
          <div className="p-4 bg-muted/40 rounded-full text-muted-foreground">
            <Activity className="h-10 w-10 animate-bounce" />
          </div>
          <div className="max-w-sm space-y-2">
            <h3 className="text-lg font-semibold">No analytics data recorded yet</h3>
            <p className="text-sm text-muted-foreground">
              The database is currently empty. Visit the interactive demo page to trigger user events like clicks and page views.
            </p>
          </div>
          <Link
            href="/demo"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-all duration-200"
          >
            <span>Open Demo Site</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </motion.div>
      ) : (
        /* Charts Grid */
        <div className="grid gap-6 md:grid-cols-2">
          {/* Sessions Trend Area Chart */}
          <Card className="border-border/60 bg-card/45 backdrop-blur-sm shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Sessions Trend</CardTitle>
              <CardDescription>Daily browser sessions over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] pr-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data?.sessionsTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--foreground))',
                    }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    name="Sessions"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSessions)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Events Distribution Pie Chart */}
          <Card className="border-border/60 bg-card/45 backdrop-blur-sm shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Events Distribution</CardTitle>
              <CardDescription>Breakdown of event types triggered</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.eventsDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data?.eventsDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={10}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs font-medium text-muted-foreground capitalize">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
}
