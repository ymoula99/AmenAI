# 📝 Guide des Prompts - Génération d'images de bureaux

## 🎯 Philosophie des prompts

Ces prompts sont conçus pour **l'édition d'images réelles** (inpainting), pas pour la génération from scratch.

### Objectif : Visualisation décisionnelle
- **Pas** un rendu artistique
- **Oui** une projection réaliste pour aide à la décision
- L'agent immobilier montre ça au client pendant la visite

### Contraintes absolues
1. ✅ Ne modifier que la zone masquée (sol)
2. ✅ Préserver l'architecture existante
3. ✅ Respecter la perspective et l'éclairage d'origine
4. ✅ Pas de décoration (focus mobilier uniquement)

---

## 🔧 Utilisation

### Import

```typescript
import { buildPrompt, PromptOptions } from '@/lib/openai/promptBuilder';
```

### Exemple basique

```typescript
const prompt = buildPrompt({
  nWorkstations: 20,
  meetingTables: 2,
  styleLevel: 'standard',
  strict: false
});
```

### Options disponibles

```typescript
interface PromptOptions {
  nWorkstations: number;    // Nombre exact de postes de travail
  meetingTables: number;     // Nombre de tables de réunion (0 si aucune)
  styleLevel: 'basic' | 'standard' | 'premium';
  strict?: boolean;          // Mode strict après hallucination (défaut: false)
}
```

---

## 📊 Les 3 niveaux de standing

### 1️⃣ BASIC - Économique et fonctionnel

**Usage :** Startups, espaces temporaires, budget serré

**Mobilier :**
- Bureaux rectangulaires simples
- Chaises de tâche standard
- Tables de réunion basiques

**Layout :**
- Rangées pratiques
- Circulation claire
- Fonctionnel avant tout

**Prompt :**
```typescript
buildPrompt({
  nWorkstations: 15,
  meetingTables: 1,
  styleLevel: 'basic'
});
```

### 2️⃣ STANDARD - Qualité professionnelle

**Usage :** PME, bureaux d'entreprise classiques

**Mobilier :**
- Bureaux modernes rectangulaires
- Chaises ergonomiques
- Tables de réunion mid-range

**Layout :**
- Rangées ou clusters organisés
- Circulation et walkways
- Professionnel et fonctionnel

**Prompt :**
```typescript
buildPrompt({
  nWorkstations: 20,
  meetingTables: 2,
  styleLevel: 'standard'
});
```

### 3️⃣ PREMIUM - Haut de gamme exécutif

**Usage :** Grands groupes, espaces exécutifs, standing supérieur

**Mobilier :**
- Bureaux premium modernes
- Chaises ergonomiques haut de gamme
- Tables de réunion premium

**Layout :**
- Espacement généreux
- Design premium
- Clean et professionnel

**Prompt :**
```typescript
buildPrompt({
  nWorkstations: 15,
  meetingTables: 2,
  styleLevel: 'premium'
});
```

---

## 🚨 Mode STRICT (Retry après hallucination)

### Quand l'utiliser ?

Si vous détectez que l'IA a :
- ❌ Modifié l'architecture (murs, fenêtres, portes)
- ❌ Changé l'éclairage ou les couleurs
- ❌ Ajouté des éléments hors de la zone masquée
- ❌ Transformé la pièce au lieu de juste meubler

### Comment l'activer ?

```typescript
const strictPrompt = buildPrompt({
  nWorkstations: 20,
  meetingTables: 2,
  styleLevel: 'standard',
  strict: true  // 🔒 Active le mode strict
});
```

Le mode strict :
- ✅ Répète les contraintes de manière plus stricte
- ✅ Insiste sur "ABSOLUTE RULES"
- ✅ Précise "RETRY — STRICT MODE"
- ✅ Évite les formulations ambiguës

---

## 🧪 Tests A/B et optimisation

### Structure pour les tests

```typescript
// test-prompts.ts
import { buildPrompt } from '@/lib/openai/promptBuilder';

const testCases = [
  {
    id: 'office_1_basic',
    imageUrl: '/tests/office-1.jpg',
    maskUrl: '/tests/office-1-mask.png',
    options: { nWorkstations: 10, meetingTables: 0, styleLevel: 'basic' }
  },
  {
    id: 'office_1_standard',
    imageUrl: '/tests/office-1.jpg',
    maskUrl: '/tests/office-1-mask.png',
    options: { nWorkstations: 10, meetingTables: 0, styleLevel: 'standard' }
  },
  {
    id: 'office_1_premium',
    imageUrl: '/tests/office-1.jpg',
    maskUrl: '/tests/office-1-mask.png',
    options: { nWorkstations: 10, meetingTables: 0, styleLevel: 'premium' }
  },
  // ... 20 autres bureaux
];

async function runABTests() {
  for (const test of testCases) {
    const prompt = buildPrompt(test.options);
    const result = await generateImage(test.imageUrl, test.maskUrl, prompt);
    
    // Sauvegarder le résultat
    await saveResult(`results/${test.id}.jpg`, result);
    
    // Logger pour analyse
    console.log({
      testId: test.id,
      prompt: prompt.substring(0, 100) + '...',
      success: true
    });
  }
}
```

