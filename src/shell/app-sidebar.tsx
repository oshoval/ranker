// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

'use client';

import {
  BarChart2,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { plugins } from '@/features/registry';
import { cn } from '@/lib/utils';

export interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function AppSidebar({
  activeSection,
  onSectionChange,
  collapsed,
  onToggleCollapse,
}: AppSidebarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-card text-card-foreground transition-[width] duration-200',
        collapsed ? 'w-14 min-w-14' : 'w-60 min-w-60'
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-3">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            <span className="font-semibold">PRanker</span>
          </div>
        )}
        {collapsed && (
          <div className="flex flex-1 justify-center">
            <BarChart2 className="h-6 w-6 text-primary" />
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {plugins.map((plugin) => {
          const Icon = plugin.icon;
          const isActive = activeSection === plugin.id;
          return (
            <button
              key={plugin.id}
              onClick={() => onSectionChange(plugin.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                isActive
                  ? 'border-l-2 border-primary bg-muted font-medium'
                  : 'border-l-2 border-transparent hover:bg-muted/50',
                collapsed ? 'justify-center px-2' : ''
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{plugin.name}</span>}
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-border p-2">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted',
            collapsed ? 'justify-center px-2' : ''
          )}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 shrink-0" />
          ) : (
            <Moon className="h-5 w-5 shrink-0" />
          )}
          {!collapsed && <span>Toggle theme</span>}
        </button>
        <button
          onClick={onToggleCollapse}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted',
            collapsed ? 'justify-center px-2' : ''
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5 shrink-0" />
          ) : (
            <PanelLeftClose className="h-5 w-5 shrink-0" />
          )}
          {!collapsed && <span>{collapsed ? 'Expand' : 'Collapse'}</span>}
        </button>
      </div>
    </aside>
  );
}
