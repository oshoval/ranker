// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
