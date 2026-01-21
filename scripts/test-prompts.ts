/**
 * Script de test des prompts (TypeScript)
 * Usage: npx tsx scripts/test-prompts.ts
 */

import { buildPrompt, buildEditPrompt } from '../lib/openai/promptBuilder';
import type { ConfigurationItem } from '../lib/types';

console.log('🧪 Test des prompts OpenAI\n');
console.log('═'.repeat(80));

const testCases = [
  {
    name: 'BASIC - 10 postes',
    options: {
      nWorkstations: 10,
      meetingTables: 0,
      styleLevel: 'basic' as const,
      strict: false,
    },
  },
  {
    name: 'STANDARD - 20 postes + 1 table réunion',
    options: {
      nWorkstations: 20,
      meetingTables: 1,
      styleLevel: 'standard' as const,
      strict: false,
    },
  },
  {
    name: 'PREMIUM - 15 postes + 2 tables réunion',
    options: {
      nWorkstations: 15,
      meetingTables: 2,
      styleLevel: 'premium' as const,
      strict: false,
    },
  },
  {
    name: 'STRICT MODE - 20 postes (après hallucination)',
    options: {
      nWorkstations: 20,
      meetingTables: 1,
      styleLevel: 'standard' as const,
      strict: true,
    },
  },
];

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log('─'.repeat(80));
  
  try {
    const prompt = buildPrompt(testCase.options);
    
    console.log('\n📝 Options:');
    console.log(JSON.stringify(testCase.options, null, 2));
    
    console.log('\n💬 Prompt généré:');
    console.log(prompt);
    
    console.log('\n📊 Stats:');
    console.log(`  - Longueur: ${prompt.length} caractères`);
    console.log(`  - Lignes: ${prompt.split('\n').length}`);
    console.log(`  - Mots: ${prompt.split(/\s+/).length}`);
    
    // Vérifications
    const checks = {
      'Contient "EXACTLY"': prompt.includes('EXACTLY'),
      'Contient nombre de postes': prompt.includes(testCase.options.nWorkstations.toString()),
      'Contraintes architecturales': prompt.includes('Do NOT change architecture'),
      'Mode strict': testCase.options.strict ? prompt.includes('STRICT MODE') : true,
    };
    
    console.log('\n✓ Vérifications:');
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${check}`);
    });
    
    if (Object.values(checks).every(Boolean)) {
      console.log('\n✅ Test réussi');
    } else {
      console.log('\n⚠️ Attention: certaines vérifications ont échoué');
    }
  } catch (error) {
    console.error('\n❌ Erreur:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  console.log('\n' + '═'.repeat(80));
});

// Test de compatibilité avec l'ancienne fonction
console.log('\n🔄 Test de compatibilité buildEditPrompt()...\n');

try {
  const legacyItems: ConfigurationItem[] = [
    { 
      id: 'desk-001',
      type: 'desk',
      role: ['workspace'],
      standing: 'standard',
      style: ['modern'],
      dimensions: { w: 160, d: 80, h: 75 },
      price: 300,
      supplier: 'Test',
      delivery_days: 5,
      coherenceScore: 1.0,
    },
    { 
      id: 'table-001',
      type: 'meeting_table',
      role: ['meeting'],
      standing: 'standard',
      style: ['modern'],
      dimensions: { w: 200, d: 100, h: 75 },
      price: 600,
      supplier: 'Test',
      delivery_days: 5,
      coherenceScore: 1.0,
    },
  ];
  
  const legacyPrompt = buildEditPrompt(legacyItems);
  console.log('📝 Prompt legacy (extrait):');
  console.log(legacyPrompt.substring(0, 300) + '...\n');
  console.log('✅ Compatibilité OK (deprecated mais fonctionnel)');
} catch (error) {
  console.error('❌ Erreur de compatibilité:', error instanceof Error ? error.message : 'Unknown error');
}

console.log('\n🎉 Tous les tests sont terminés!\n');
console.log('💡 Pour tester avec OpenAI:');
console.log('   1. Configurez VITE_OPENAI_API_KEY dans office-agent/.env');
console.log('   2. Lancez l\'application: cd office-agent && npm run dev');
console.log('   3. Activez VITE_USE_OPENAI=true pour la génération réelle\n');
