// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

'use client';

import { useEffect, useState } from 'react';
import { AppSidebar } from '@/shell/app-sidebar';
import { ProductLogPanel } from '@/shell/product-log-panel';
import { UserLogPanel } from '@/shell/user-log-panel';
import { plugins } from '@/features/registry';

const USER_LOG_POLL_MS = 30_000;
const TOKEN_KEY = 'pranker_admin_token';

export function AppShell() {
  const [activeSection, setActiveSection] = useState(plugins[0]?.id ?? '');
  const [collapsed, setCollapsed] = useState(false);
  const [userLogPanelOpen, setUserLogPanelOpen] = useState(false);
  const [productLogPanelOpen, setProductLogPanelOpen] = useState(false);
  const [userLogErrorCount, setUserLogErrorCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const token = sessionStorage.getItem(TOKEN_KEY);
        const headers: HeadersInit | undefined = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;
        const res = await fetch('/api/logs/user', { headers });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setUserLogErrorCount(data.total ?? 0);
        }
      } catch {
        // ignore
      }
    };
    const t = setTimeout(poll, 0);
    const id = setInterval(poll, USER_LOG_POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        setUserLogPanelOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const activePlugin = plugins.find((p) => p.id === activeSection);
  const ActiveComponent = activePlugin?.component;

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onUserLogClick={() => setUserLogPanelOpen((o) => !o)}
        onProductLogClick={() => setProductLogPanelOpen((o) => !o)}
        userLogErrorCount={userLogErrorCount}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <main className="flex-1 overflow-auto bg-background p-4">
          {ActiveComponent ? <ActiveComponent /> : null}
        </main>
        <div className="flex shrink-0 flex-col border-t border-border bg-card">
          {userLogPanelOpen && (
            <UserLogPanel
              open={userLogPanelOpen}
              onClose={() => setUserLogPanelOpen(false)}
              onLogCountChange={setUserLogErrorCount}
            />
          )}
          {productLogPanelOpen && (
            <ProductLogPanel
              open={productLogPanelOpen}
              onClose={() => setProductLogPanelOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
