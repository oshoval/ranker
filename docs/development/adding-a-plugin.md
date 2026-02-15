# Adding a Plugin

Step-by-step guide to adding a new feature plugin to PRanker.

## 1. Create the feature folder

```
src/features/my-feature/
├── index.tsx            # Plugin definition
├── components/          # UI components
├── hooks/               # React hooks
├── lib/                 # Business logic
├── api/                 # API handler (if needed)
└── types/               # Feature-specific types
```

## 2. Implement the plugin

Create `src/features/my-feature/index.tsx`:

```tsx
import { SomeIcon } from 'lucide-react';
import type { FeaturePlugin } from '../types';
import { MyComponent } from './components/my-component';

export const myPlugin: FeaturePlugin = {
  id: 'my-feature',
  name: 'My Feature',
  description: 'What this feature does',
  icon: SomeIcon,
  component: MyComponent,
};
```

## 3. Register the plugin

Add one line to `src/features/registry.ts`:

```tsx
import { myPlugin } from './my-feature';

export const plugins: FeaturePlugin[] = [
  rankerPlugin,
  myPlugin,    // Add here
];
```

## 4. Add an API route (optional)

If your plugin needs a backend endpoint, create `src/app/api/my-feature/route.ts`:

```tsx
import { handleMyFeature } from '@/features/my-feature/api/handler';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleMyFeature(request);
}
```

## 5. Write tests

Create tests in `__tests__/features/my-feature/` mirroring the source structure.

## 6. Add documentation

Create `docs/features/my-feature.md` and add it to `docs/SUMMARY.md`.

## Rules

- Don't import from other plugins -- use `src/shared/` for shared code
- Add SPDX license headers to all new files
- Sign commits with `-s` flag
