'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import {
  LayoutDashboard,
  Users,
  Flame,
  Globe,
  Sun,
  Moon,
  Menu,
  X,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If we are on the demo page, render without sidebar layout
  if (pathname === '/demo') {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Sessions', href: '/sessions', icon: Users },
    { name: 'Heatmap', href: '/heatmap', icon: Flame },
    { name: 'Demo Website', href: '/demo', icon: Globe },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border bg-card/30 backdrop-blur-sm">
        {/* Brand Header */}
        <div className="flex h-16 items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="h-6 w-6 rounded bg-primary flex items-center justify-center text-white text-xs font-black">
              CF
            </span>
            <span>CausalAnalytics</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-4 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:bg-accent/50 hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground border-l-2 border-primary pl-[10px]'
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer controls */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
          >
            <span className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground/60 px-1.5 py-0.5 rounded border border-border bg-card">
              Tab
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Burger Menu & Header */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/10 backdrop-blur-md px-6 md:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-md hover:bg-accent text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold capitalize">
              {pathname === '/'
                ? 'Overview Dashboard'
                : pathname.substring(1).replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme switcher on header for mobile */}
            <button
              onClick={toggleTheme}
              className="md:hidden p-2 rounded-md hover:bg-accent text-foreground"
            >
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-background/50 relative">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative flex w-full max-w-xs flex-col bg-card border-r border-border p-6 shadow-2xl animate-in slide-in-from-left duration-250">
            {/* Close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-md hover:bg-accent text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Brand Header */}
            <div className="mb-8 flex items-center gap-2 font-bold text-lg">
              <span className="h-6 w-6 rounded bg-primary flex items-center justify-center text-white text-xs font-black">
                CF
              </span>
              <span>CausalAnalytics</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200',
                      isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Footer */}
            <div className="mt-auto border-t border-border pt-4 space-y-3">
              <button
                onClick={() => {
                  toggleTheme();
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent"
              >
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                Toggle Dark/Light
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
