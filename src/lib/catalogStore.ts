import { create } from 'zustand';
import { FurnitureCatalogAPI } from '../api/Catalog';
import type { FurnitureCategory } from '../types/furniture';

// Mapping entre les types locaux et Supabase
const TYPE_MAPPING: Record<ProductType, FurnitureCategory> = {
  'desk': 'desk',
  'chair': 'chair',
  'meeting-table': 'meeting_table',
  'storage': 'storage',
  'lighting': 'lighting',
  'decoration': 'accessories',
  'other': 'accessories',
};

const REVERSE_TYPE_MAPPING: Record<FurnitureCategory, ProductType> = {
  'desk': 'desk',
  'chair': 'chair',
  'meeting_table': 'meeting-table',
  'storage': 'storage',
  'accessories': 'decoration',
  'cabinet': 'storage',
  'sofa': 'other',
  'lighting': 'lighting',
};

export type ProductType = 
  | 'desk'
  | 'chair'
  | 'meeting-table'
  | 'storage'
  | 'lighting'
  | 'decoration'
  | 'other';

export interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  type: ProductType;
  price: number;
  imageUrl?: string;
  imageFile?: File;
  createdAt: Date;
  // Dimensions
  width_cm?: number;
  depth_cm?: number;
  height_cm?: number;
  // Métadonnées
  brand?: string;
  material?: string;
  color?: string;
  stock_quantity?: number;
}

interface CatalogStore {
  products: CatalogProduct[];
  isLoading: boolean;
  error: string | null;
  loadProducts: () => Promise<void>;
  addProduct: (product: Omit<CatalogProduct, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<CatalogProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductsByType: (type: ProductType) => CatalogProduct[];
}

export const useCatalogStore = create<CatalogStore>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,

  loadProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const furnitureItems = await FurnitureCatalogAPI.getAll({ is_available: true });
      const products: CatalogProduct[] = furnitureItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        type: REVERSE_TYPE_MAPPING[item.category] || 'other',
        price: item.price,
        imageUrl: item.image_url,
        createdAt: new Date(item.created_at),
        width_cm: item.width_cm,
        depth_cm: item.depth_cm,
        height_cm: item.height_cm,
        brand: item.brand,
        material: item.material,
        color: item.color,
        stock_quantity: item.stock_quantity,
      }));
      set({ products, isLoading: false });
    } catch (error) {
      console.error('Error loading products:', error);
      set({ error: 'Erreur lors du chargement des produits', isLoading: false });
    }
  },

  addProduct: async (product) => {
    set({ isLoading: true, error: null });
    try {
      // Upload image si présente
      let imageUrl = product.imageUrl;
      if (product.imageFile) {
        imageUrl = await FurnitureCatalogAPI.uploadImage(product.imageFile);
      }

      const newItem = await FurnitureCatalogAPI.create({
        name: product.name,
        description: product.description,
        category: TYPE_MAPPING[product.type],
        price: product.price,
        width_cm: product.width_cm || 100,
        depth_cm: product.depth_cm || 50,
        height_cm: product.height_cm || 75,
        image_url: imageUrl || 'https://via.placeholder.com/400',
        brand: product.brand,
        material: product.material,
        color: product.color,
        stock_quantity: product.stock_quantity || 10,
        is_available: true,
      });

      const newProduct: CatalogProduct = {
        id: newItem.id,
        name: newItem.name,
        description: newItem.description || '',
        type: product.type,
        price: newItem.price,
        imageUrl: newItem.image_url,
        createdAt: new Date(newItem.created_at),
        width_cm: newItem.width_cm,
        depth_cm: newItem.depth_cm,
        height_cm: newItem.height_cm,
        brand: newItem.brand,
        material: newItem.material,
        color: newItem.color,
        stock_quantity: newItem.stock_quantity,
      };

      set((state) => ({
        products: [...state.products, newProduct],
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error adding product:', error);
      set({ error: 'Erreur lors de l\'ajout du produit', isLoading: false });
    }
  },

  updateProduct: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      // Upload nouvelle image si présente
      let imageUrl = updates.imageUrl;
      if (updates.imageFile) {
        imageUrl = await FurnitureCatalogAPI.uploadImage(updates.imageFile);
      }

      const updateData: any = {
        id,
      };
      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.type) updateData.category = TYPE_MAPPING[updates.type];
      if (imageUrl) updateData.image_url = imageUrl;
      if (updates.width_cm !== undefined) updateData.width_cm = updates.width_cm;
      if (updates.depth_cm !== undefined) updateData.depth_cm = updates.depth_cm;
      if (updates.height_cm !== undefined) updateData.height_cm = updates.height_cm;
      if (updates.brand) updateData.brand = updates.brand;
      if (updates.material) updateData.material = updates.material;
      if (updates.color) updateData.color = updates.color;
      if (updates.stock_quantity !== undefined) updateData.stock_quantity = updates.stock_quantity;

      await FurnitureCatalogAPI.update(updateData);

      set((state) => ({
        products: state.products.map((p) =>
          p.id === id ? { ...p, ...updates, imageUrl: imageUrl || p.imageUrl } : p
        ),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error updating product:', error);
      set({ error: 'Erreur lors de la mise à jour du produit', isLoading: false });
    }
  },

  deleteProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await FurnitureCatalogAPI.delete(id);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error deleting product:', error);
      set({ error: 'Erreur lors de la suppression du produit', isLoading: false });
    }
  },

  getProductsByType: (type) => {
    return get().products.filter((p) => p.type === type);
  },
}));
