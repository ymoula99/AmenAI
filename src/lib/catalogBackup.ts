import { CatalogProduct } from './catalogStore';

/**
 * Exporte le catalogue actuel vers un fichier JSON
 */
export function exportCatalog(products: CatalogProduct[]): void {
  const data = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    productsCount: products.length,
    products: products,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `catalog-backup-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Importe un catalogue depuis un fichier JSON
 */
export function importCatalog(file: File): Promise<CatalogProduct[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validation basique
        if (!data.products || !Array.isArray(data.products)) {
          throw new Error('Format de fichier invalide');
        }
        
        // Reconvertir les dates en objets Date
        const products = data.products.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
        }));
        
        resolve(products);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsText(file);
  });
}

/**
 * Importe un catalogue depuis du texte JSON
 */
export function importCatalogFromText(jsonText: string): CatalogProduct[] {
  try {
    const data = JSON.parse(jsonText);
    
    // Si c'est le format localStorage complet
    if (data.state && data.state.products) {
      return data.state.products.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
      }));
    }
    
    // Si c'est le format d'export
    if (data.products && Array.isArray(data.products)) {
      return data.products.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
      }));
    }
    
    throw new Error('Format non reconnu');
  } catch (error) {
    throw new Error('JSON invalide : ' + (error as Error).message);
  }
}

/**
 * Obtient la taille du catalogue en MB
 */
export function getCatalogSize(): { bytes: number; kb: number; mb: number } {
  const data = localStorage.getItem('amen-catalog-storage');
  if (!data) {
    return { bytes: 0, kb: 0, mb: 0 };
  }
  
  const bytes = data.length;
  return {
    bytes,
    kb: bytes / 1024,
    mb: bytes / 1024 / 1024,
  };
}

/**
 * Vérifie si le localStorage est proche de la limite
 */
export function isStorageNearLimit(): boolean {
  const size = getCatalogSize();
  // Alerte si > 4 MB (limite généralement ~5 MB)
  return size.mb > 4;
}
