import React, { useState } from 'react';
import { Settings, Save, Coffee, Plus, Coins, Tag, Trash2, Eye, EyeOff } from 'lucide-react';
import { CafeSettings, Product, Category } from '../types';

interface SettingsProps {
  settings: CafeSettings;
  products: Product[];
  categories: Category[];
  onSaveSettings: (settings: CafeSettings) => void;
  onModifyProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
  currentUser: { name: string };
  onAddAuditLog: (action: string, module: string, details: string) => void;
  onResetDatabase: () => void;
}

export default function SettingsModule({
  settings,
  products,
  categories,
  onSaveSettings,
  onModifyProduct,
  onAddProduct,
  currentUser,
  onAddAuditLog,
  onResetDatabase
}: SettingsProps) {
  // Tabs: Shop Branding, Products Catalog
  const [subTab, setSubTab] = useState<'brand' | 'products'>('brand');

  // Cafe branding states
  const [cafeName, setCafeName] = useState(settings.cafeName);
  const [logoText, setLogoText] = useState(settings.logoText);
  const [logoSubtext, setLogoSubtext] = useState(settings.logoSubtext);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [footerReceipt, setFooterReceipt] = useState(settings.footerReceipt);
  const [taxRate, setTaxRate] = useState((settings.taxRate * 100).toString());
  const [serviceChargeRate, setServiceChargeRate] = useState((settings.serviceChargeRate * 100).toString());

  // Edit / Add Product states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  
  // Product Form states
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCatId, setProdCatId] = useState('');
  const [prodAvailable, setProdAvailable] = useState(true);
  const [prodImage, setProdImage] = useState('☕');

  const handleUpdateBrandingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updated: CafeSettings = {
      cafeName: cafeName.trim(),
      logoText: logoText.trim().toUpperCase(),
      logoSubtext: logoSubtext.trim().toUpperCase(),
      address: address.trim(),
      phone: phone.trim(),
      footerReceipt: footerReceipt.trim(),
      taxRate: (Number(taxRate) || 0) / 100,
      serviceChargeRate: (Number(serviceChargeRate) || 0) / 100
    };

    onSaveSettings(updated);
    onAddAuditLog('Save Settings', 'System Settings', `Updated cafe branding to ${updated.cafeName}, TAX ${taxRate}%, Service ${serviceChargeRate}%`);
    alert("✅ Pengaturan cafe berhasil diperbarui!");
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProd(prod);
    setProdName(prod.name);
    setProdPrice(prod.price.toString());
    setProdCatId(prod.categoryId);
    setProdAvailable(prod.isAvailable);
    setProdImage(prod.image || '☕');
    setShowProductModal(true);
  };

  // Open Add Product Modal
  const handleOpenAddProduct = () => {
    setEditingProd(null);
    setProdName('');
    setProdPrice('25000');
    setProdCatId(categories[0]?.id || '');
    setProdAvailable(true);
    setProdImage('☕');
    setShowProductModal(true);
  };

  const handleSaveProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice) {
      alert("⚠️ Harap lengkapi formulir produk.");
      return;
    }

    if (editingProd) {
      // Modify
      const updated: Product = {
        ...editingProd,
        name: prodName.trim(),
        price: Number(prodPrice) || 0,
        categoryId: prodCatId,
        isAvailable: prodAvailable,
        image: prodImage
      };
      onModifyProduct(updated);
      onAddAuditLog('Edit Product', 'System Settings', `Modified product details for ${updated.name}. Price set to Rp ${updated.price}`);
    } else {
      // Create new
      const clean: Product = {
        id: `prod_${Date.now()}`,
        name: prodName.trim(),
        price: Number(prodPrice) || 0,
        categoryId: prodCatId,
        isAvailable: prodAvailable,
        image: prodImage
      };
      onAddProduct(clean);
      onAddAuditLog('Create Product', 'System Settings', `Created new menu item ${clean.name} with price Rp ${clean.price}`);
    }

    setShowProductModal(false);
    alert("✅ Produk menu berhasil disimpan!");
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto font-sans">

      <div className="flex border-b border-slate-200 gap-5">
        <button
          id="btn-subtab-brand"
          onClick={() => setSubTab('brand')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wide transition border-b-2 leading-none cursor-pointer ${
            subTab === 'brand' ? 'border-[#123524] text-[#123524]' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Profil Branding & Bill
        </button>

        <button
          id="btn-subtab-products"
          onClick={() => setSubTab('products')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wide transition border-b-2 leading-none cursor-pointer ${
            subTab === 'products' ? 'border-[#123524] text-[#123524]' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Manajemen Produk Menu ({products.length})
        </button>
      </div>

      {subTab === 'brand' && (
        <form onSubmit={handleUpdateBrandingSubmit} className="bento-card space-y-5 text-slate-800 bg-white border border-slate-200 shadow-sm max-w-3xl">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings className="h-4.5 w-4.5 text-[#123524]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">PROFIL BRANDING UTAMA KEDAI</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1 font-mono uppercase font-bold">Nama Cafe *</label>
              <input
                id="brand-name-input"
                type="text"
                value={cafeName}
                onChange={(e) => setCafeName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#85A947] transition font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 font-mono uppercase font-bold">Logo Text (Header)</label>
                <input
                  id="brand-logo-txt"
                  type="text"
                  value={logoText}
                  onChange={(e) => setLogoText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-[#85A947] transition font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 font-mono uppercase font-bold">Logo Subtext</label>
                <input
                  id="brand-logo-sub"
                  type="text"
                  value={logoSubtext}
                  onChange={(e) => setLogoSubtext(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-600 font-semibold focus:outline-none focus:border-[#85A947] transition font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1 font-mono uppercase font-bold">Alamat Cafe Lengkap</label>
              <input
                id="brand-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#85A947] transition font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-1 font-mono uppercase font-bold">Telepon Kontak</label>
              <input
                id="brand-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#85A947] transition font-mono"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Tax charge rates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 font-mono uppercase font-bold">Pajak Pertambahan Nilai (%)</label>
                <div className="relative">
                  <input
                    id="brand-tax"
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-bold text-right pr-6 focus:outline-none focus:border-[#85A947] transition font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold font-mono">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1 font-mono uppercase font-bold">Service Charge (%)</label>
                <div className="relative">
                  <input
                    id="brand-service"
                    type="number"
                    value={serviceChargeRate}
                    onChange={(e) => setServiceChargeRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-bold text-right pr-6 focus:outline-none focus:border-[#85A947] transition font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold font-mono">%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-1 font-mono uppercase font-bold">Catatan Kaki Struk (Footer)</label>
              <input
                id="brand-footer"
                type="text"
                value={footerReceipt}
                onChange={(e) => setFooterReceipt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-850 font-semibold focus:outline-none focus:border-[#85A947] transition font-mono"
              />
            </div>
          </div>

          <div className="flex gap-3.5 pt-3">
            <button
              id="btn-save-branding"
              type="submit"
              className="w-full md:w-auto px-5 py-3.5 bg-[#123524] text-white hover:bg-[#1A3F2C] font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Simpan Perubahan Branding</span>
            </button>
          </div>
        </form>
      )}

      {/* Danger Zone: Reset transactional records */}
      {subTab === 'brand' && (
        <div className="border border-red-250 bg-red-50/60 p-6 rounded-2xl max-w-3xl space-y-4">
          <div className="flex items-center gap-2 border-b border-red-150 pb-3">
            <Trash2 className="h-5 w-5 text-red-650 animate-pulse" />
            <h4 className="font-sans font-black text-xs text-red-800 tracking-wider uppercase">Zona Bahaya: Konfigurasi Database</h4>
          </div>
          <div className="text-xs text-slate-650 leading-relaxed space-y-1.5">
            <p className="font-bold text-red-700">⚠️ <strong>Tindakan ini permanen dan tidak dapat dibatalkan!</strong></p>
            <p>Sistem akan menghapus seluruh rekaman operasional toko berikut secara instan:</p>
            <ul className="list-disc pl-5 font-mono text-[10px] space-y-0.5 text-slate-500 font-bold">
              <li>Laporan & Riwayat Seluruh Transaksi Penjualan (Orders & Payments)</li>
              <li>Buku Catatan Catat Pengeluaran Kafe (Ledger Expenses)</li>
              <li>Riwayat Alur Logistik & Aliran Stok (Inventory Movements)</li>
              <li>Seluruh rekaman log sistem (Audit Logs) akan dibersihkan kembali ke baseline</li>
            </ul>
            <p className="pt-2 font-semibold"><strong>Akun Petugas (admin & kasir) akan TETAP dipertahankan</strong> agar sistem langsung siap digunakan kembali untuk transaksi baru tanpa kendala.</p>
          </div>

          <button
            type="button"
            id="btn-danger-reset-db"
            onClick={() => {
              const check1 = confirm("⚠️ Apakah Anda yakin ingin menghapus seluruh data transaksi penjualan, pengeluaran, dan stok bahan? Rekaman transaksi akan kembali ke NOL.");
              if (check1) {
                const check2 = confirm("🔥 APALAH ANDA BENAR-BENAR YAKIN? Tindakan ini akan mengosongkan seluruh laporan keuangan kafe untuk memulai dari awal.");
                if (check2) {
                  onResetDatabase();
                  onAddAuditLog('Truncate Database', 'System Settings', 'User successfully requested a complete cleanup of dynamic transactions.');
                  alert("✅ Semua data transaksi berhasil dibersihkan! Sistem siap digunakan.");
                }
              }
            }}
            className="w-full md:w-auto px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>Kosongkan Semua Data Transaksi</span>
          </button>
        </div>
      )}

      {subTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Katalog Menu Kedai Fizqo</h3>
            <button
              id="btn-add-product-row"
              onClick={handleOpenAddProduct}
              className="px-3.5 py-2 bg-[#123524] text-white hover:bg-[#1A3F2C] font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Menu Baru</span>
            </button>
          </div>

          {/* Product Items Table grid */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto text-xs text-slate-800 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-bold font-mono">
                  <th className="p-4">Visual Icon</th>
                  <th className="p-4">Nama Produk</th>
                  <th className="p-4">Kategori Kafe</th>
                  <th className="p-4 font-mono">Harga Jual (Rp)</th>
                  <th className="p-4 text-center">Tersedia untuk Jual</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {products.map((p) => {
                  const cat = categories.find(c => c.id === p.categoryId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/65 transition-colors">
                      <td className="p-4 text-2xl">{p.image || '☕'}</td>
                      <td className="p-4 font-bold text-slate-950">{p.name}</td>
                      <td className="p-4 text-slate-500 uppercase font-mono font-bold text-[10px]">
                        {cat ? cat.name : 'Uncategorized'}
                      </td>
                      <td className="p-4 font-mono font-black text-emerald-800 text-sm">
                        Rp {p.price.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8.5px] uppercase font-mono font-black border ${
                          p.isAvailable 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {p.isAvailable ? 'AKTIF / TERSEDIA' : 'KOSONG / ARSIP'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          id={`btn-edit-katalog-${p.id}`}
                          onClick={() => handleOpenEditProduct(p)}
                          className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-sans font-black uppercase rounded-lg cursor-pointer transition shadow-2xs"
                        >
                          Ubah Item
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Edit / Add Product Form */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form onSubmit={handleSaveProductForm} className="bg-white border border-slate-300 p-6 rounded-2xl max-w-sm w-full text-slate-800 space-y-4 shadow-xl">
            <h3 className="font-sans font-black text-xs uppercase tracking-wider text-[#123524] border-b border-slate-100 pb-2 flex items-center gap-1">
              <Coffee className="h-4 w-4 text-[#123524]" />
              {editingProd ? 'Ubah Informasi Menu' : 'Tambah Produk Menu Baru'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Nama Menu *</label>
                <input
                  id="form-prod-name"
                  type="text"
                  placeholder="Contoh: Es Matcha Vanilla Cream"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#85A947]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Kategori Kafe</label>
                  <select
                    id="form-prod-cat"
                    value={prodCatId}
                    onChange={(e) => setProdCatId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Harga Jual (Rp) *</label>
                  <input
                    id="form-prod-price"
                    type="number"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-right font-mono font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Visual Emoji Icon</label>
                  <select
                    id="form-prod-image"
                    value={prodImage}
                    onChange={(e) => setProdImage(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold"
                  >
                    <option value="☕">☕ Kopi Panas</option>
                    <option value="🥛">🥛 Latte Dingin</option>
                    <option value="🥛">🥤 Boba</option>
                    <option value="🍵">🍵 Matcha Teh</option>
                    <option value="🥐">🥐 Croissant / Roti</option>
                    <option value="🍛">🍛 Nasi Goreng</option>
                    <option value="🍿">🍿 Snacks</option>
                    <option value="🍹">🍹 Mocktail</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Tersedia Dijual</label>
                  <select
                    id="form-prod-avail"
                    value={prodAvailable ? 'yes' : 'no'}
                    onChange={(e) => setProdAvailable(e.target.value === 'yes')}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold"
                  >
                    <option value="yes">Tersedia (Aktif)</option>
                    <option value="no">Habis / Matikan</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                id="btn-close-product-form"
                onClick={() => setShowProductModal(false)}
                className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 text-xs font-black rounded-xl transition cursor-pointer text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                id="btn-save-product-form"
                className="w-full py-2 bg-[#123524] hover:bg-[#1C3125] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Simpan Menu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
