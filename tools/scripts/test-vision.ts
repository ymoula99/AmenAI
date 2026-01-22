#!/usr/bin/env tsx

/**
 * Script de test : Vision API + Catalogue
 * Teste la nouvelle approche avec GPT-4 Vision
 * Usage: npx tsx tools/scripts/test-vision.ts
 */

import fs from 'fs';
import path from 'path';

const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY manquante');
  console.log('Usage: OPENAI_API_KEY=sk-... npx tsx tools/scripts/test-vision.ts');
  process.exit(1);
}

// Catalogue minimal pour test
const testCatalog = [
  {
    id: 'desk-standard-1',
    type: 'desk',
    name: 'Bureau Pro 140cm',
    imageUrl: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=400',
    price: 299,
    dimensions: { w: 140, d: 70, h: 75 },
    standing: 'standard',
  },
  {
    id: 'chair-standard-1',
    type: 'chair',
    name: 'Chaise Ergonomique',
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400',
    price: 249,
    dimensions: { w: 65, d: 65, h: 110 },
    standing: 'standard',
  },
  {
    id: 'meeting-standard-1',
    type: 'meeting_table',
    name: 'Table Réunion 8 pers.',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
    price: 799,
    dimensions: { w: 240, d: 120, h: 75 },
    standing: 'standard',
  },
];

async function testVisionAPI() {
  console.log('🧪 Test Vision API + Catalogue\n');

  // Image de test (bureau vide de Wikipedia)
  const testImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/1280px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg';
  
  console.log('📷 Image de test:', testImageUrl);
  console.log('📦 Catalogue:', testCatalog.length, 'produits\n');

  // Construire le prompt
  const catalogDesc = testCatalog
    .map(item => `- ${item.name} (${item.type}): ${item.dimensions.w}×${item.dimensions.d}cm, ${item.price}€`)
    .join('\n');

  const prompt = `Tu es un expert en aménagement d'espaces de bureaux.

Je vais te donner une image d'un espace et un catalogue de mobilier.

**MISSION:**
1. Analyse l'espace (dimensions estimées, caractéristiques)
2. Propose un aménagement avec 10 postes de travail + 1 table de réunion
3. Utilise UNIQUEMENT les produits du catalogue ci-dessous

**CATALOGUE:**
${catalogDesc}

**FORMAT DE RÉPONSE:**
1. Analyse de l'espace (2-3 lignes)
2. Produits sélectionnés avec quantités
3. Total estimé

Commence par analyser l'image.`;

  console.log('📤 Envoi requête à OpenAI...\n');

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: prompt },
              { 
                type: 'input_image', 
                image_url: testImageUrl,
                detail: 'high'
              },
            ],
          },
        ],
        tools: [{ type: 'image_generation' }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Erreur API:', error);
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ Réponse reçue!\n');

    // Extraire les résultats
    console.log('📊 RÉSULTATS:\n');
    
    for (const output of data.output) {
      if (output.type === 'text') {
        console.log('💬 Analyse:');
        console.log(output.text);
        console.log();
      } else if (output.type === 'image_generation_call') {
        if (output.result) {
          console.log('🖼️ Image générée: ✅ (base64, ~' + Math.round(output.result.length / 1024) + ' KB)');
          
          // Sauvegarder l'image
          const imageBuffer = Buffer.from(output.result, 'base64');
          const outputPath = path.join(process.cwd(), 'test-vision-output.png');
          fs.writeFileSync(outputPath, imageBuffer);
          console.log('💾 Sauvegardée:', outputPath);
        } else {
          console.log('🖼️ Image générée: ⏳ (en cours)');
        }
      }
    }

    console.log('\n✅ Test réussi!');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testVisionAPI();
