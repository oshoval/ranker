// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

export interface PRFile {
  path: string;
  additions: number;
  deletions: number;
  changeType: 'added' | 'modified' | 'deleted' | 'renamed';
}

export interface PRReview {
  author: string;
  state:
    | 'APPROVED'
    | 'CHANGES_REQUESTED'
    | 'COMMENTED'
    | 'DISMISSED'
    | 'PENDING';
  submittedAt: string;
}

export interface PRLabel {
  name: string;
  color: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  isDraft: boolean;
  mergeable: 'MERGEABLE' | 'CONFLICTING' | 'UNKNOWN';
  headRefName: string;
  baseRefName: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  labels: PRLabel[];
  reviews: PRReview[];
  files: PRFile[];
  reviewRequests: string[];
}
