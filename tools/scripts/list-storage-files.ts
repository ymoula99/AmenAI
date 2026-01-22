import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listStorageFiles() {
  const { data, error } = await supabase.storage.from('furniture-images').list();
  
  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }
  
  console.log('📁 Fichiers dans furniture-images:');
  data?.forEach((file) => {
    console.log(`  - ${file.name} (${Math.round(file.metadata.size / 1024)} KB)`);
  });
  
  console.log(`\n✅ Total: ${data?.length} fichiers`);
}

listStorageFiles();
