-- Supabase SQL Migration for Product Catalog

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('desk', 'chair', 'meeting-table', 'storage', 'lighting', 'decoration', 'other')),
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read products
CREATE POLICY "Products are viewable by everyone"
ON products FOR SELECT
USING (true);

-- Policy: Authenticated users can insert products
CREATE POLICY "Authenticated users can insert products"
ON products FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update their products
CREATE POLICY "Authenticated users can update products"
ON products FOR UPDATE
USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete their products
CREATE POLICY "Authenticated users can delete products"
ON products FOR DELETE
USING (auth.role() = 'authenticated');

-- Create index on type for faster filtering
CREATE INDEX IF NOT EXISTS products_type_idx ON products(type);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS products_created_at_idx ON products(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage policy: Anyone can read product images
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Storage policy: Authenticated users can upload product images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Storage policy: Authenticated users can delete product images
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
