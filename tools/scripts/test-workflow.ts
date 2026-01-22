/**
 * Script de test du workflow complet
 * Usage: npx tsx tools/scripts/test-workflow.ts
 * 
 * Ce script utilise EXACTEMENT les mêmes fonctions que l'IHM
 */

import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Charger les variables d'environnement
config();

// Importer les types et fonctions
import { selectFurnitureFromCatalog } from '../../src/lib/furnitureSelector.js';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Recréer generateImageWithReferences mais pour Node (pas de import.meta.env)
async function fileToBase64(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString('base64');
}

async function generateImageWithReferencesNode(
  imageFile: File,
  prompt: string,
  referenceImageUrls: string[]
): Promise<string> {
  const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) throw new Error('OPENAI API key not configured in VITE_OPENAI_API_KEY or OPENAI_API_KEY');

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  console.log("🔄 Conversion de l'image d'entrée en data URL...");
  const imageBase64 = await fileToBase64(imageFile);
  const inputImageDataUrl = `data:${(imageFile as any).type || 'image/png'};base64,${imageBase64}`;

  const content: any[] = [
    { type: 'input_text', text: prompt },
    { type: 'input_image', image_url: inputImageDataUrl },
  ];

  console.log('📥 Téléchargement et conversion des images de référence en data URLs...');
  for (let i = 0; i < referenceImageUrls.length; i++) {
    const url = referenceImageUrls[i];
    try {
      console.log(`   ${i + 1}/${referenceImageUrls.length} ${url.substring(0, 60)}...`);
      const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const ab = await resp.arrayBuffer();
      const b64 = Buffer.from(ab).toString('base64');
      const ct = resp.headers.get('content-type') || 'image/jpeg';
      content.push({ type: 'input_image', image_url: `data:${ct};base64,${b64}` });
    } catch (err: any) {
      console.warn(`   ⚠️ Impossible de télécharger ${url}: ${err.message}`);
    }
  }

  console.log('📤 Envoi à la Responses API (image_generation)...');
  const resp = await openai.responses.create({
    model: 'gpt-4.1',
    input: [{ role: 'user', content }],
    tools: [{ type: 'image_generation' }],
    tool_choice: { type: 'image_generation' },
  });

  const imageGenerationCalls = resp.output?.filter((o: any) => o.type === 'image_generation_call') || [];
  if (imageGenerationCalls.length === 0 || !imageGenerationCalls[0].result) {
    throw new Error('Aucune image générée — réponse: ' + JSON.stringify(resp.output_text || resp.output || resp));
  }

  return `data:image/png;base64,${imageGenerationCalls[0].result}`;
}

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

// Paramètres utilisateur
const USER_INPUT = {
  budget: 5000,
  workstations: 10,
  styleLevel: 'standard' as 'basic' | 'standard' | 'premium',
  meetingTablesPreference: true,
};

console.log('🚀 DÉBUT DU TEST WORKFLOW\n');
console.log('📋 Paramètres utilisateur:');
console.log('   - Budget:', USER_INPUT.budget, '€');
console.log('   - Postes de travail:', USER_INPUT.workstations);
console.log('   - Style:', USER_INPUT.styleLevel);
console.log('\n' + '='.repeat(80) + '\n');

// ÉTAPE 1: Charger le catalogue (même code que catalogStore.ts)
console.log('ÉTAPE 1: CHARGEMENT DU CATALOGUE');
console.log('-'.repeat(80));

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { data: products, error } = await supabase
  .from('furniture_catalog')
  .select('*')
  .eq('is_available', true)
  .order('price', { ascending: true });

if (error) {
  console.error('❌ Erreur Supabase:', error);
  process.exit(1);
}

console.log('✅ Catalogue chargé:', products.length, 'produits');

// Adapter les produits au format attendu par selectFurnitureFromCatalog
const catalogProducts = products.map(p => {
  const imageUrl = p.storage_image_path
    ? `${SUPABASE_URL}/storage/v1/object/public/furniture-images/${p.storage_image_path}`
    : p.image_url;

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: parseFloat(p.price),
    imageUrl: imageUrl,
    type: p.category,
    dimensions: `${p.width_cm}x${p.depth_cm}x${p.height_cm} cm`,
    brand: p.brand,
    material: p.material,
    color: p.color,
  };
});

