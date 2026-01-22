# Tests — AmenAI

Ce dossier contient les tests unitaires et d'intégration.

## Framework

**Vitest** — rapide, Vite-native, compatible Jest.

## Lancer les tests

```bash
# Run once
npm run test

# Watch mode
npm run test:watch
```

## Structure recommandée

```
tests/
├── lib/
│   ├── furnitureSelector.test.ts
│   ├── catalogStore.test.ts
│   └── utils.test.ts
├── components/
│   └── Stepper.test.tsx
└── setup.ts   # config globale (vitest.setup.ts)
```

## Écrire un test

```ts
import { describe, it, expect } from 'vitest';
import { selectFurnitureFromCatalog } from '../src/lib/furnitureSelector';

describe('selectFurnitureFromCatalog', () => {
  it('should select items within budget', () => {
    const catalog = [/* ... */];
    const result = selectFurnitureFromCatalog(catalog, { budget: 1000, workstations: 2 });
    expect(result.totalCost).toBeLessThanOrEqual(1000);
  });
});
```
