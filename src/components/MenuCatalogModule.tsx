import React, { useState } from 'react';
import { Product, Category } from '../types';
import { Search, ToggleLeft, ToggleRight, Plus, Pencil, Tag, ShoppingBag, Eye, EyeOff } from 'lucide-react';

interface MenuCatalogModuleProps {
  products: Product[];
  categories: Category[];
  onCreateProduct: (newProduct: Product) => void;
  onModifyProduct: (modProduct: Product) => void;
  currentUser: { role: string };
  onAddAuditLog: (action: string, module: string, details: string) => void;
}

export default function MenuCatalogModule({
  products,
  categories,
  onCreateProduct,
  onModifyProduct,
  currentUser,
  onAddAuditLog
}: MenuCatalogModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  // Form states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCatId, setFormCatId] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);
  const [formImage, setFormImage] = useState('☕');

  const canEdit = currentUser.role === 'owner' || currentUser.role === 'manager';

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormPrice('25000');
    setFormCatId(categories[0]?.id || '');
    setFormAvailable(true);
    setFormImage('☕');
    setShowFormModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingId(p.id);
    setFormName(p.name);
    setFormPrice(p.price.toString());
    setFormCatId(p.categoryId);
    setFormAvailable(p.isAvailable);
    setFormImage(p.image || '☕');
    setShowFormModal(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) {
      alert('⚠️ Harap lengkapi semua isian produk!');
      return;
    }

    const priceNum = Number(formPrice);
    if (priceNum <= 0) {
      alert('⚠️ Harga jual produk harus berupa angka positif!');
      return;
    }

    if (editingId) {
      // Modify existing
      const updated: Product = {
        id: editingId,
        name: formName.trim(),
        price: priceNum,
        categoryId: formCatId,
        isAvailable: formAvailable,
        image: formImage
      };
      onModifyProduct(updated);
      onAddAuditLog('Edit Product', 'Menu Catalog', `Modified menu item "${updated.name}" through dynamic catalog tab.`);
    } else {
      // Create new
      const neu: Product = {
        id: `prod_${Date.now()}`,
        name: formName.trim(),
        price: priceNum,
        categoryId: formCatId,
        isAvailable: formAvailable,
        image: formImage
      };
      onCreateProduct(neu);
      onAddAuditLog('Create Product', 'Menu Catalog', `Registered and added product "${neu.name}" with price Rp ${neu.price} to core catalog.`);
    }

    setShowFormModal(false);
  };

  const handleToggleAvailability = (p: Product) => {
    const updated = { ...p, isAvailable: !p.isAvailable };
    onModifyProduct(updated);
    onAddAuditLog(
      'Toggle Product',
      'Menu Catalog',
      `Toggled sale availability of "${p.name}" to ${updated.isAvailable ? 'AVAILABLE' : 'ARCHIVED'}`
    );
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCat === 'all' || p.categoryId === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 h-full overflow-y-auto font-sans">
      
      {/* Header controls pane */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="space-y-1 self-start">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">KATALOG & DAFTAR MENU JUAL</h2>
          <p className="text-[10px] text-slate-400 font-semibold">Kelola list menu makanan, minuman, dan status ketersediaan POS.</p>
        </div>

        {canEdit && (
          <button
            id="catalog-add-btn"
            onClick={handleOpenAdd}
            className="w-full md:w-auto px-4 py-2.5 bg-[#123524] hover:bg-[#1A3F2C] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Menu Jual</span>
          </button>
        )}
      </div>

      {/* Filter toolbar cards block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="bento-card md:col-span-2 relative !p-2 flex items-center">
          <Search className="absolute left-6 h-4 w-4 text-slate-400" />
          <input
            id="catalog-search"
            type="text"
            placeholder="Cari menu berdasarkan nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-850 placeholder-slate-400 font-semibold focus:outline-none focus:border-[#85A947]"
          />
        </div>

        {/* Category select block */}
        <div className="bento-card !p-2 flex items-center">
          <select
            id="catalog-cat-filter"
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:border-[#85A947]"
          >
            <option value="all">Semua Kategori Cafe</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bento grid products menu display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map(p => {
          const cat = categories.find(c => c.id === p.categoryId);
          return (
            <div
              key={p.id}
              className={`bento-card relative flex flex-col justify-between overflow-hidden transition-all border ${
                p.isAvailable ? 'border-slate-200' : 'border-red-200 bg-red-50/20 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="space-y-3">
                {/* Visual top bar of card */}
                <div className="flex justify-between items-start">
                  <span className="text-3xl p-3 bg-slate-50 rounded-2xl border border-slate-100 block shadow-sm">
                    {p.image || '☕'}
                  </span>
                  <div className="text-right">
                    <span className="text-[8.5px] uppercase font-mono tracking-widest text-[#4D7C0F] block font-black">
                      {cat ? cat.name : 'OTHER'}
                    </span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-mono leading-none font-bold mt-1 uppercase ${
                      p.isAvailable 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {p.isAvailable ? 'READY' : 'KOSONG'}
                    </span>
                  </div>
                </div>

                {/* Primary stats */}
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-800 tracking-wide line-clamp-1">{p.name}</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-slate-400 font-mono font-bold">Rp</span>
                    <span className="text-sm font-black font-mono text-[#123524]">
                      {p.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons (only displayed if user role has permissions) */}
              <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between text-[10px] font-mono">
                {canEdit ? (
                  <>
                    <button
                      id={`edit-prod-item-${p.id}`}
                      onClick={() => handleOpenEdit(p)}
                      className="text-amber-700 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Ubah</span>
                    </button>

                    <button
                      id={`toggle-prod-avail-${p.id}`}
                      onClick={() => handleToggleAvailability(p)}
                      className={`flex items-center gap-1 font-bold font-mono uppercase cursor-pointer ${
                        p.isAvailable ? 'text-green-700 hover:underline' : 'text-red-700 hover:underline'
                      }`}
                      title="Klik untuk ubah status ketersediaan"
                    >
                      {p.isAvailable ? (
                        <>
                          <Eye className="h-3 w-3 text-green-700" />
                          <span>Ready</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 text-red-700" />
                          <span>Kosong</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <span className="text-slate-400 block text-center w-full">POS active integration</span>
                )}
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl text-slate-400 font-mono text-xs font-bold shadow-xs">
            ☕ Belum ada daftar menu barang yang sesuai pencarian/kategori Anda.
          </div>
        )}
      </div>

      {/* MODAL: Catalog Form */}
      {showFormModal && (
        <div id="catalog-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-xs">
          <form onSubmit={handleSaveSubmit} className="bg-white border border-slate-200 p-6 rounded-2xl max-w-sm w-full text-slate-800 space-y-4 shadow-xl relative font-sans">
            <h3 className="font-sans font-black text-xs uppercase tracking-wider text-[#123524] border-b border-slate-100 pb-2">
              {editingId ? 'EDIT DETAIL MENU JUAL' : 'TAMBAH DAFTAR MENU JUAL'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Nama Menu Kafe *</label>
                <input
                  id="form-cat-name"
                  type="text"
                  placeholder="Contoh: Es Pandan Latte"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Kategori Produk</label>
                  <select
                    id="form-cat-select"
                    value={formCatId}
                    onChange={(e) => setFormCatId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-850 font-semibold focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Harga Jual (Rp) *</label>
                  <input
                    id="form-cat-price"
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 text-right font-bold font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Visual Emoji Icon</label>
                  <select
                    id="form-cat-emoji"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-850 font-semibold focus:outline-none"
                  >
                    <option value="☕">☕ Kopi Panas</option>
                    <option value="🥛">🥛 Latte Dingin</option>
                    <option value="🥤">🥤 Boba / Milk Tea</option>
                    <option value="🍵">🍵 Matcha Tea</option>
                    <option value="🥐">🥐 Pastry / Bakery</option>
                    <option value="🍛">🍛 Nasi Goreng</option>
                    <option value="🍿">🍿 Snacks</option>
                    <option value="🍹">🍹 Mocktail / Syrup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Tersedia Dijual</label>
                  <select
                    id="form-cat-avail"
                    value={formAvailable ? 'yes' : 'no'}
                    onChange={(e) => setFormAvailable(e.target.value === 'yes')}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-850 font-semibold focus:outline-none"
                  >
                    <option value="yes">Tersedia (Ready)</option>
                    <option value="no">Habis (Kosong)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                id="btn-cat-cancel"
                onClick={() => setShowFormModal(false)}
                className="w-full py-2 border border-slate-300 text-xs font-bold rounded-xl text-slate-500 hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                id="btn-cat-save"
                className="w-full py-2 bg-[#123524] hover:bg-[#1A3F2C] text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition-colors"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
