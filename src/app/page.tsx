// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
        <h1 className="text-4xl font-bold text-foreground">PRanker</h1>
        <p className="mt-2 text-muted-foreground">
          PR ranking portal — prioritize pull requests by review complexity.
        </p>
      </div>
    </main>
  );
}
