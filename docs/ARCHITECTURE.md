# Architecture — AmenAI

Ce document décrit l'architecture technique du projet.

---

## Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────────┐
│                         Utilisateur                              │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTP (localhost:5173)
┌────────────────────────────▼─────────────────────────────────────┐
│                      Frontend (src/)                             │
│  React + TypeScript + Vite                                       │
│  ├── components/   UI (Stepper, Catalog, Layout...)              │
│  ├── lib/          Logique métier client (supabase, openai...)   │
│  ├── store/        Zustand (projectStore, catalogStore)          │
│  └── types/        Interfaces TS partagées                       │
└────────────────────────────┬─────────────────────────────────────┘
                             │ REST / SDK
          ┌──────────────────┴──────────────────┐
          ▼                                     ▼
┌──────────────────────┐              ┌─────────────────────────────┐
│   Supabase (BaaS)    │              │  OpenAI API                 │
│  • Postgres DB       │              │  • Responses API            │
│  • Storage (images)  │              │  • image_generation tool    │
└──────────────────────┘              └─────────────────────────────┘
```

---

## Responsabilités par dossier

| Dossier                   | Rôle                                                                 |
|---------------------------|----------------------------------------------------------------------|
| `src/`                    | Application React (UI) + logique côté client                         |
| `src/components/`         | Composants React réutilisables et pages                              |
| `src/lib/`                | Helpers client : `supabase/client.ts`, `openaiClient.ts`, utils      |
| `src/store/`              | Stores Zustand (`projectStore.ts`, etc.)                             |
| `src/types/`              | Types TS partagés (`furniture.ts`, `index.ts`)                       |
| `tools/`                  | Scripts & ressources hors-UI (Node/TS)                               |
| `tools/scripts/`          | Scripts ops : `test-workflow.ts`, `create-storage-bucket.ts`, etc.   |
| `tools/openai/`           | Prompts, guides (`PROMPTS_GUIDE.md`, `promptBuilder.ts`)             |
| `supabase-migrations/`    | Fichiers SQL de migration pour Supabase                              |
| `docs/`                   | Documentation projet                                                 |
| `tests/`                  | Tests unitaires / intégration (vitest)                               |
| `.github/workflows/`      | CI/CD GitHub Actions                                                 |

---

## Flux principal

1. **Utilisateur** remplit le formulaire (budget, postes, style, image open-space).
2. **Frontend** (`src/lib/catalogStore`) charge le catalogue depuis Supabase.
3. **Frontend** (`src/lib/furnitureSelector`) sélectionne les meubles selon contraintes.
4. **Frontend** (`src/lib/openaiClient`) envoie l'image + prompt + références à OpenAI.
5. **OpenAI Responses API** génère une image avec `image_generation` tool.
6. **Frontend** affiche le résultat et propose téléchargement/devis.

---

## Déploiement

- **Frontend** : `npm run build` → dossier `dist/` à déployer (Vercel, Netlify, etc.)
- **Supabase** : appliquer migrations via Supabase CLI (`supabase db push`)
- **OpenAI** : clé API dans variable d'env côté client (`VITE_OPENAI_API_KEY`)

---

## Notes

- Les scripts dans `tools/scripts/` sont destinés au développement local et CI, pas au runtime prod.
- Les prompts OpenAI évoluent : voir `tools/openai/PROMPTS_GUIDE.md`.
