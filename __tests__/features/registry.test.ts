// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { plugins } from '@/features/registry';

describe('registry', () => {
  it('exports non-empty array', () => {
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBeGreaterThan(0);
  });

  it('each plugin has id, name, description, icon, component', () => {
    for (const plugin of plugins) {
      expect(plugin).toHaveProperty('id');
      expect(typeof plugin.id).toBe('string');
      expect(plugin.id.length).toBeGreaterThan(0);

      expect(plugin).toHaveProperty('name');
      expect(typeof plugin.name).toBe('string');
      expect(plugin.name.length).toBeGreaterThan(0);

      expect(plugin).toHaveProperty('description');
      expect(typeof plugin.description).toBe('string');

      expect(plugin).toHaveProperty('icon');
      expect(
        typeof plugin.icon === 'function' || typeof plugin.icon === 'object'
      ).toBe(true);

      expect(plugin).toHaveProperty('component');
      expect(typeof plugin.component).toBe('function');
    }
  });

  it('has no duplicate plugin IDs', () => {
    const ids = plugins.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});