### Métriques à tracker

1. **Taux de réussite**
   - L'architecture est-elle préservée ?
   - Le mobilier est-il dans la zone masquée uniquement ?
   - Le nombre de postes est-il correct ?

2. **Qualité visuelle**
   - Le résultat est-il photoréaliste ?
   - La perspective est-elle cohérente ?
   - L'éclairage est-il préservé ?

3. **Pertinence décisionnelle**
   - Un agent immobilier peut-il montrer ça à un client ?
   - Le mobilier est-il crédible ?
   - Le layout est-il réaliste ?

### Variantes de prompts à tester

```typescript
// Variante A : Prompt actuel
const promptA = buildPrompt(options);

// Variante B : Plus de détails sur le mobilier
const promptB = buildPrompt({...options, detailed: true});

// Variante C : Emphasis sur la circulation
const promptC = buildPrompt({...options, emphasizeCirculation: true});
```

---

## 📋 Checklist avant production

### ✅ Validation du prompt

- [ ] Le nombre de postes est explicitement mentionné
- [ ] Les contraintes architecturales sont claires
- [ ] Le mode strict est disponible en fallback
- [ ] Le niveau de standing est adapté au cas d'usage

### ✅ Tests sur échantillon

- [ ] Testé sur au moins 10 photos différentes
- [ ] Testé avec différentes surfaces (50m², 150m², 300m²)
- [ ] Testé avec différents nombres de postes (5, 20, 50, 100)
- [ ] Testé les 3 niveaux de standing

### ✅ Gestion des edge cases

- [ ] Pièce trop petite pour N postes → dégradation gracieuse
- [ ] Pièce avec colonnes ou obstacles
- [ ] Éclairage faible ou contre-jour
- [ ] Angles non standard (fish-eye, grand angle)

---

## 🔍 Debugging

### Problème : L'IA change l'architecture

**Solution :**
```typescript
// Activer le mode strict
const prompt = buildPrompt({...options, strict: true});
```

### Problème : Pas assez de postes générés

**Cause probable :** Masque trop petit ou wording du prompt

**Solution :**
- Vérifier que le masque couvre une zone suffisante
- Ajouter "EXACTLY {N} workstations" est déjà dans le prompt

### Problème : Mobilier hors de la zone masquée

**Solution :**
- Utiliser le mode strict
- Vérifier que le masque est correct (PNG avec alpha channel)

### Problème : Style incohérent

**Solution :**
- Vérifier que `styleLevel` est bien passé
- Tester avec le mode premium qui donne plus de guidance

---

## 💡 Best Practices

### 1. Itération rapide

```typescript
// Boucle de test rapide
const levels = ['basic', 'standard', 'premium'] as const;
for (const level of levels) {
  const prompt = buildPrompt({
    nWorkstations: 20,
    meetingTables: 2,
    styleLevel: level
  });
  console.log(`\n=== ${level.toUpperCase()} ===`);
  console.log(prompt);
}
```

### 2. Logging structuré

```typescript
interface GenerationLog {
  timestamp: string;
  promptOptions: PromptOptions;
  promptText: string;
  imageUrl: string;
  success: boolean;
  hallucinationDetected?: boolean;
  retryCount?: number;
}
```

### 3. Cache des prompts

Les prompts sont déterministes, donc cachables :

```typescript
const promptCache = new Map<string, string>();

function getCachedPrompt(options: PromptOptions): string {
  const key = JSON.stringify(options);
  if (!promptCache.has(key)) {
    promptCache.set(key, buildPrompt(options));
  }
  return promptCache.get(key)!;
}
```

---

## 🎯 Roadmap

### Phase 1 (Actuel) ✅
- [x] 3 niveaux de standing
- [x] Mode strict
- [x] Nombre exact de postes
- [x] Tables de réunion optionnelles

### Phase 2 (À venir)
- [ ] Support multi-zones (plusieurs masques)
- [ ] Ajout de zones spécifiques (détente, phone booth)
- [ ] Variantes de layout (bench, cluster, individuel)
- [ ] Contraintes de cablage / colonnes techniques

### Phase 3 (Future)
- [ ] Prompts adaptatifs basés sur la surface réelle
- [ ] Calcul automatique du nombre optimal de postes
- [ ] Détection de qualité post-génération
- [ ] Re-prompting automatique si hallucination

---

## 📞 Support

Pour toute question ou amélioration des prompts :
1. Tester d'abord avec le mode strict
2. Logger le prompt exact utilisé
3. Partager la photo originale + masque + résultat

**Structure du rapport de bug :**
```typescript
{
  promptOptions: {...},
  imageUrl: "...",
  maskUrl: "...",
  resultUrl: "...",
  issue: "Description du problème",
  expectedBehavior: "Ce qui était attendu"
}
```

---

**Version des prompts :** 1.0.0  
**Dernière mise à jour :** 19 janvier 2026  
**Compatibilité :** OpenAI gpt-image-1.5, DALL-E 3
