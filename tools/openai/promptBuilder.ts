import { ConfigurationItem } from '@/lib/types';

export interface PromptOptions {
  nWorkstations: number;
  meetingTables: number;
  styleLevel: 'basic' | 'standard' | 'premium';
  strict?: boolean; // Mode strict pour relance après hallucination
}

/**
 * Construit le prompt pour l'édition d'image OpenAI selon le niveau et les contraintes
 * Utilisé pour la génération de visualisations décisionnelles d'espaces de bureaux
 */
export function buildPrompt(options: PromptOptions): string {
  const { nWorkstations, meetingTables, styleLevel, strict = false } = options;

  // Si mode strict activé (après hallucination), utiliser le prompt de relance
  if (strict) {
    return buildStrictRetryPrompt(nWorkstations, meetingTables);
  }

  // Sinon, utiliser le prompt selon le niveau
  switch (styleLevel) {
    case 'basic':
      return buildBasicPrompt(nWorkstations, meetingTables);
    case 'premium':
      return buildPremiumPrompt(nWorkstations, meetingTables);
    case 'standard':
    default:
      return buildStandardPrompt(nWorkstations, meetingTables);
  }
}

/**
 * PROMPT BASIC - Minimaliste, fonctionnel, économique
 */
function buildBasicPrompt(nWorkstations: number, meetingTables: number): string {
  return `You are editing a REAL photo of an EMPTY office space. The goal is a DECISIONAL visualization, not a stylized render.

STRICT CONSTRAINTS:
- Do NOT change architecture or fixed elements (walls, windows, doors, ceiling, lighting, columns, floor material).
- Only add furniture ON TOP OF the floor inside the editable masked area.
- Keep original perspective and lighting.
- No decorations, no plants, no posters, no wall elements, no people, no text, no logos.

TASK:
Furnish this office as an open-space workplace for EXACTLY ${nWorkstations} workstations.
Each workstation: 1 simple rectangular desk + 1 standard task chair.

Layout:
- Practical rows with clear walkways, realistic circulation.
- Keep a main corridor visible.
- Do not block doors/windows.

${meetingTables > 0 ? `Optional:\nAdd EXACTLY ${meetingTables} simple meeting tables with 4 chairs each ONLY if space allows, otherwise add none.` : ''}

Keep everything minimal, functional, professional.`;
}

/**
 * PROMPT STANDARD - Qualité professionnelle, mobilier moderne
 */
function buildStandardPrompt(nWorkstations: number, meetingTables: number): string {
  return `You are editing a REAL photo of an EMPTY office space. This is a DECISIONAL visualization.

STRICT CONSTRAINTS:
- Do NOT change architecture or fixed elements (walls, windows, doors, ceiling, lighting, columns, floor material).
- Only add furniture on the floor inside the editable masked area.
- Preserve original perspective and lighting.
- No decorations, no plants, no posters, no people, no text, no logos.

TASK:
Create a realistic mid-range corporate open-space for EXACTLY ${nWorkstations} workstations.
Each workstation: 1 modern rectangular desk + 1 ergonomic office chair.

Layout:
- Organized rows or clusters with clear circulation and walkways.
- Maintain a visible main corridor.
- Do not block doors/windows.

${meetingTables > 0 ? `Optional meeting:\nAdd EXACTLY ${meetingTables} meeting tables with 4 chairs each ONLY if space allows without overcrowding.` : ''}

Result must look plausible and realistic in the same room.`;
}

/**
 * PROMPT PREMIUM - Haut de gamme, mobilier exécutif
 */
function buildPremiumPrompt(nWorkstations: number, meetingTables: number): string {
  return `You are editing a REAL photo of an EMPTY office space. This is a DECISIONAL visualization (not artistic).

STRICT CONSTRAINTS:
- Do NOT change architecture or fixed elements (walls, windows, doors, ceiling, lighting, columns, floor material).
- Only add furniture on the floor inside the editable masked area.
- Preserve original perspective and lighting.
- No decorations, no plants, no posters, no people, no text, no logos.

TASK:
Create a high-end executive open-space for EXACTLY ${nWorkstations} workstations.
Each workstation: 1 premium modern desk + 1 premium ergonomic chair.

Layout:
- Clean, premium, professional layout with realistic spacing and circulation.
- Keep a visible main corridor.
- Do not block doors/windows.

${meetingTables > 0 ? `Optional meeting:\nAdd EXACTLY ${meetingTables} premium meeting tables with 4 chairs each ONLY if space allows.` : ''}

Keep the scene minimal, premium, and realistic.`;
}

/**
 * PROMPT STRICT RETRY - Utilisé après détection d'hallucination ou modification hors masque
 */
function buildStrictRetryPrompt(nWorkstations: number, meetingTables: number): string {
  return `RETRY — STRICT MODE.

You must keep the original photo unchanged except for adding furniture inside the editable masked area on the floor.

ABSOLUTE RULES:
- Do NOT alter any pixels outside the editable masked area.
- Do NOT change walls, windows, doors, ceiling, lighting, columns, floor material, or any fixed feature.
- Only place furniture on the floor within the masked area.
- Preserve the exact original perspective and lighting.
- No decorations, no people, no text, no logos.

TASK:
Add EXACTLY ${nWorkstations} workstations (each: 1 rectangular desk + 1 ergonomic chair) arranged with realistic rows and clear walkways.
${meetingTables > 0 ? `Add EXACTLY ${meetingTables} meeting tables with 4 chairs each ONLY if space allows.` : ''}

Minimal, realistic, professional.`;
}

/**
 * Legacy function - Maintenue pour compatibilité avec l'ancien code
 * @deprecated Utiliser buildPrompt() à la place
 */
export function buildEditPrompt(items: ConfigurationItem[]): string {
  const nWorkstations = items.filter(i => i.type === 'desk').length;
  const meetingTables = items.filter(i => i.type === 'meeting_table').length;
  const standing = items[0]?.standing || 'standard';

  return buildPrompt({
    nWorkstations,
    meetingTables,
    styleLevel: standing as 'basic' | 'standard' | 'premium',
    strict: false,
  });
}

/**
 * Fallback prompt - Utilisé en cas d'erreur
 */
export function buildFallbackPrompt(): string {
  return buildPrompt({
    nWorkstations: 10,
    meetingTables: 0,
    styleLevel: 'standard',
    strict: false,
  });
}
