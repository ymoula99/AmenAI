import { ProjectFormData } from '@/types';

/**
 * Génère un prompt optimisé pour la génération d'images de bureaux meublés
 * Compatible avec DALL-E, Stable Diffusion, Midjourney, etc.
 */

interface PromptOptions extends ProjectFormData {
  roomDescription?: string;
  lighting?: 'natural' | 'artificial' | 'mixed';
  viewAngle?: 'wide' | 'corner' | 'entrance';
}

export class OfficePromptBuilder {
  
  /**
   * Génère le prompt principal pour l'inpainting/outpainting
   */
  static buildMainPrompt(options: PromptOptions): string {
    const { areaM2, workstations, styleLevel, meetingTablesPreference } = options;
    
    // Style descriptors
    const styleDescriptors = this.getStyleDescriptors(styleLevel);
    
    // Density calculation
    const density = workstations / areaM2;
    const densityDesc = density > 0.15 ? 'dense' : density > 0.1 ? 'well-spaced' : 'spacious';
    
    // Build prompt
    const promptParts = [
      // Core description
      `Professional office space with ${workstations} workstations`,
      
      // Style
      `${styleDescriptors.adjective} ${styleDescriptors.style} style`,
      
      // Layout
      `${densityDesc} open-plan layout`,
      
      // Furniture details
      this.getFurnitureDescription(styleLevel, workstations),
      
      // Meeting areas
      meetingTablesPreference ? 'with dedicated meeting zones' : '',
      
      // Ambiance
      `bright, professional atmosphere`,
      
      // Technical specs
      `photorealistic, architectural photography`,
      `natural lighting, modern interior design`,
      `high-end office furniture`,
      
      // Quality
      `8K, professional photography, sharp focus`,
      `clean, organized, corporate environment`,
    ];
    
    return promptParts.filter(Boolean).join(', ');
  }
  
  /**
   * Génère le prompt négatif (ce qu'on ne veut PAS)
   */
  static buildNegativePrompt(): string {
    return [
      'blurry',
      'distorted',
      'low quality',
      'cluttered',
      'messy',
      'dark',
      'dirty',
      'old furniture',
      'unprofessional',
      'residential',
      'home office',
      'bad lighting',
      'artifacts',
      'watermark',
      'text',
      'people',
      'occupied desks',
    ].join(', ');
  }
  
  /**
   * Génère des instructions spécifiques pour le masque
   */
  static buildMaskInstructions(options: PromptOptions): string {
    const { workstations, styleLevel } = options;
    
    return [
      `Place exactly ${workstations} workstations in the masked area`,
      `Arrange desks in organized rows or clusters`,
      `Maintain proper spacing between workstations (minimum 1.2m)`,
      `Ensure all desks face the same direction or follow the room's geometry`,
      styleLevel === 'premium' ? 'Use high-end, executive furniture' : 
      styleLevel === 'standard' ? 'Use quality modern office furniture' : 
      'Use functional, economical office furniture',
      `Add appropriate office lighting fixtures`,
      `Include cable management solutions`,
      `Ensure the furniture style matches the existing architecture`,
    ].join('. ');
  }
  
  /**
   * Descripteurs de style selon le standing
   */
  private static getStyleDescriptors(styleLevel: string) {
    const styles = {
      basic: {
        adjective: 'functional',
        style: 'contemporary',
        materials: 'laminate desks, mesh chairs, basic storage',
        colors: 'neutral tones, white and grey',
      },
      standard: {
        adjective: 'modern',
        style: 'professional',
        materials: 'quality wood veneer desks, ergonomic chairs, modular storage',
        colors: 'coordinated color scheme, corporate palette',
      },
      premium: {
        adjective: 'luxury',
        style: 'executive',
        materials: 'solid wood desks, leather chairs, designer storage',
        colors: 'sophisticated color palette, premium finishes',
      },
    };
    
    return styles[styleLevel as keyof typeof styles] || styles.standard;
  }
  
  /**
   * Description du mobilier selon le style et la quantité
   */
  private static getFurnitureDescription(styleLevel: string, workstations: number): string {
    const style = this.getStyleDescriptors(styleLevel);
    
    const furniture = [
      style.materials,
      style.colors,
    ];
    
    // Ajouter des détails selon la taille
    if (workstations > 50) {
      furniture.push('modular workstation systems');
      furniture.push('collaborative zones');
    } else if (workstations > 20) {
      furniture.push('grouped workstations');
      furniture.push('shared storage solutions');
    } else {
      furniture.push('individual workstations');
      furniture.push('personal storage');
    }
    
    return furniture.join(', ');
  }
  
  /**
   * Génère un prompt complet pour l'API (ex: DALL-E, Stable Diffusion)
   */
  static buildCompletePrompt(options: PromptOptions): {
    prompt: string;
    negativePrompt: string;
    maskInstructions: string;
    settings: {
      strength: number; // 0-1, force de l'inpainting
      guidance: number; // CFG scale
      steps: number;
    };
  } {
    return {
      prompt: this.buildMainPrompt(options),
      negativePrompt: this.buildNegativePrompt(),
      maskInstructions: this.buildMaskInstructions(options),
      settings: {
        strength: 0.85, // Fort pour bien intégrer le mobilier
        guidance: 7.5,  // Standard pour DALL-E/SD
        steps: 50,      // Plus de steps = meilleure qualité
      },
    };
  }
  
  /**
   * Version simplifiée pour DALL-E 3 (qui gère mieux les prompts courts)
   */
  static buildDallE3Prompt(options: PromptOptions): string {
    const { workstations, styleLevel, meetingTablesPreference } = options;
    const style = this.getStyleDescriptors(styleLevel);
    
    return [
      `A ${style.adjective} office space with ${workstations} workstations.`,
      `${style.materials}.`,
      meetingTablesPreference ? 'Includes meeting areas with tables and chairs.' : '',
      `Professional photography, bright natural lighting, clean and organized.`,
      `Modern corporate interior design.`,
    ].filter(Boolean).join(' ');
  }
  
  /**
   * Version pour Midjourney (avec paramètres)
   */
  static buildMidjourneyPrompt(options: PromptOptions): string {
    const mainPrompt = this.buildMainPrompt(options);
    
    // Ajouter les paramètres Midjourney
    return `${mainPrompt} --ar 16:9 --style raw --stylize 250 --v 6`;
  }
}

// Export d'une fonction helper simple
export function generateOfficePrompt(params: ProjectFormData): string {
  return OfficePromptBuilder.buildMainPrompt(params);
}

export function generateCompletePrompt(params: ProjectFormData) {
  return OfficePromptBuilder.buildCompletePrompt(params);
}

// Exemple d'utilisation:
/*
const params = {
  name: "Projet test",
  areaM2: 150,
  workstations: 20,
  styleLevel: "premium" as const,
  meetingTablesPreference: true,
};

const prompt = generateOfficePrompt(params);
console.log(prompt);
// Output: "Professional office space with 20 workstations, luxury executive style, 
// well-spaced open-plan layout, solid wood desks, leather chairs, designer storage, 
// sophisticated color palette, premium finishes, individual workstations, 
// personal storage, with dedicated meeting zones, bright, professional atmosphere, 
// photorealistic, architectural photography, natural lighting, modern interior design, 
// high-end office furniture, 8K, professional photography, sharp focus, 
// clean, organized, corporate environment"

const complete = generateCompletePrompt(params);
console.log(complete);
// Output: { prompt: "...", negativePrompt: "...", maskInstructions: "...", settings: {...} }
*/
