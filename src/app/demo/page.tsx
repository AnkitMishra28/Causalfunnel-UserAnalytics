'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { TrackedEvent } from '@/types';
import {
  ArrowLeft,
  Terminal,
  MousePointerClick,
  Eye,
  Mail,
  Send,
  RotateCcw,
  Zap,
  Layout,
  Database,
  BarChart,
} from 'lucide-react';

interface LocalLog {
  id: string;
  eventType: string;
  pageUrl: string;
  clickX?: number | null;
  clickY?: number | null;
  timestamp: string;
}

export default function DemoPage() {
  const [localLogs, setLocalLogs] = useState<LocalLog[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Load local session id from localStorage
  useEffect(() => {
    const checkSession = () => {
      const sessionId = localStorage.getItem('cf_session_id');
      if (sessionId) {
        setCurrentSessionId(sessionId);
      }
    };
    
    // Check immediately and also set up listener for storage updates
    checkSession();
    const interval = setInterval(checkSession, 500);
    return () => clearInterval(interval);
  }, []);

  const fetchLocalLogs = async (sessionId: string) => {
    if (!sessionId) return;
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch local logs');
      const data: TrackedEvent[] = await response.json();
      const mappedLogs: LocalLog[] = data.map((event) => ({
        id: event._id || Math.random().toString(),
        eventType: event.eventType,
        pageUrl: event.pageUrl,
        clickX: event.clickX,
        clickY: event.clickY,
        timestamp: event.timestamp,
      }));
      // Sort desc by timestamp so newest are first, limit to 15
      const sortedLogs = [...mappedLogs].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 15);
      setLocalLogs(sortedLogs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!currentSessionId) return;

    fetchLocalLogs(currentSessionId);

    const interval = setInterval(() => {
      fetchLocalLogs(currentSessionId);
    }, 3000); // 3 seconds for a responsive feel in demo console logs

    return () => clearInterval(interval);
  }, [currentSessionId]);

  // Handle manual session reset
  const handleResetSession = () => {
    localStorage.removeItem('cf_session_id');
    setLocalLogs([]);
    window.location.reload();
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setSubscribed(true);
    setEmailInput('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none relative">
      {/* Attach tracking script */}
      <Script src="/tracker.js" strategy="afterInteractive" />

      {/* Floating Demo Banner Control Header */}
      <div className="sticky top-0 z-40 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-800/80 px-2.5 py-1.5 rounded border border-zinc-700 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-zinc-800" />
          <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            Live Tracking Demo Website
          </span>
        </div>

        <div className="flex items-center gap-2">
          {currentSessionId && (
            <span className="hidden sm:inline font-mono text-[10px] text-zinc-400 bg-zinc-950 px-2 py-1 rounded border border-zinc-800/80">
              Session: <strong className="text-zinc-200">{currentSessionId}</strong>
            </span>
          )}
          <button
            onClick={handleResetSession}
            className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-300 hover:text-white bg-zinc-800 px-2 py-1.5 rounded border border-zinc-700 hover:bg-zinc-700/80 transition-colors"
            title="Reset Session Cookie"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Session</span>
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Side: Mock SaaS Website Layout (CausalFlow) */}
        <div className="lg:col-span-8 overflow-y-auto px-6 py-12 md:px-12 space-y-16">
          {/* Mock SaaS Navbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-base tracking-tight">
              <Zap className="h-5 w-5 text-emerald-500 fill-emerald-500" />
              <span>CausalFlow</span>
            </div>
            <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-zinc-400">
              <button onClick={() => {}} className="hover:text-zinc-100 transition-colors cursor-pointer">Features</button>
              <button onClick={() => {}} className="hover:text-zinc-100 transition-colors cursor-pointer">Integrations</button>
              <button onClick={() => {}} className="hover:text-zinc-100 transition-colors cursor-pointer">Pricing</button>
            </div>
            <button
              onClick={() => {}}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black rounded transition-all duration-200"
            >
              Sign In
            </button>
          </div>

          {/* Hero Section */}
          <div className="space-y-6 text-center sm:text-left max-w-2xl py-6">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1]"
            >
              Automate user funnels <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                with simple logic
              </span>
            </motion.h1>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              CausalFlow tracks customer triggers in real time, executing automated pathways to convert, engage, and retain users dynamically without coding.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {}}
                className="px-6 py-3 text-sm font-bold bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg shadow transition-all active:scale-[0.98]"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => {}}
                className="px-6 py-3 text-sm font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-800 transition-all active:scale-[0.98]"
              >
                Watch 2-Min Demo
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold">Built for Growth Teams</h2>
              <p className="text-xs text-zinc-400">Click any card to check analytics tracker interaction</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => {}}
                className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all cursor-pointer space-y-3 group"
              >
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg w-fit group-hover:bg-emerald-500/20 transition-all">
                  <Layout className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold">Visual Editor</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">Drag-and-drop workflows in our intuitive dashboard layout.</p>
              </div>

              <div
                onClick={() => {}}
                className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all cursor-pointer space-y-3 group"
              >
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg w-fit group-hover:bg-blue-500/20 transition-all">
                  <Database className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold">Edge Warehouses</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">Stream user event records directly into data centers globally.</p>
              </div>

              <div
                onClick={() => {}}
                className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all cursor-pointer space-y-3 group"
              >
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg w-fit group-hover:bg-purple-500/20 transition-all">
                  <BarChart className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold">Predictive KPIs</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">Forecast conversion trends before funnels complete lifecycle.</p>
              </div>
            </div>
          </div>

          {/* Fictional Pricing Controls Toggle */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Select Billing Frequency</h3>
                <p className="text-xs text-zinc-400">Adjust toggle to test clicks and state update tracking</p>
              </div>
              <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
                <button
                  onClick={() => setPricingPeriod('monthly')}
                  className={`px-3 py-1 text-xs font-semibold rounded ${
                    pricingPeriod === 'monthly' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setPricingPeriod('yearly')}
                  className={`px-3 py-1 text-xs font-semibold rounded ${
                    pricingPeriod === 'yearly' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Yearly (Save 20%)
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800/80 rounded-lg">
              <div>
                <span className="text-xs font-bold text-zinc-300">Developer Plan</span>
                <p className="text-[10px] text-zinc-500">Perfect for sandbox testing and integrations</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-white">
                  {pricingPeriod === 'monthly' ? '$29' : '$23'}
                </span>
                <span className="text-[10px] text-zinc-500">/mo</span>
              </div>
            </div>
          </div>

          {/* Form Newsletter Section */}
          <div className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-xl space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-emerald-500" />
                Subscribe to CausalFlow newsletter
              </h3>
              <p className="text-xs text-zinc-400">Test click analytics validation in forms.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your email address..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-zinc-700 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Subscribe</span>
                <Send className="h-3 w-3" />
              </button>
            </form>
            <AnimatePresence>
              {subscribed && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-emerald-400 font-semibold"
                >
                  ✓ Thanks for subscribing! Click recorded successfully.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: DevConsole: Live Tracker Logs Terminal */}
        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-900/60 flex flex-col h-[400px] lg:h-full">
          {/* Console Header */}
          <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-xs text-zinc-300">
              <Terminal className="h-4 w-4 text-emerald-500" />
              <span>DevConsole: Live Tracker Logs</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              Session Filter active
            </span>
          </div>

          {/* Console Stream output */}
          <div className="flex-1 p-4 font-mono text-[10px] overflow-y-auto space-y-3 scrollbar-thin bg-black/40">
            {localLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
                <Terminal className="h-6 w-6 animate-pulse" />
                <p>Waiting for clicks or page views...</p>
                <p className="text-[9px] text-zinc-600 max-w-[180px]">
                  Click anywhere on the left panel to trigger and record events.
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {localLogs.map((log) => {
                  const isPageView = log.eventType === 'page_view';
                  const dateStr = new Date(log.timestamp).toLocaleTimeString();
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-2 rounded bg-zinc-900 border border-zinc-800/80 space-y-1 hover:border-zinc-700/80 transition-colors"
                    >
                      <div className="flex justify-between items-center text-[9px]">
                        <span
                          className={`font-bold flex items-center gap-1 ${
                            isPageView ? 'text-blue-400' : 'text-pink-400'
                          }`}
                        >
                          {isPageView ? (
                            <Eye className="h-2.5 w-2.5" />
                          ) : (
                            <MousePointerClick className="h-2.5 w-2.5" />
                          )}
                          {log.eventType.toUpperCase()}
                        </span>
                        <span className="text-zinc-500">{dateStr}</span>
                      </div>
                      
                      <div className="text-zinc-300 truncate font-mono text-[9px] select-all">
                        {log.pageUrl.replace(window.location.origin, '') || '/'}
                      </div>

                      {!isPageView && log.clickX != null && (
                        <div className="text-zinc-500 text-[8px]">
                          coords: X: <strong className="text-zinc-300">{log.clickX}</strong>, Y:{' '}
                          <strong className="text-zinc-300">{log.clickY}</strong>
                        </div>
                      )}
                      
                      <div className="text-[8px] text-zinc-500 flex items-center gap-1 pt-0.5">
                        <span className="h-1 w-1 rounded-full bg-emerald-500" />
                        <span>POST /api/events 201 Created</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
