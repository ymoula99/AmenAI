import { CatalogProduct } from './catalogStore';
import { FurnitureSelection } from '@/types';

interface SelectionParams {
  budget: number;
  workstations: number;
  styleLevel: 'basic' | 'standard' | 'premium';
  meetingTablesPreference?: boolean;
}

/**
 * Sélectionne automatiquement les produits du catalogue selon les critères
 */
export function selectFurnitureFromCatalog(
  catalog: CatalogProduct[],
  params: SelectionParams
): FurnitureSelection {
  console.log('\n🎯 selectFurnitureFromCatalog - Début');
  console.log('Catalogue reçu:', catalog.length, 'produits');
  console.log('Params:', params);
  
  const { budget, workstations, styleLevel, meetingTablesPreference = true } = params;
  
  const selectedItems: CatalogProduct[] = [];
  let totalCost = 0;
  
  const breakdown = {
    desks: 0,
    chairs: 0,
    storage: 0,
    meetingTables: 0,
    other: 0,
  };

  // Filtrer les produits disponibles
  const availableProducts = catalog.filter(p => p.price > 0);
  console.log('Produits avec prix > 0:', availableProducts.length);
  
  // Grouper par type
  const desks = availableProducts.filter(p => p.type === 'desk').sort((a, b) => a.price - b.price);
  const chairs = availableProducts.filter(p => p.type === 'chair').sort((a, b) => a.price - b.price);
  const storage = availableProducts.filter(p => p.type === 'storage').sort((a, b) => a.price - b.price);
  const meetingTables = availableProducts.filter(p => p.type === 'meeting-table').sort((a, b) => a.price - b.price);
  const other = availableProducts.filter(p => 
    !['desk', 'chair', 'storage', 'meeting-table'].includes(p.type)
  ).sort((a, b) => a.price - b.price);
  
  console.log('Produits par type:');
  console.log('  Bureaux:', desks.length);
  console.log('  Chaises:', chairs.length);
  console.log('  Rangements:', storage.length);
  console.log('  Tables de réunion:', meetingTables.length);
  console.log('  Autres:', other.length);

  // Budget par poste de travail
  const budgetPerWorkstation = budget / workstations;
  
  // Sélection du style selon le budget par poste
  let deskIndex = 0;
  let chairIndex = 0;
  let storageIndex = 0;
  
  if (styleLevel === 'premium' && budgetPerWorkstation > 1500) {
    // Prendre les produits haut de gamme
    deskIndex = Math.min(desks.length - 1, Math.floor(desks.length * 0.7));
    chairIndex = Math.min(chairs.length - 1, Math.floor(chairs.length * 0.7));
    storageIndex = Math.min(storage.length - 1, Math.floor(storage.length * 0.7));
  } else if (styleLevel === 'standard' || budgetPerWorkstation > 800) {
    // Prendre les produits milieu de gamme
    deskIndex = Math.floor(desks.length * 0.4);
    chairIndex = Math.floor(chairs.length * 0.4);
    storageIndex = Math.floor(storage.length * 0.4);
  }
  // Sinon on garde index 0 (produits les moins chers)

  // 1. Bureaux (1 par poste)
  if (desks[deskIndex]) {
    for (let i = 0; i < workstations; i++) {
      if (totalCost + desks[deskIndex].price <= budget) {
        selectedItems.push({ ...desks[deskIndex] });
        totalCost += desks[deskIndex].price;
        breakdown.desks++;
      }
    }
  }

  // 2. Chaises (1 par poste)
  if (chairs[chairIndex]) {
    for (let i = 0; i < workstations; i++) {
      if (totalCost + chairs[chairIndex].price <= budget) {
        selectedItems.push({ ...chairs[chairIndex] });
        totalCost += chairs[chairIndex].price;
        breakdown.chairs++;
      }
    }
  }

  // 3. Rangements (1 pour 2 postes)
  const storageNeeded = Math.ceil(workstations / 2);
  if (storage[storageIndex]) {
    for (let i = 0; i < storageNeeded; i++) {
      if (totalCost + storage[storageIndex].price <= budget) {
        selectedItems.push({ ...storage[storageIndex] });
        totalCost += storage[storageIndex].price;
        breakdown.storage++;
      }
    }
  }

  // 4. Tables de réunion (optionnel)
  if (meetingTablesPreference && meetingTables.length > 0) {
    const tablesNeeded = Math.max(1, Math.floor(workstations / 20));
    for (let i = 0; i < tablesNeeded; i++) {
      if (totalCost + meetingTables[0].price <= budget) {
        selectedItems.push({ ...meetingTables[0] });
        totalCost += meetingTables[0].price;
        breakdown.meetingTables++;
      }
    }
  }

  // 5. Compléter avec d'autres produits si budget restant
  const remainingBudget = budget - totalCost;
  if (remainingBudget > 0 && other.length > 0) {
    for (const item of other) {
      if (totalCost + item.price <= budget) {
        selectedItems.push({ ...item });
        totalCost += item.price;
        breakdown.other++;
        
        // Limiter à 5 produits "other" max
        if (breakdown.other >= 5) break;
      }
    }
  }

  const result = {
    items: selectedItems,
    totalCost,
    breakdown,
  };
  
  console.log('\n✅ Sélection terminée:');
  console.log('  Total items:', selectedItems.length);
  console.log('  Coût total:', totalCost, '€');
  console.log('  Budget restant:', budget - totalCost, '€');
  console.log('  Breakdown:', breakdown);
  
  return result;
}

/**
 * Génère un résumé textuel de la sélection pour le prompt OpenAI
 */
export function generateSelectionSummary(selection: FurnitureSelection): string {
  const { breakdown } = selection;
  
  const parts: string[] = [];
  
  if (breakdown.desks > 0) parts.push(`${breakdown.desks} bureau(x)`);
  if (breakdown.chairs > 0) parts.push(`${breakdown.chairs} chaise(s)`);
  if (breakdown.storage > 0) parts.push(`${breakdown.storage} rangement(s)`);
  if (breakdown.meetingTables > 0) parts.push(`${breakdown.meetingTables} table(s) de réunion`);
  if (breakdown.other > 0) parts.push(`${breakdown.other} accessoire(s)`);
  
  return parts.join(', ');
}
