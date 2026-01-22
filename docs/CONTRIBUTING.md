# Contribuer à AmenAI

Merci de vouloir contribuer ! Voici les règles et bonnes pratiques.

---

## Pré-requis

- Node.js ≥ 18
- npm ≥ 9
- Compte Supabase (pour tests locaux)
- Clé API OpenAI (pour tests image)

---

## Workflow

1. **Fork** le repo et clone localement.
2. Créer une branche descriptive : `feat/add-mask-support`, `fix/catalog-loading`.
3. Développer et tester localement (`npm run dev`, `npm run test`).
4. Lancer le lint : `npm run lint` (zéro warning).
5. Commit avec [Conventional Commits](https://www.conventionalcommits.org/) :
   - `feat: add mask generation for image editing`
   - `fix: handle empty catalog gracefully`
   - `docs: update ARCHITECTURE.md`
6. Push et ouvrir une Pull Request vers `main`.

---

## Conventions de code

- **TypeScript strict** : pas de `any` sauf exception documentée.
- **Prettier** : formatage automatique (`npm run format`).
- **ESLint** : règles dans `.eslintrc.cjs`.
- **Imports** : préférer alias `@/` pour `src/`.

---

## Tests

- Framework : **Vitest** (rapide, Vite-native).
- Dossier : `tests/`.
- Lancer : `npm run test` ou `npm run test:watch`.
- Couvrir les fonctions critiques (`furnitureSelector`, `catalogStore`, prompts).

---

## Ajouter une migration Supabase

1. Créer un fichier dans `supabase-migrations/` avec préfixe numérique croissant :
   - `003_add_new_column.sql`
2. Appliquer via Supabase CLI :
   ```bash
   supabase db push
   ```

---

## Ajouter / modifier un prompt OpenAI

1. Éditer `tools/openai/promptBuilder.ts`.
2. Documenter dans `tools/openai/PROMPTS_GUIDE.md`.
3. Tester via `npx tsx tools/scripts/test-workflow.ts`.

---

## Questions ?

Ouvrir une issue sur le repo ou contacter l'équipe.
