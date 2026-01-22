import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createBucket() {
  console.log('Création du bucket furniture-images...');
  
  const { data, error } = await supabase.storage.createBucket('furniture-images', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  });

  if (error) {
    console.error('Erreur:', error.message);
    return;
  }

  console.log('✅ Bucket créé:', data);
}

createBucket();
