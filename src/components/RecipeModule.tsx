import React, { useState } from 'react';
import { 
  BookOpen, Plus, Trash2, CheckCircle2, DollarSign, 
  ChevronRight, AlertCircle, Edit, Save, Calculator
} from 'lucide-react';
import { Product, RawMaterial, Recipe, RecipeItem } from '../types';
import { calculateProductHpp } from '../data';

interface RecipeProps {
  products: Product[];
  rawMaterials: RawMaterial[];
  recipes: Recipe[];
  onSaveRecipe: (recipe: Recipe) => void;
  onUpdateProductHppOverride: (productId: string, hppOverride?: number) => void;
  currentUser: { name: string };
  onAddAuditLog: (action: string, module: string, details: string) => void;
}

export default function RecipeModule({
  products,
  rawMaterials,
  recipes,
  onSaveRecipe,
  onUpdateProductHppOverride,
  currentUser,
  onAddAuditLog
}: RecipeProps) {
  // States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [editingItems, setEditingItems] = useState<RecipeItem[]>([]);
  
  // HPP Override state
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideValue, setOverrideValue] = useState('');

  // Starting state for new recipe row
  const [selectedRawIdForAdd, setSelectedRawIdForAdd] = useState('');
  const [quantityForAdd, setQuantityForAdd] = useState('');

  // Find recipe for selected product
  const getRecipeForProduct = (productId: string) => {
    return recipes.find(r => r.productId === productId);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    const recipe = getRecipeForProduct(product.id);
    setEditingItems(recipe ? [...recipe.items] : []);
    setIsEditingRecipe(false);
  };

  // Add Item to active editing list
  const handleAddIngredient = () => {
    if (!selectedRawIdForAdd || !quantityForAdd) {
      alert("⚠️ Pilih bahan baku dan isi besaran kuantitas resep.");
      return;
    }

    const qty = Number(quantityForAdd);
    if (isNaN(qty) || qty <= 0) {
      alert("⚠️ Kuantitas resep tidak boleh 0.");
      return;
    }

    const exists = editingItems.find(item => item.rawMaterialId === selectedRawIdForAdd);
    if (exists) {
      alert("⚠️ Bahan baku tersebut sudah ada di resep ini. silakan sesuaikan kuantitas atau hapus terlebih dahulu.");
      return;
    }

    setEditingItems(prev => [...prev, {
      rawMaterialId: selectedRawIdForAdd,
      quantity: qty
    }]);

    setSelectedRawIdForAdd('');
    setQuantityForAdd('');
  };

  // Delete ingredient from active editing list
  const handleRemoveIngredient = (rmId: string) => {
    setEditingItems(prev => prev.filter(item => item.rawMaterialId !== rmId));
  };

  // Save Recipe configurations
  const handleSaveRecipeDetails = () => {
    if (!selectedProduct) return;

    const newRecipeObj: Recipe = {
      productId: selectedProduct.id,
      items: editingItems
    };

    onSaveRecipe(newRecipeObj);
    setIsEditingRecipe(false);
    onAddAuditLog('Save Recipe BOM', 'Recipe', `Updated recipes configuration for ${selectedProduct.name} with ${editingItems.length} items`);
    alert(`✅ Resep (BOM) untuk ${selectedProduct.name} berhasil disimpan!`);
  };

  const handleOpenOverrideModal = () => {
    if (!selectedProduct) return;
    setOverrideValue(selectedProduct.hppManual?.toString() || '');
    setShowOverrideModal(true);
  };

  const handleSaveHppManualOverride = () => {
    if (!selectedProduct) return;
    const val = overrideValue.trim() === '' ? undefined : Number(overrideValue);
    if (val !== undefined && (isNaN(val) || val < 0)) {
      alert("⚠️ HPP Manual harus valid.");
      return;
    }

    onUpdateProductHppOverride(selectedProduct.id, val);
    
    // Update active selectedProduct model locally
    setSelectedProduct(prev => prev ? { ...prev, hppManual: val } : null);

    onAddAuditLog('HPP Override', 'Recipe', `Updated manual HPP for ${selectedProduct.name} to Rp ${val ? val.toLocaleString('id-ID') : 'Auto'}`);
    setShowOverrideModal(false);
    alert(`✅ HPP Manual untuk ${selectedProduct.name} berhasil disetel!`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 h-full overflow-y-auto">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left Side: Product Menu List */}
        <div className="w-full lg:w-96 bg-[#16251D] border border-[#2C4737] p-4 rounded-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#2C4737] pb-3">
            <BookOpen className="h-4.5 w-4.5 text-[#85A947]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">RESEP MENU PRICING HPP</h3>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {products.map((p) => {
              const hasRecipe = recipes.some(r => r.productId === p.id);
              const calculatedHpp = calculateProductHpp(p.id, recipes, rawMaterials, products);
              const margin = p.price > 0 ? ((p.price - calculatedHpp) / p.price) * 100 : 0;
              const isSelected = selectedProduct?.id === p.id;

              return (
                <button
                  id={`recipe-prod-row-${p.id}`}
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    isSelected 
                      ? 'bg-[#123524] border-[#85A947]' 
                      : 'bg-[#111E17] border-[#2C4737] hover:bg-[#1C3125]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white truncate max-w-[200px]">{p.name}</h4>
                      <p className="font-mono text-[10px] text-[#CFCFCF] mt-1">HPP: Rp {calculatedHpp.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs font-bold text-[#85A947]">Rp {p.price.toLocaleString('id-ID')}</p>
                      <span className="text-[9px] font-mono block text-[#CFCFCF]/50 mt-1">Marg: {margin.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-[#2C4737]/30">
                    <span className={`text-[9.5px] font-mono uppercase ${hasRecipe ? 'text-[#85A947]' : 'text-amber-500'}`}>
                      {hasRecipe ? 'BOM Terpasang' : 'Belum Ada Resep'}
                    </span>
                    {p.hppManual !== undefined && (
                      <span className="text-[9px] font-mono px-1 bg-blue-950 text-blue-400 border border-blue-900 leading-none uppercase">Manual</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Ingredient Configuration Detail */}
        <div className="flex-1 bg-[#16251D] border border-[#2C4737] p-5 rounded-xl text-white">
          {selectedProduct ? (
            <div className="space-y-6">
              
              {/* Product Info Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#2C4737] pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedProduct.image || '☕'}</span>
                    <h2 className="text-base font-bold text-white uppercase tracking-wider">{selectedProduct.name}</h2>
                  </div>
                  <p className="text-xs text-[#CFCFCF] mt-1">Atur resep komprehensif (BOM - Bill of Material) untuk resep menu ini.</p>
                </div>

                <div className="flex gap-2">
                  <button
                    id="btn-override-hpp"
                    onClick={handleOpenOverrideModal}
                    className="px-3 py-1.5 bg-[#123524] hover:bg-[#1C3125] border border-[#2C4737] text-xs text-[#85A947] font-mono font-semibold rounded"
                  >
                    Set HPP Manual
                  </button>

                  {!isEditingRecipe ? (
                    <button
                      id="btn-edit-recipe-ingredients"
                      onClick={() => {
                        setIsEditingRecipe(true);
                        const recipe = getRecipeForProduct(selectedProduct.id);
                        setEditingItems(recipe ? [...recipe.items] : []);
                      }}
                      className="px-4 py-1.5 bg-[#85A947] text-[#123524] font-bold text-xs rounded-lg flex items-center gap-1.5"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Ubah Resep</span>
                    </button>
                  ) : (
                    <button
                      id="btn-save-recipe-ingredients"
                      onClick={handleSaveRecipeDetails}
                      className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Simpan Resep</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Financial calculations preview metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5 bg-[#111E17] p-4 border border-[#2C4737] rounded-lg">
                <div className="space-y-1">
                  <span className="text-[10px] text-[#CFCFCF] uppercase font-mono tracking-wider block">Harga Jual Menu</span>
                  <p className="font-mono text-df text-white font-bold">Rp {selectedProduct.price.toLocaleString('id-ID')}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-[#CFCFCF] uppercase font-mono tracking-wider block">HPP Terhitung (Sistem)</span>
                  <p className="font-mono text-df text-[#85A947] font-semibold">
                    Rp {calculateProductHpp(selectedProduct.id, recipes, rawMaterials, products).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-[#CFCFCF] uppercase font-mono tracking-wider block">Status Margin Profit</span>
                  <p className="font-mono text-df text-white font-bold">
                    {((selectedProduct.price - calculateProductHpp(selectedProduct.id, recipes, rawMaterials, products)) / selectedProduct.price * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Ingredients Form / Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-white tracking-widest">Detail Resep Bahan Baku (BOM)</h3>
                
                {isEditingRecipe && (
                  <div className="bg-[#111E17] p-3 border border-[#2C4737]/60 rounded-lg flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] text-[#CFCFCF] mb-1 font-mono uppercase">Bahan Baku</label>
                      <select
                        id="recipe-add-raw-select"
                        value={selectedRawIdForAdd}
                        onChange={(e) => setSelectedRawIdForAdd(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#16251D] border border-[#2C4737] rounded text-xs text-white"
                      >
                        <option value="">-- Pilih Bahan --</option>
                        {rawMaterials.map(rm => (
                          <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full md:w-36">
                      <label className="block text-[10px] text-[#CFCFCF] mb-1 font-mono uppercase">Kebutuhan Resep</label>
                      <input
                        id="recipe-add-qty-input"
                        type="number"
                        placeholder="Kuantitas..."
                        value={quantityForAdd}
                        onChange={(e) => setQuantityForAdd(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#16251D] border border-[#2C4737] rounded text-xs text-right pr-6"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        id="btn-add-ingredient-item"
                        onClick={handleAddIngredient}
                        className="w-full md:w-auto px-4 py-1.5 bg-[#85A947] text-[#123524] font-bold text-xs rounded"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                )}

                {/* Items Lists Map */}
                <div className="bg-[#111E17] border border-[#2C4737] rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#2C4737] text-[#CFCFCF] bg-[#123524]/20 font-mono">
                        <th className="p-3">Bahan Baku</th>
                        <th className="p-3 font-mono text-center">Kuantitas Terpakai</th>
                        <th className="p-3 font-mono text-right">Cost Kontribusi (Rp)</th>
                        {isEditingRecipe && <th className="p-3 text-right">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2C4737]/30">
                      {editingItems.map((item) => {
                        const raw = rawMaterials.find(r => r.id === item.rawMaterialId);
                        const costContribution = raw ? item.quantity * raw.averageCost : 0;
                        return (
                          <tr key={item.rawMaterialId} className="hover:bg-[#1C3125]/20">
                            <td className="p-3 font-semibold">{raw ? raw.name : 'Unknown Raw Material'}</td>
                            <td className="p-3 font-mono text-center">
                              {item.quantity.toLocaleString('id-ID')} {raw?.unit}
                            </td>
                            <td className="p-3 font-mono text-right">
                              Rp {costContribution.toLocaleString('id-ID')}
                            </td>
                            {isEditingRecipe && (
                              <td className="p-3 text-right">
                                <button
                                  id={`btn-del-ingredient-${item.rawMaterialId}`}
                                  onClick={() => handleRemoveIngredient(item.rawMaterialId)}
                                  className="p-1.5 hover:bg-red-950/40 text-red-400 rounded transition"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}

                      {editingItems.length === 0 && (
                        <tr>
                          <td colSpan={isEditingRecipe ? 4 : 3} className="p-8 text-center text-[#CFCFCF]/50">
                            Belum ada resep terpasang untuk menu ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full py-24 text-center text-[#CFCFCF]/50 flex flex-col items-center justify-center space-y-3">
              <BookOpen className="h-10 w-10 text-[#CFCFCF]/20" />
              <p className="text-sm">Silakan pilih produk makanan atau minuman di panel kiri untuk mengonfigurasi Resep (BOM) & HPP.</p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: HPP Manual Override Setting */}
      {showOverrideModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1812]/90 p-4">
          <div className="bg-[#16251D] border border-[#2C4737] p-6 rounded-xl max-w-sm w-full text-white space-y-4">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-[#85A947]">Set Overide HPP Manual</h3>
            
            <p className="text-xs text-[#CFCFCF]">Atur nominal HPP manual. Kosongkan nilai untuk kembali menggunakan perhitungan resep (BOM) otomatis.</p>

            <div className="bg-[#111E17] border border-[#2C4737] p-3 rounded text-xs">
              <p><strong>Item Menu:</strong> {selectedProduct.name}</p>
              <p><strong>Harga Jual:</strong> Rp {selectedProduct.price.toLocaleString('id-ID')}</p>
            </div>

            <div>
              <label className="block text-[10px] text-[#CFCFCF] font-semibold mb-1 uppercase font-mono">Nilai HPP Baru (Rp)</label>
              <input
                id="hpp-override-input"
                type="number"
                placeholder="Biarkan kosong untuk kalkulasi BOM..."
                value={overrideValue}
                onChange={(e) => setOverrideValue(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#111E17] border border-[#2C4737] rounded text-sm text-right pr-6 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="btn-close-override"
                onClick={() => setShowOverrideModal(false)}
                className="w-full py-2 border border-[#2C4737] text-xs font-semibold rounded transition"
              >
                Batal
              </button>
              <button
                id="btn-save-override"
                onClick={handleSaveHppManualOverride}
                className="w-full py-2 bg-[#85A947] text-[#123524] font-bold text-xs rounded shadow-md"
              >
                Simpan Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
