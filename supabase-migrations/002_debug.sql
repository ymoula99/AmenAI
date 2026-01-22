-- Test direct dans Supabase SQL Editor

-- 1. Compter tous les produits
SELECT COUNT(*) as total_products FROM furniture_catalog;

-- 2. Compter les produits disponibles
SELECT COUNT(*) as available_products FROM furniture_catalog WHERE is_available = true;

-- 3. Voir l'état de is_available de tous les produits
SELECT id, name, price, category, is_available FROM furniture_catalog ORDER BY created_at DESC;

-- 4. Si is_available est NULL ou false pour tous, met-les à true:
-- UPDATE furniture_catalog SET is_available = true WHERE is_available IS NULL OR is_available = false;
