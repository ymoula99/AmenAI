# AmenAI — Office Agent MVP

Outil d'aménagement de bureaux par IA : générez des visuels photoréalistes d'un open-space meublé à partir d'un catalogue et de contraintes utilisateur (budget, postes, style).

---

## 🚀 Quickstart

```bash
# 1. Cloner et installer
git clone <repo-url>
cd AmenAI
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# Remplir VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_OPENAI_API_KEY

# 3. Lancer le serveur de développement (frontend)
npm run dev
```

Ouvrir http://localhost:5173 dans le navigateur.

---

## 📂 Structure du projet

```
AmenAI/
├── src/                  # Application React + TypeScript (UI)
│   ├── components/       # Composants React (Stepper, Catalog, etc.)
│   ├── lib/              # Logique métier client (supabase, openai, utils)
│   ├── store/            # Zustand stores (état global)
│   └── types/            # Types TypeScript partagés
├── tools/                # Scripts & ressources hors-UI
│   ├── scripts/          # Scripts Node/TS (test-workflow, storage ops)
│   └── openai/           # Prompts & guides pour OpenAI
├── supabase-migrations/  # Fichiers SQL de migration Supabase
├── docs/                 # Documentation projet
├── tests/                # Tests unitaires / intégration (vitest)
└── .github/workflows/    # CI GitHub Actions
```

---

## 🔧 Scripts npm

| Commande            | Description                                   |
|---------------------|-----------------------------------------------|
| `npm run dev`       | Serveur Vite dev (hot-reload)                 |
| `npm run build`     | Build production (tsc + vite build)           |
| `npm run lint`      | ESLint                                        |
| `npm run test`      | Tests vitest                                  |
| `npm run format`    | Prettier (formatage)                          |
| `npm run ci`        | Lint + build + tests (pipeline locale)        |

---

## 🛠️ Technologies

- **Frontend** : React 18, TypeScript, Vite, Tailwind CSS
- **State** : Zustand
- **Validation** : Zod, react-hook-form
- **Backend** : Supabase (Postgres + Storage)
- **IA / Images** : OpenAI SDK (Responses API, image_generation)
- **Tooling** : ESLint, Prettier, Vitest, Husky

---

## 📖 Voir aussi

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Vue d'ensemble technique
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Guide de contribution
- [tools/openai/PROMPTS_GUIDE.md](../tools/openai/PROMPTS_GUIDE.md) — Guide des prompts OpenAI
