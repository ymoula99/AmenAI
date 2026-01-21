import { createClient } from '@supabase/supabase-js';
import { ProductType } from '../catalogStore';

// Use existing Supabase config from /lib/supabase/storage.ts pattern
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface SupabaseProduct {
  id: string;
  name: string;
  description: string;
  type: ProductType;
  price: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Upload product image to Supabase Storage
 */
export async function uploadProductImage(
  file: File,
  productId: string
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${productId}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Create a new product in Supabase
 */
export async function createProduct(product: {
  name: string;
  description: string;
  type: ProductType;
  price: number;
  imageFile?: File;
}): Promise<SupabaseProduct> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Insert product first to get ID
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: product.name,
      description: product.description,
      type: product.type,
      price: product.price,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`);
  }

  // Upload image if provided
  if (product.imageFile) {
    try {
      const imageUrl = await uploadProductImage(product.imageFile, data.id);
      
      // Update product with image URL
      const { data: updatedData, error: updateError } = await supabase
        .from('products')
        .update({ image_url: imageUrl })
        .eq('id', data.id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update image URL:', updateError);
        return data;
      }

      return updatedData;
    } catch (uploadError) {
      console.error('Failed to upload image:', uploadError);
      return data;
    }
  }

  return data;
}

/**
 * Get all products from Supabase
 */
export async function getProducts(): Promise<SupabaseProduct[]> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  return data;
}

/**
 * Get products by type
 */
export async function getProductsByType(type: ProductType): Promise<SupabaseProduct[]> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('type', type)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  return data;
}

/**
 * Update a product
 */
export async function updateProduct(
  id: string,
  updates: {
    name?: string;
    description?: string;
    type?: ProductType;
    price?: number;
    imageFile?: File;
  }
): Promise<SupabaseProduct> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Upload new image if provided
  if (updates.imageFile) {
    try {
      const imageUrl = await uploadProductImage(updates.imageFile, id);
      updates = { ...updates, imageFile: undefined } as any;
      (updates as any).image_url = imageUrl;
    } catch (uploadError) {
      console.error('Failed to upload image:', uploadError);
    }
  }

  // Remove imageFile from updates
  const { imageFile, ...dbUpdates } = updates as any;

  const { data, error } = await supabase
    .from('products')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`);
  }

  return data;
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Get product to find image path
  const { data: product } = await supabase
    .from('products')
    .select('image_url')
    .eq('id', id)
    .single();

  // Delete image from storage if exists
  if (product?.image_url) {
    try {
      const path = product.image_url.split('/product-images/')[1];
      if (path) {
        await supabase.storage
          .from('product-images')
          .remove([path]);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  }

  // Delete product from database
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!supabase;
}

/**
 * Migrate localStorage products to Supabase
 */
export async function migrateLocalStorageToSupabase(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const localData = localStorage.getItem('amen-catalog-storage');
  if (!localData) {
    return { success: 0, failed: 0, errors: ['No local data found'] };
  }

  const parsed = JSON.parse(localData);
  const products = parsed.state?.products || [];

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const product of products) {
    try {
      // Convert base64 image to File if needed
      let imageFile: File | undefined;
      if (product.imageUrl && product.imageUrl.startsWith('data:')) {
        const response = await fetch(product.imageUrl);
        const blob = await response.blob();
        imageFile = new File([blob], `${product.name}.jpg`, { type: blob.type });
      }

      await createProduct({
        name: product.name,
        description: product.description,
        type: product.type,
        price: product.price,
        imageFile,
      });

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`${product.name}: ${(error as Error).message}`);
    }
  }

  return results;
}
