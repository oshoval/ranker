// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import type { FeaturePlugin } from '@/features/types';
import { rankerPlugin } from '@/features/ranker';

export const plugins: FeaturePlugin[] = [rankerPlugin];
