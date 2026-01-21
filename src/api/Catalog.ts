import { supabase } from '../lib/supabase/client';
import type { 
  FurnitureItem, 
  CreateFurnitureInput, 
  UpdateFurnitureInput,
  FurnitureFilters 
} from '../types/furniture';

export class FurnitureCatalogAPI {
  
  /**
   * Récupérer tous les articles du catalogue avec filtres optionnels
   */
  static async getAll(filters?: FurnitureFilters): Promise<FurnitureItem[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    let query = supabase
      .from('furniture_catalog')
      .select('*')
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.is_available !== undefined) {
      query = query.eq('is_available', filters.is_available);
    }
    if (filters?.min_price !== undefined) {
      query = query.gte('price', filters.min_price);
    }
    if (filters?.max_price !== undefined) {
      query = query.lte('price', filters.max_price);
    }
    if (filters?.brand) {
      query = query.eq('brand', filters.brand);
    }
    if (filters?.color) {
      query = query.eq('color', filters.color);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching furniture catalog: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Récupérer un article par son ID
   */
  static async getById(id: string): Promise<FurnitureItem | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('furniture_catalog')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Error fetching furniture item: ${error.message}`);
    }

    return data;
  }

  /**
   * Créer un nouvel article dans le catalogue
   */
  static async create(input: CreateFurnitureInput): Promise<FurnitureItem> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('furniture_catalog')
      .insert([input])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating furniture item: ${error.message}`);
    }

    return data;
  }

  /**
   * Mettre à jour un article existant
   */
  static async update(input: UpdateFurnitureInput): Promise<FurnitureItem> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { id, ...updateData } = input;

    const { data, error } = await supabase
      .from('furniture_catalog')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating furniture item: ${error.message}`);
    }

    return data;
  }

  /**
   * Supprimer un article
   */
  static async delete(id: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase
      .from('furniture_catalog')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting furniture item: ${error.message}`);
    }
  }

  /**
   * Uploader une image dans le bucket Supabase
   */
  static async uploadImage(file: File, fileName?: string): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const fileExt = file.name.split('.').pop();
    const uniqueFileName = fileName || `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('furniture-images')
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Error uploading image: ${error.message}`);
    }

    // Obtenir l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from('furniture-images')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  /**
   * Supprimer une image du bucket
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Extraire le nom du fichier de l'URL
    const fileName = imageUrl.split('/').pop();
    if (!fileName) {
      throw new Error('Invalid image URL');
    }

    const { error } = await supabase.storage
      .from('furniture-images')
      .remove([fileName]);

    if (error) {
      throw new Error(`Error deleting image: ${error.message}`);
    }
  }

  /**
   * Rechercher dans le catalogue
   */
  static async search(searchTerm: string): Promise<FurnitureItem[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('furniture_catalog')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error searching furniture catalog: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtenir les catégories disponibles avec le nombre d'articles
   */
  static async getCategoryCounts(): Promise<Record<string, number>> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('furniture_catalog')
      .select('category')
      .eq('is_available', true);

    if (error) {
      throw new Error(`Error fetching categories: ${error.message}`);
    }

    const counts: Record<string, number> = {};
    data?.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });

    return counts;
  }
}