console.log('\n' + '='.repeat(80) + '\n');

// ÉTAPE 2: Sélectionner les produits (FONCTION EXISTANTE)
console.log('ÉTAPE 2: SÉLECTION DES PRODUITS');
console.log('-'.repeat(80));
console.log('🔧 Utilisation de: selectFurnitureFromCatalog()');

const selection = selectFurnitureFromCatalog(catalogProducts, {
  budget: USER_INPUT.budget,
  workstations: USER_INPUT.workstations,
  styleLevel: USER_INPUT.styleLevel,
  meetingTablesPreference: USER_INPUT.meetingTablesPreference,
});

console.log('\n✅ Sélection terminée:');
console.log('   - Total articles:', selection.items.length);
console.log('   - Coût total:', selection.totalCost, '€');
console.log('   - Budget restant:', USER_INPUT.budget - selection.totalCost, '€');

console.log('\n📋 BREAKDOWN:');
console.log('   - Bureaux:', selection.breakdown.desks);
console.log('   - Chaises:', selection.breakdown.chairs);
console.log('   - Rangements:', selection.breakdown.storage);
console.log('   - Tables de réunion:', selection.breakdown.meetingTables);
console.log('   - Autres:', selection.breakdown.other);

console.log('\n📦 PRODUITS SÉLECTIONNÉS:');
const grouped = new Map<string, { product: any; count: number }>();
for (const product of selection.items) {
  const key = product.id;
  if (grouped.has(key)) {
    grouped.get(key)!.count++;
  } else {
    grouped.set(key, { product, count: 1 });
  }
}

for (const [_, { product, count }] of grouped) {
  console.log(`   ${count}x ${product.name} (${product.price}€ unitaire)`);
}

console.log('\n' + '='.repeat(80) + '\n');


console.log('\n' + '='.repeat(80) + '\n');

// ÉTAPE 3: Extraire les URLs des images
console.log('ÉTAPE 3: EXTRACTION DES IMAGES DE RÉFÉRENCE');
console.log('-'.repeat(80));

const referenceImageUrls = selection.items
  .map(p => p.imageUrl)
  .filter((url, index, self) => url && self.indexOf(url) === index);

console.log('✅ URLs extraites:', referenceImageUrls.length, 'images uniques');
referenceImageUrls.forEach((url, i) => {
  console.log(`   ${i + 1}. ${url.substring(0, 60)}...`);
});

console.log('\n' + '='.repeat(80) + '\n');

// ÉTAPE 4: Générer le prompt (même logique que client.ts)
console.log('ÉTAPE 4: GÉNÉRATION DU PROMPT');
console.log('-'.repeat(80));

const prompt = `Generate a photorealistic modern office space with ${USER_INPUT.workstations} workstations.

Style: ${USER_INPUT.styleLevel}
Budget: ${USER_INPUT.budget}€

Furniture to include (use the reference images):
- ${selection.breakdown.desks} desk(s)
- ${selection.breakdown.chairs} chair(s)
- ${selection.breakdown.storage} storage unit(s)
- ${selection.breakdown.meetingTables} meeting table(s)

Create a well-lit, professional, and organized workspace using the furniture shown in the reference images.`;

console.log('✅ Prompt généré:');
console.log('\n---');
console.log(prompt);
console.log('---\n');

console.log('\n' + '='.repeat(80) + '\n');

// ÉTAPE 5: Créer une image de test
console.log('ÉTAPE 5: CRÉATION IMAGE DE TEST');
console.log('-'.repeat(80));

let testImageFile: File;
let createdImageSizeKB = 0;

