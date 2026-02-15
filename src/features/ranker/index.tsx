// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { BarChart3 } from 'lucide-react';
import type { FeaturePlugin } from '@/features/types';

function RankerPlaceholder() {
  return (
    <div className="p-6 text-muted-foreground">
      PRanker plugin - coming soon
    </div>
  );
}

export const rankerPlugin: FeaturePlugin = {
  id: 'ranker',
  name: 'PRanker',
  description: 'Rank PRs by review complexity',
  icon: BarChart3,
  component: RankerPlaceholder,
};
