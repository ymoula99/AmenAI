import { CatalogProduct, ProductType } from './catalogStore';

/**
 * Formate les produits du catalogue pour inclusion dans le prompt OpenAI
 */
export function formatCatalogForPrompt(products: CatalogProduct[]): string {
  if (products.length === 0) {
    return '';
  }

  const productsByType = products.reduce((acc, product) => {
    if (!acc[product.type]) {
      acc[product.type] = [];
    }
    acc[product.type].push(product);
    return acc;
  }, {} as Record<ProductType, CatalogProduct[]>);

  const sections: string[] = [];

  // Bureaux
  if (productsByType.desk?.length > 0) {
    sections.push(`\n**BUREAUX DISPONIBLES:**`);
    productsByType.desk.forEach(p => {
      sections.push(`- ${p.name} (${p.price}€): ${p.description}`);
    });
  }

  // Chaises
  if (productsByType.chair?.length > 0) {
    sections.push(`\n**CHAISES DISPONIBLES:**`);
    productsByType.chair.forEach(p => {
      sections.push(`- ${p.name} (${p.price}€): ${p.description}`);
    });
  }

  // Tables de réunion
  if (productsByType['meeting-table']?.length > 0) {
    sections.push(`\n**TABLES DE RÉUNION DISPONIBLES:**`);
    productsByType['meeting-table'].forEach(p => {
      sections.push(`- ${p.name} (${p.price}€): ${p.description}`);
    });
  }

  // Rangements
  if (productsByType.storage?.length > 0) {
    sections.push(`\n**RANGEMENTS DISPONIBLES:**`);
    productsByType.storage.forEach(p => {
      sections.push(`- ${p.name} (${p.price}€): ${p.description}`);
    });
  }

  // Éclairage
  if (productsByType.lighting?.length > 0) {
    sections.push(`\n**ÉCLAIRAGE DISPONIBLE:**`);
    productsByType.lighting.forEach(p => {
      sections.push(`- ${p.name} (${p.price}€): ${p.description}`);
    });
  }

  // Décoration
  if (productsByType.decoration?.length > 0) {
    sections.push(`\n**DÉCORATION DISPONIBLE:**`);
    productsByType.decoration.forEach(p => {
      sections.push(`- ${p.name} (${p.price}€): ${p.description}`);
    });
  }

  // Autres
  if (productsByType.other?.length > 0) {
    sections.push(`\n**AUTRES PRODUITS:**`);
    productsByType.other.forEach(p => {
      sections.push(`- ${p.name} (${p.price}€): ${p.description}`);
    });
  }

  const header = `\n\n--- CATALOGUE DE PRODUITS DISPONIBLES ---`;
  const instruction = `\n\n**IMPORTANT:** Utilisez UNIQUEMENT les produits listés ci-dessus pour l'aménagement. Respectez les noms exacts et les descriptions.\n`;
  
  return header + sections.join('\n') + instruction;
}

/**
 * Extrait les images des produits pour envoi à OpenAI Vision
 */
export function getCatalogImages(products: CatalogProduct[]): string[] {
  return products
    .filter(p => p.imageUrl)
    .map(p => p.imageUrl!);
}

/**
 * Crée un contexte détaillé du catalogue pour GPT-4 Vision
 */
export function createCatalogContext(products: CatalogProduct[]): {
  text: string;
  images: string[];
  totalProducts: number;
} {
  return {
    text: formatCatalogForPrompt(products),
    images: getCatalogImages(products),
    totalProducts: products.length,
  };
}
