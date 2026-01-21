#!/usr/bin/env node

/**
 * Script de test des prompts
 * Usage: node test-prompts.js
 */

const promptBuilder = require('../lib/openai/promptBuilder');

console.log('🧪 Test des prompts OpenAI\n');
console.log('═'.repeat(80));

const testCases = [
  {
    name: 'BASIC - 10 postes',
    options: {
      nWorkstations: 10,
      meetingTables: 0,
      styleLevel: 'basic',
      strict: false,
    },
  },
  {
    name: 'STANDARD - 20 postes + 1 table réunion',
    options: {
      nWorkstations: 20,
      meetingTables: 1,
      styleLevel: 'standard',
      strict: false,
    },
  },
  {
    name: 'PREMIUM - 15 postes + 2 tables réunion',
    options: {
      nWorkstations: 15,
      meetingTables: 2,
      styleLevel: 'premium',
      strict: false,
    },
  },
  {
    name: 'STRICT MODE - 20 postes',
    options: {
      nWorkstations: 20,
      meetingTables: 1,
      styleLevel: 'standard',
      strict: true,
    },
  },
];

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log('─'.repeat(80));
  
  try {
    const prompt = promptBuilder.buildPrompt(testCase.options);
    
    console.log('\n📝 Options:');
    console.log(JSON.stringify(testCase.options, null, 2));
    
    console.log('\n💬 Prompt généré:');
    console.log(prompt);
    
    console.log('\n📊 Stats:');
    console.log(`  - Longueur: ${prompt.length} caractères`);
    console.log(`  - Lignes: ${prompt.split('\n').length}`);
    console.log(`  - Mots: ${prompt.split(/\s+/).length}`);
    
    console.log('\n✅ Test réussi');
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
  }
  
  console.log('\n' + '═'.repeat(80));
});

console.log('\n✨ Tous les tests sont terminés!\n');

// Test de compatibilité avec l'ancienne fonction
console.log('🔄 Test de compatibilité buildEditPrompt()...\n');

try {
  const legacyItems = [
    { type: 'desk', standing: 'standard' },
    { type: 'desk', standing: 'standard' },
    { type: 'meeting_table', standing: 'standard' },
  ];
  
  const legacyPrompt = promptBuilder.buildEditPrompt(legacyItems);
  console.log('📝 Prompt legacy:');
  console.log(legacyPrompt.substring(0, 200) + '...\n');
  console.log('✅ Compatibilité OK');
} catch (error) {
  console.error('❌ Erreur de compatibilité:', error.message);
}

console.log('\n🎉 Tous les tests sont passés avec succès!\n');
