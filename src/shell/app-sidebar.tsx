// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

'use client';

import { useSyncExternalStore } from 'react';
import {
  AlertCircle,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Terminal,
} from 'lucide-react';
import { AnimatedBarChart } from '@/components/ui/animated-bar-chart';
import { useTheme } from 'next-themes';
import { plugins } from '@/features/registry';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Stable no-op subscribe for useSyncExternalStore (client vs server detection)
const emptySubscribe = () => () => {};

export interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onUserLogClick?: () => void;
  onProductLogClick?: () => void;
  userLogErrorCount?: number;
}

const SidebarButton = ({
  children,
  label,
  className: _className,
  collapsed,
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
  collapsed: boolean;
}) =>
  collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  ) : (
    <>{children}</>
  );

export function AppSidebar({
  activeSection,
  onSectionChange,
  collapsed,
  onToggleCollapse,
  onUserLogClick,
  onProductLogClick,
  userLogErrorCount = 0,
}: AppSidebarProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return (
    <aside
      className={cn(
        'relative z-50 flex flex-col border-r border-border bg-card text-card-foreground transition-[width] duration-200',
        collapsed ? 'w-14 min-w-14' : 'w-60 min-w-60'
      )}
    >
      <div
        className={cn(
          'flex h-14 items-center border-b border-border',
          collapsed ? 'justify-center px-1' : 'justify-between px-3'
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <AnimatedBarChart className="h-6 w-6 text-primary" />
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">PRanker</span>
                <Badge className="h-4 rounded px-1 py-0 text-[10px] font-medium leading-none">
                  beta
                </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground">v0.1.0</span>
            </div>
          </div>
        )}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Toggle theme"
              >
                {mounted && theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side={collapsed ? 'right' : 'bottom'}>
              Toggle theme
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleCollapse}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side={collapsed ? 'right' : 'bottom'}>
              {collapsed ? 'Expand' : 'Collapse'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {plugins.map((plugin) => {
          const Icon = plugin.icon;
          const isActive = activeSection === plugin.id;
          const btn = (
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
          return collapsed ? (
            <Tooltip key={plugin.id}>
              <TooltipTrigger asChild>{btn}</TooltipTrigger>
              <TooltipContent side="right">{plugin.name}</TooltipContent>
            </Tooltip>
          ) : (
            btn
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mb-12 flex flex-col gap-1 border-t border-border p-2">
          {onUserLogClick != null && (
            <SidebarButton label="User error logs" collapsed={collapsed}>
              <button
                onClick={onUserLogClick}
                className={cn(
                  'relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted',
                  collapsed ? 'justify-center px-2' : ''
                )}
                aria-label="User error logs"
              >
                <span className="relative">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  {userLogErrorCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-2 -top-2 h-4 min-w-4 px-1 text-[10px]"
                    >
                      {userLogErrorCount > 99 ? '99+' : userLogErrorCount}
                    </Badge>
                  )}
                </span>
                {!collapsed && (
                  <>
                    <span>User logs</span>
                    {userLogErrorCount > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {userLogErrorCount > 99 ? '99+' : userLogErrorCount}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            </SidebarButton>
          )}
          {onProductLogClick != null && (
            <SidebarButton label="Product error logs" collapsed={collapsed}>
              <button
                onClick={onProductLogClick}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted',
                  collapsed ? 'justify-center px-2' : ''
                )}
                aria-label="Product error logs"
              >
                <Terminal className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Product logs</span>}
              </button>
            </SidebarButton>
          )}
        </div>
      )}
    </aside>
  );
}
