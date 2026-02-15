// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

'use client';

import { useState } from 'react';
import { AppSidebar } from '@/shell/app-sidebar';
import { plugins } from '@/features/registry';

export function AppShell() {
  const [activeSection, setActiveSection] = useState(plugins[0]?.id ?? '');
  const [collapsed, setCollapsed] = useState(false);

  const activePlugin = plugins.find((p) => p.id === activeSection);
  const ActiveComponent = activePlugin?.component;

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      <main className="flex-1 overflow-auto bg-background">
        {ActiveComponent ? <ActiveComponent /> : null}
      </main>
    </div>
  );
}
