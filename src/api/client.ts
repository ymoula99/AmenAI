import { ProjectFormData, RenderResponse, BOMItem, FurnitureSelection } from '@/types';
import { OfficePromptBuilder } from '../lib/promptBuilder';
import { generateImageWithReferences } from '../lib/openaiClient';
import { generateSelectionSummary } from '../lib/furnitureSelector';

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
    furnitureProposal: FurnitureSelection, // Pre-calculated furniture selection
    onProgress?: (progress: number) => void
  ): Promise<RenderResponse> {
    console.log('\n🚀 === DÉBUT GÉNÉRATION === ');
    console.log('📋 Params:', params);
    console.log('🖼️ Image:', imageFile.name, imageFile.size, 'bytes');
    console.log('🎭 Mask:', maskFile.size, 'bytes');
    console.log('⚙️ MOCK_MODE:', MOCK_MODE, '| USE_REAL_OPENAI:', USE_REAL_OPENAI);
    
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
        console.log('\n✅ MODE OPENAI ACTIVÉ');
        console.log('🪑 Utilisation de la proposition pré-calculée:', furnitureProposal);
        onProgress?.(10);
        
        // Use pre-calculated furniture selection
        const selection = furnitureProposal;

        console.log('\n✅ Sélection fournie:');
        console.log('🛋️ Produits sélectionnés:', selection.breakdown);
        console.log('💰 Coût total:', selection.totalCost, '€');
        console.log('📊 Détails:', selection.items.map(p => `${p.name} (${p.price}€)`));
        
        // Extraire les URLs des images des produits sélectionnés
        console.log('\n🖼️ Extraction des URLs d\'images...');
        const referenceImages = selection.items
          .map(p => p.imageUrl)
          .filter(Boolean) as string[];

        console.log('✅ Images de référence trouvées:', referenceImages.length);
        referenceImages.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
        
        if (referenceImages.length === 0) {
          console.warn('⚠️ ATTENTION: Aucune image de référence! Vérifiez les imageUrl des produits.');
        }
        
        // Build the prompt using OfficePromptBuilder avec les produits sélectionnés
        console.log('\n📝 Génération du prompt...');
        const selectionSummary = generateSelectionSummary(selection);
        const prompt = OfficePromptBuilder.buildMainPrompt({
          name: 'Office Configuration',
          areaM2: params.areaM2 || 100,
          workstations: params.workstations,
          budget: params.budget,
          meetingTablesPreference: params.meetingTablesPreference,
          styleLevel: params.styleLevel
        }) + `\n\nMobilier sélectionné: ${selectionSummary}`;
        
        console.log('✅ Prompt généré:', prompt.substring(0, 200) + '...');

        onProgress?.(30);

        // Call OpenAI Responses API avec les images de référence
        console.log('\n🤖 Appel OpenAI Responses API avec', referenceImages.length, 'images de référence...');
        console.log('API Key présente:', !!import.meta.env.VITE_OPENAI_API_KEY);
        console.log('Image size:', imageFile.size, 'bytes');
        console.log('Prompt length:', prompt.length, 'caractères');
        
        const editedImageUrl = await generateImageWithReferences({
          image: imageFile,
          prompt,
          referenceImageUrls: referenceImages, // Passer les URLs des produits
        });
        
        console.log('✅ Image générée par OpenAI:', editedImageUrl.substring(0, 100) + '...');

        onProgress?.(80);

        // Convertir la sélection en BOM réel
        console.log('\n📋 Création du BOM (Bill of Materials)...');
        const bom: BOMItem[] = [];
        const productGroups = new Map<string, { product: any; count: number }>();
        
        // Grouper les produits identiques
        for (const item of selection.items) {
          const key = item.id;
          if (productGroups.has(key)) {
            productGroups.get(key)!.count++;
          } else {
            productGroups.set(key, { product: item, count: 1 });
          }
        }
        
        console.log('✅ Produits groupés:', productGroups.size, 'types différents');
        
        // Créer le BOM à partir des produits réels
        for (const [_, { product, count }] of productGroups) {
          bom.push({
            sku: product.id,
            label: product.name,
            qty: count,
            unitPriceRange: { min: product.price, max: product.price },
            type: product.type,
          });
          console.log(`  - ${count}x ${product.name} (${product.price}€)`);
        }
        
        const totals = {
          buyRange: { min: selection.totalCost, max: selection.totalCost },
          rentRange: { min: Math.round(selection.totalCost * 0.08), max: Math.round(selection.totalCost * 0.08) },
        };
        
        console.log('✅ BOM créé avec', bom.length, 'lignes');
        console.log('💰 Total:', selection.totalCost.toLocaleString(), '€');

        onProgress?.(100);

        const result = {
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
                  `${selection.items.length} produits sélectionnés automatiquement`,
                  `Budget utilisé: ${selection.totalCost.toLocaleString()} €`,
                  'Prix incluant la livraison standard',
                  'Installation estimée à 2-3 jours',
                  'Garantie 2 ans sur le mobilier',
                ],
              },
            },
          ],
        };
        
        console.log('\n🎉 === GÉNÉRATION RÉUSSIE === ');
        console.log('Render ID:', result.renderId);
        console.log('Image URL:', editedImageUrl.substring(0, 100) + '...');
        console.log('\n');
        
        return result;
      } catch (error: any) {
        console.error('\n❌ === ERREUR GÉNÉRATION === ');
        console.error('Type:', error.constructor.name);
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        if (error.response) {
          console.error('Response:', error.response);
        }
        console.error('\n');
        throw new Error(`Échec de la génération: ${error.message}`);
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
