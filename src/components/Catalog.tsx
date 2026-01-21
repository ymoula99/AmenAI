import { useState, useEffect } from 'react';
import { useCatalogStore, ProductType, CatalogProduct } from '../lib/catalogStore';
import { Upload, X, Plus, Trash2, Edit2, Package, Loader2 } from 'lucide-react';

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: 'desk', label: 'Bureaux' },
  { value: 'chair', label: 'Chaises' },
  { value: 'meeting-table', label: 'Tables de réunion' },
  { value: 'storage', label: 'Rangements' },
  { value: 'lighting', label: 'Éclairage' },
  { value: 'decoration', label: 'Décoration' },
  { value: 'other', label: 'Autre' },
];

export default function Catalog() {
  const { products, isLoading, error, loadProducts, addProduct, updateProduct, deleteProduct } = useCatalogStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ProductType | 'all'>('all');

  // Charger les produits au montage du composant
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'desk' as ProductType,
    price: 0,
    imageUrl: '',
    width_cm: 100,
    depth_cm: 50,
    height_cm: 75,
    brand: '',
    material: '',
    color: '',
    stock_quantity: 10,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing product
      await updateProduct(editingId, {
        ...formData,
        ...(imageFile && { imageFile }),
        ...(imagePreview && { imageUrl: imagePreview }),
      });
      setEditingId(null);
    } else {
      // Add new product
      await addProduct({
        ...formData,
        ...(imageFile && { imageFile }),
        ...(imagePreview && { imageUrl: imagePreview }),
      });
    }

    // Reset form
    setFormData({ 
      name: '', 
      description: '', 
      type: 'desk', 
      price: 0, 
      imageUrl: '',
      width_cm: 100,
      depth_cm: 50,
      height_cm: 75,
      brand: '',
      material: '',
      color: '',
      stock_quantity: 10,
    });
    setImageFile(null);
    setImagePreview('');
    setIsAdding(false);
  };

  const handleEdit = (product: CatalogProduct) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      type: product.type,
      price: product.price,
      imageUrl: product.imageUrl || '',
      width_cm: product.width_cm || 100,
      depth_cm: product.depth_cm || 50,
      height_cm: product.height_cm || 75,
      brand: product.brand || '',
      material: product.material || '',
      color: product.color || '',
      stock_quantity: product.stock_quantity || 10,
    });
    setImagePreview(product.imageUrl || '');
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ 
      name: '', 
      description: '', 
      type: 'desk', 
      price: 0, 
      imageUrl: '',
      width_cm: 100,
      depth_cm: 50,
      height_cm: 75,
      brand: '',
      material: '',
      color: '',
      stock_quantity: 10,
    });
    setImageFile(null);
    setImagePreview('');
  };

  const filteredProducts = filterType === 'all' 
    ? products 
    : products.filter(p => p.type === filterType);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Package className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-light uppercase tracking-widest">Catalogue Produits</h1>
                <p className="text-sm text-gray-400 mt-1">{products.length} produit{products.length !== 1 ? 's' : ''} au catalogue</p>
              </div>
            </div>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-gray-200 transition-colors uppercase tracking-widest text-sm font-light"
            >
              <Plus className="w-4 h-4" />
              Ajouter un produit
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="border-b border-white/10 bg-white/5">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-8">
                {/* Left: Image Upload */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-4">
                      Photo du produit
                    </label>
                    <div className="aspect-square bg-black border border-white/20 relative group">
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview('');
                              setImageFile(null);
                            }}
                            className="absolute top-4 right-4 p-2 bg-black/80 hover:bg-black transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                          <Upload className="w-12 h-12 text-gray-600 mb-4" />
                          <span className="text-sm text-gray-500 uppercase tracking-widest">Cliquer pour uploader</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* URL de l'image */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                      URL de l'image
                    </label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, imageUrl: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      className="w-full bg-transparent border-b-2 border-white/20 focus:border-white outline-none py-2 text-white transition-colors text-sm"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  {/* Dimensions */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-3">
                      Dimensions (cm)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <input
                          type="number"
                          value={formData.width_cm}
                          onChange={(e) => setFormData({ ...formData, width_cm: parseFloat(e.target.value) })}
                          className="w-full bg-transparent border-b-2 border-white/20 focus:border-white outline-none py-2 text-white transition-colors text-center"
                          placeholder="Largeur"
                          step="0.1"
                          min="0"
                        />
                        <div className="text-xs text-gray-500 mt-1 text-center">L</div>
                      </div>
                      <div>
                        <input
                          type="number"
                          value={formData.depth_cm}
                          onChange={(e) => setFormData({ ...formData, depth_cm: parseFloat(e.target.value) })}
                          className="w-full bg-transparent border-b-2 border-white/20 focus:border-white outline-none py-2 text-white transition-colors text-center"
                          placeholder="Prof."
                          step="0.1"
                          min="0"
                        />
                        <div className="text-xs text-gray-500 mt-1 text-center">P</div>
                      </div>
                      <div>
                        <input
                          type="number"
                          value={formData.height_cm}
                          onChange={(e) => setFormData({ ...formData, height_cm: parseFloat(e.target.value) })}
                          className="w-full bg-transparent border-b-2 border-white/20 focus:border-white outline-none py-2 text-white transition-colors text-center"
                          placeholder="Hauteur"
                          step="0.1"
                          min="0"
                        />
                        <div className="text-xs text-gray-500 mt-1 text-center">H</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Form Fields */}
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                      Nom du produit
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-transparent border-b-2 border-white/20 focus:border-white outline-none py-2 text-white transition-colors"
                      placeholder="Ex: Bureau Steelcase Ology"
                      required
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as ProductType })}
                      className="w-full bg-black border-b-2 border-white/20 focus:border-white outline-none py-2 text-white uppercase tracking-widest text-sm"
                    >
                      {PRODUCT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                      Prix (€)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full bg-transparent border-b-2 border-white/20 focus:border-white outline-none py-2 text-white transition-colors"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-transparent border-b-2 border-white/20 focus:border-white outline-none py-2 text-white transition-colors resize-none"
                      placeholder="Description détaillée du produit..."
                      rows={3}
                      required
                    />
                  </div>

                  {/* Brand, Material, Color */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                        Marque
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full bg-transparent border-b-2 border-white/20 focus:border-white outline-none py-2 text-white transition-colors"
                        placeholder="Ex: Herman Miller"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                        Couleur
                      </label>
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-full bg-transparent border-b-2 border-white/20 focus:border-white outline-none py-2 text-white transition-colors"
                        placeholder="Ex: Noir"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                        Matériau
                      </label>
                      <input
                        type="text"
                        value={formData.material}
                        onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                        className="w-full bg-transparent border-b-2 border-white/20 focus:border-white outline-none py-2 text-white transition-colors"
                        placeholder="Ex: Bois, Métal..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                        Stock
                      </label>
                      <input
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                        className="w-full bg-transparent border-b-2 border-white/20 focus:border-white outline-none py-2 text-white transition-colors"
                        placeholder="10"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border border-white/20 hover:bg-white/5 transition-colors uppercase tracking-widest text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-white text-black hover:bg-gray-200 transition-colors uppercase tracking-widest text-sm"
                >
                  {editingId ? 'Mettre à jour' : 'Ajouter au catalogue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 text-xs uppercase tracking-widest transition-colors whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-white text-black'
                  : 'border border-white/20 hover:bg-white/5'
              }`}
            >
              Tous ({products.length})
            </button>
            {PRODUCT_TYPES.map((type) => {
              const count = products.filter(p => p.type === type.value).length;
              return (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={`px-4 py-2 text-xs uppercase tracking-widest transition-colors whitespace-nowrap ${
                    filterType === type.value
                      ? 'bg-white text-black'
                      : 'border border-white/20 hover:bg-white/5'
                  }`}
                >
                  {type.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && products.length === 0 && (
          <div className="text-center py-16">
            <Loader2 className="w-16 h-16 text-gray-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500 uppercase tracking-widest text-sm">
              Chargement du catalogue...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 uppercase tracking-widest text-sm">
              Aucun produit dans cette catégorie
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white/5 border border-white/10 hover:border-white/30 transition-colors group">
                {/* Image */}
                <div className="aspect-square bg-black relative overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="w-12 h-12 text-gray-700" />
                    </div>
                  )}
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-3 bg-white text-black hover:bg-gray-200 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer "${product.name}" ?`)) {
                          deleteProduct(product.id);
                        }
                      }}
                      className="p-3 bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                    {PRODUCT_TYPES.find(t => t.value === product.type)?.label}
                    {product.brand && <span className="ml-2">• {product.brand}</span>}
                  </div>
                  <h3 className="text-lg font-light mb-2 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{product.description}</p>
                  
                  {/* Dimensions */}
                  {(product.width_cm || product.depth_cm || product.height_cm) && (
                    <div className="text-xs text-gray-500 mb-2">
                      📏 {product.width_cm}×{product.depth_cm}×{product.height_cm} cm
                    </div>
                  )}
                  
                  {/* Material & Color */}
                  <div className="flex gap-2 mb-3 text-xs text-gray-500">
                    {product.material && <span>🔨 {product.material}</span>}
                    {product.color && <span>🎨 {product.color}</span>}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-light">{product.price.toFixed(2)} €</div>
                    {product.stock_quantity !== undefined && (
                      <div className="text-xs text-gray-500">
                        Stock: {product.stock_quantity}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
