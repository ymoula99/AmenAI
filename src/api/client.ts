import { ProjectFormData, RenderResponse, BOMItem } from '@/types';
import { OfficePromptBuilder } from '../lib/promptBuilder';
import { editImageWithMask } from '../lib/openaiClient';
import { useCatalogStore } from '../lib/catalogStore';
import { selectFurnitureFromCatalog, generateSelectionSummary } from '../lib/furnitureSelector';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const MOCK_MODE = import.meta.env.VITE_MOCK_API !== 'false'; // true par défaut
const USE_REAL_OPENAI = import.meta.env.VITE_USE_OPENAI === 'true'; // false par défaut

// Mock data generator
const generateMockBOM = (workstations: number, styleLevel: string): BOMItem[] => {
  const priceMultiplier = styleLevel === 'premium' ? 1.8 : styleLevel === 'standard' ? 1.3 : 1;
  
  return [
    {
      sku: 'DSK-001',
      label: 'Bureau opérateur',
      qty: workstations,
      unitPriceRange: { min: Math.round(150 * priceMultiplier), max: Math.round(280 * priceMultiplier) },
      type: 'desk',
    },
    {
      sku: 'CHR-002',
      label: 'Chaise ergonomique',
      qty: workstations,
      unitPriceRange: { min: Math.round(80 * priceMultiplier), max: Math.round(180 * priceMultiplier) },
      type: 'chair',
    },
    {
      sku: 'STG-003',
      label: 'Caisson de rangement',
      qty: Math.ceil(workstations / 2),
      unitPriceRange: { min: Math.round(90 * priceMultiplier), max: Math.round(150 * priceMultiplier) },
      type: 'storage',
    },
    {
      sku: 'MTB-004',
      label: 'Table de réunion',
      qty: Math.max(1, Math.floor(workstations / 20)),
      unitPriceRange: { min: Math.round(400 * priceMultiplier), max: Math.round(800 * priceMultiplier) },
      type: 'meeting_table',
    },
    {
      sku: 'MCH-005',
      label: 'Chaise visiteur',
      qty: Math.max(6, Math.floor(workstations / 20) * 6),
      unitPriceRange: { min: Math.round(60 * priceMultiplier), max: Math.round(120 * priceMultiplier) },
      type: 'meeting_chair',
    },
  ];
};

const calculateTotals = (bom: BOMItem[]) => {
  const buyMin = bom.reduce((sum, item) => sum + (item.unitPriceRange?.min || 0) * item.qty, 0);
  const buyMax = bom.reduce((sum, item) => sum + (item.unitPriceRange?.max || 0) * item.qty, 0);
  
  return {
    buyRange: { min: buyMin, max: buyMax },
    rentRange: { min: Math.round(buyMin * 0.08), max: Math.round(buyMax * 0.08) }, // ~8% mensuel
  };
};

// Mock API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiClient = {
  async createProject(data: ProjectFormData): Promise<{ projectId: string }> {
    if (MOCK_MODE) {
      await delay(300);
      return { projectId: `project-${Date.now()}` };
    }
    
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
  },

  async renderProject(
    projectId: string,
    imageFile: File,
    maskFile: Blob,
    params: ProjectFormData,
    onProgress?: (progress: number) => void
  ): Promise<RenderResponse> {
    if (MOCK_MODE && !USE_REAL_OPENAI) {
      // Simulate progress
      const progressSteps = [10, 25, 45, 65, 80, 95, 100];
      for (const progress of progressSteps) {
        await delay(1500);
        onProgress?.(progress);
      }
      
      // Generate mock response
      const bom = generateMockBOM(params.workstations, params.styleLevel);
      const totals = calculateTotals(bom);
      
      // Create a mock rendered image (just reuse the original for demo)
      const mockImageUrl = URL.createObjectURL(imageFile);
      
      return {
        renderId: `render-${Date.now()}`,
        outputs: [
          {
            imageUrl: mockImageUrl,
            scenario: {
              title: `Configuration ${params.styleLevel} - ${params.workstations} postes`,
              bom,
              totals,
              notes: [
                'Prix incluant la livraison standard',
                'Installation estimée à 2-3 jours',
                'Garantie 2 ans sur le mobilier',
                params.meetingTablesPreference ? 'Espaces de réunion intégrés' : 'Configuration open space optimisée',
              ],
            },
          },
        ],
      };
    }

    // REAL OpenAI generation
    if (USE_REAL_OPENAI) {
      try {
        onProgress?.(10);
        
        // Sélectionner automatiquement les produits du catalogue
        const catalogStore = useCatalogStore.getState();
        await catalogStore.loadProducts();
        
        const selection = selectFurnitureFromCatalog(catalogStore.products, {
          budget: params.budget,
          workstations: params.workstations,
          styleLevel: params.styleLevel,
          meetingTablesPreference: params.meetingTablesPreference,
        });

        console.log('🛋️ Produits sélectionnés:', selection.breakdown);
        console.log('💰 Coût total:', selection.totalCost, '€');
        
        // Extraire les URLs des images des produits sélectionnés
        const referenceImages = selection.items
          .map(p => p.imageUrl)
          .filter(Boolean) as string[];

        console.log('🖼️ Images de référence:', referenceImages.length);
        
        // Build the prompt using OfficePromptBuilder avec les produits sélectionnés
        const selectionSummary = generateSelectionSummary(selection);
        const prompt = OfficePromptBuilder.buildMainPrompt({
          name: 'Office Configuration',
          areaM2: params.areaM2 || 100,
          workstations: params.workstations,
          budget: params.budget,
          meetingTablesPreference: params.meetingTablesPreference,
          styleLevel: params.styleLevel
        }) + `\n\nMobilier sélectionné: ${selectionSummary}`;

        onProgress?.(30);

        // Convert mask Blob to File
        const maskFile_asFile = new File([maskFile], 'mask.png', { type: 'image/png' });

        onProgress?.(40);

        // Call OpenAI image edit (les images de référence sont dans le prompt)
        const editedImageUrl = await editImageWithMask({
          image: imageFile,
          mask: maskFile_asFile,
          prompt,
          size: '1024x1024',
        });

        onProgress?.(80);

        // Generate BOM based on actual configuration
        const bom = generateMockBOM(params.workstations, params.styleLevel);
        const totals = calculateTotals(bom);
        const meetingTables = params.meetingTablesPreference 
          ? Math.max(1, Math.floor(params.workstations / 20))
          : 0;

        onProgress?.(100);

        return {
          renderId: `render-${Date.now()}`,
          outputs: [
            {
              imageUrl: editedImageUrl,
              scenario: {
                title: `Configuration ${params.styleLevel} - ${params.workstations} postes`,
                bom,
                totals,
                notes: [
                  'Visualisation générée par IA',
                  'Prix incluant la livraison standard',
                  'Installation estimée à 2-3 jours',
                  'Garantie 2 ans sur le mobilier',
                  params.meetingTablesPreference ? `${meetingTables} espace(s) de réunion intégré(s)` : 'Configuration open space optimisée',
                ],
              },
            },
          ],
        };
      } catch (error) {
        console.error('OpenAI generation failed:', error);
        throw new Error('Échec de la génération. Vérifiez votre clé API OpenAI.');
      }
    }

    // Real API call (backend)
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('mask', maskFile, 'mask.png');
    formData.append('params', JSON.stringify(params));

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/render`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to render project');
    return response.json();
  },
};

export default apiClient;
