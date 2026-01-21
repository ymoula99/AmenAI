export type FurnitureCategory = 
  | 'desk' 
  | 'chair' 
  | 'storage' 
  | 'meeting_table' 
  | 'accessories'
  | 'cabinet'
  | 'sofa'
  | 'lighting';

export interface FurnitureDimensions {
  width_cm: number;
  depth_cm: number;
  height_cm: number;
}

export interface FurnitureItem {
  id: string;
  name: string;
  description?: string;
  category: FurnitureCategory;
  price: number;
  
  // Dimensions
  width_cm: number;
  depth_cm: number;
  height_cm: number;
  
  // Image
  image_url: string;
  
  // Métadonnées
  brand?: string;
  material?: string;
  color?: string;
  stock_quantity: number;
  is_available: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateFurnitureInput {
  name: string;
  description?: string;
  category: FurnitureCategory;
  price: number;
  width_cm: number;
  depth_cm: number;
  height_cm: number;
  image_url: string;
  brand?: string;
  material?: string;
  color?: string;
  stock_quantity?: number;
  is_available?: boolean;
}

export interface UpdateFurnitureInput extends Partial<CreateFurnitureInput> {
  id: string;
}

export interface FurnitureFilters {
  category?: FurnitureCategory;
  min_price?: number;
  max_price?: number;
  is_available?: boolean;
  brand?: string;
  color?: string;
}