if (process.env.TEST_IMAGE_URL) {
  console.log('🔗 TEST_IMAGE_URL détectée, téléchargement de l\'image fournie...');
  try {
    const testImageResponse = await fetch(process.env.TEST_IMAGE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    if (!testImageResponse.ok) throw new Error(`HTTP ${testImageResponse.status}`);
    const arrayBuffer = await testImageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = testImageResponse.headers.get('content-type') || 'image/webp';
    // Convertir en PNG si nécessaire (Images Edits accepte png)
    if (contentType.includes('webp') || contentType.includes('gif') || (contentType.includes('png') === false && contentType.includes('jpeg') === false)) {
      try {
        const sharp = (await import('sharp')).default;
        const pngBuffer = await sharp(buffer).ensureAlpha().png().toBuffer();
        createdImageSizeKB = Math.round(pngBuffer.length / 1024);
        console.log('✅ Image téléchargée puis convertie en PNG (', createdImageSizeKB, 'KB )');
        testImageFile = new File([pngBuffer], 'input-office.png', { type: 'image/png' });
      } catch (err: any) {
        console.warn('⚠️ Conversion en PNG échouée, envoi du fichier original:', err.message);
        createdImageSizeKB = Math.round(buffer.length / 1024);
        testImageFile = new File([buffer], 'input-office.' + (contentType.split('/').pop() || 'bin'), { type: contentType });
      }
    } else {
      createdImageSizeKB = Math.round(buffer.length / 1024);
      console.log('✅ Image téléchargée depuis TEST_IMAGE_URL (', createdImageSizeKB, 'KB )');
      testImageFile = new File([buffer], 'input-office.png', { type: contentType });
    }
  } catch (err: any) {
    console.error('❌ Impossible de télécharger TEST_IMAGE_URL:', err.message);
    process.exit(1);
  }

} else {
  const { createCanvas } = await import('canvas');
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, 1024, 1024);
  ctx.fillStyle = '#666';
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Empty Office Space', 512, 450);
  ctx.font = '24px Arial';
  ctx.fillText(`${USER_INPUT.workstations} workstations needed`, 512, 500);
  ctx.fillText(`Budget: ${USER_INPUT.budget}€`, 512, 540);

  const testImageBuffer = canvas.toBuffer('image/png');
  // Convertir en File pour la fonction
  createdImageSizeKB = Math.round(testImageBuffer.length / 1024);
  testImageFile = new File([testImageBuffer], 'test-office.png', { type: 'image/png' });
}

console.log('✅ Image de test créée (1024x1024)');
console.log('   Taille:', createdImageSizeKB, 'KB');

console.log('\n' + '='.repeat(80) + '\n');

// ÉTAPE 6: Appeler OpenAI (FONCTION EXISTANTE)
console.log('ÉTAPE 6: GÉNÉRATION IMAGE AVEC OPENAI');
console.log('-'.repeat(80));
console.log('🔧 Utilisation de: generateImageWithReferences()');

try {
  const imageDataUrl = await generateImageWithReferencesNode(
    testImageFile,
    prompt,
    referenceImageUrls
  );

  console.log('\n✅ IMAGE GÉNÉRÉE PAR OPENAI!');
  
  // Extraire le base64 et sauvegarder
  const base64Data = imageDataUrl.split(',')[1];
  const outputPath = path.join(process.cwd(), 'generated-office.png');
  fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
  
  console.log('📁 Fichier sauvegardé:', outputPath);
  console.log('📊 Taille:', Math.round(base64Data.length * 0.75 / 1024), 'KB');

} catch (error: any) {
  console.error('\n❌ ERREUR:');
  console.error('   Message:', error.message);
  if (error.stack) {
    console.error('   Stack:', error.stack);
  }
  process.exit(1);
}

console.log('\n' + '='.repeat(80) + '\n');
console.log('✅ WORKFLOW COMPLET TERMINÉ!\n');
console.log('Résumé:');
console.log('  1. ✅ Catalogue chargé:', products.length, 'produits');
console.log('  2. ✅ Sélection:', selection.items.length, 'articles pour', selection.totalCost, '€');
console.log('  3. ✅ Références:', referenceImageUrls.length, 'images uniques');
console.log('  4. ✅ Image générée et sauvegardée\n');

