import React, { useState } from 'react';
import { 
  Package, Plus, Settings2, AlertTriangle, FileClock, 
  CornerDownRight, CheckSquare, RefreshCw, Layers, History, Search
} from 'lucide-react';
import { RawMaterial, InventoryMovement, StockOpname, MovementType } from '../types';

interface InventoryProps {
  rawMaterials: RawMaterial[];
  movements: InventoryMovement[];
  onAddRawMaterial: (raw: RawMaterial) => void;
  onModifyRawMaterial: (raw: RawMaterial) => void;
  onAddMovement: (movement: InventoryMovement) => void;
  onRunStockOpname: (opname: StockOpname) => void;
  currentUser: { name: string };
  onAddAuditLog: (action: string, module: string, details: string) => void;
}

export default function InventoryModule({
  rawMaterials,
  movements,
  onAddRawMaterial,
  onModifyRawMaterial,
  onAddMovement,
  onRunStockOpname,
  currentUser,
  onAddAuditLog
}: InventoryProps) {
  // Tabs: Materials list, Adjustments, Opnames, History
  const [activeSubTab, setActiveSubTab] = useState<'materials' | 'history' | 'opname'>('materials');

  // Input states for New Raw Material
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRmName, setNewRmName] = useState('');
  const [newRmUnit, setNewRmUnit] = useState('gr');
  const [newRmStock, setNewRmStock] = useState('1000');
  const [newRmMinStock, setNewRmMinStock] = useState('200');
  const [newRmCost, setNewRmCost] = useState('100');

  // Inline Stock Adjustment
  const [selectedAdjustRm, setSelectedAdjustRm] = useState<RawMaterial | null>(null);
  const [adjustValue, setAdjustValue] = useState('');
  const [adjustType, setAdjustType] = useState<MovementType>('ADJUSTMENT');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Stock Opname list structure
  const [opnameItems, setOpnameItems] = useState<{
    id: string; name: string; system: number; actual: number; unit: string;
  }[]>([]);
  const [opnameNotes, setOpnameNotes] = useState('');
  const [isOpnameActive, setIsOpnameActive] = useState(false);

  // Filter Movements
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<string>('all');

  // Save new material
  const handleCreateRawMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRmName.trim()) {
      alert("⚠️ Harap masukkan Nama Bahan Baku.");
      return;
    }

    const clean: RawMaterial = {
      id: `raw_${Date.now()}`,
      name: newRmName.trim(),
      unit: newRmUnit,
      stock: Number(newRmStock) || 0,
      minStock: Number(newRmMinStock) || 0,
      averageCost: Number(newRmCost) || 0
    };

    onAddRawMaterial(clean);
    
    // Register starting movement logs
    if (clean.stock > 0) {
      onAddMovement({
        id: `move_${Date.now()}`,
        rawMaterialId: clean.id,
        rawMaterialName: clean.name,
        type: 'PURCHASE',
        quantity: clean.stock,
        notes: 'Initial starting stock count on creation',
        createdAt: new Date().toISOString(),
        user: currentUser.name
      });
    }

    onAddAuditLog('Create Raw Material', 'Inventory', `Created new raw material ${clean.name} with stock ${clean.stock} ${clean.unit}`);
    setShowAddModal(false);
    resetRmInputs();
  };

  const resetRmInputs = () => {
    setNewRmName('');
    setNewRmUnit('gr');
    setNewRmStock('1000');
    setNewRmMinStock('200');
    setNewRmCost('100');
  };

  // Quick Adjustment Execution
  const executeAdjustment = () => {
    if (!selectedAdjustRm || !adjustValue) return;

    const adjustmentAmount = Number(adjustValue);
    if (isNaN(adjustmentAmount)) {
      alert("⚠️ Nominal kuantitas harus valid.");
      return;
    }

    // New Stock calculation
    const updatedStock = selectedAdjustRm.stock + adjustmentAmount;
    if (updatedStock < 0) {
      alert("⚠️ Stok akhir tidak boleh kurang dari 0.");
      return;
    }

    // Apply change
    onModifyRawMaterial({
      ...selectedAdjustRm,
      stock: updatedStock
    });

    onAddMovement({
      id: `move_${Date.now()}`,
      rawMaterialId: selectedAdjustRm.id,
      rawMaterialName: selectedAdjustRm.name,
      type: adjustType,
      quantity: adjustmentAmount,
      notes: adjustNotes || `Quick Stock Adjustment (${adjustType})`,
      createdAt: new Date().toISOString(),
      user: currentUser.name
    });

    onAddAuditLog('Stock Adjust', 'Inventory', `Adjusted raw material ${selectedAdjustRm.name} by ${adjustmentAmount} ${selectedAdjustRm.unit}`);
    
    setSelectedAdjustRm(null);
    setAdjustValue('');
    setAdjustNotes('');
  };

  // Launch Opname Mode
  const handleStartOpname = () => {
    const list = rawMaterials.map(rm => ({
      id: rm.id,
      name: rm.name,
      system: rm.stock,
      actual: rm.stock, // Default sets actual equal to system until edited
      unit: rm.unit
    }));
    setOpnameItems(list);
    setOpnameNotes('');
    setIsOpnameActive(true);
  };

  const handleUpdateOpnameActual = (id: string, value: string) => {
    const qty = Number(value);
    setOpnameItems(prev => prev.map(item => 
      item.id === id ? { ...item, actual: isNaN(qty) ? item.system : qty } : item
    ));
  };

  const handleCompleteOpname = () => {
    // Generate differences and modify inventory
    const finalOpnameItems = opnameItems.map(item => {
      const diff = item.actual - item.system;
      return {
        rawMaterialId: item.id,
        rawMaterialName: item.name,
        systemStock: item.system,
        actualStock: item.actual,
        difference: diff
      };
    });

    // Save Stock Opname model to parent
    const opnameObj: StockOpname = {
      id: `opname_${Date.now()}`,
      date: new Date().toISOString(),
      status: 'COMPLETED',
      items: finalOpnameItems,
      notes: opnameNotes || 'Audit Stock Opname berkala',
      completedBy: currentUser.name
    };

    onRunStockOpname(opnameObj);

    // Apply modifications to raw materials and write stock movement entries
    finalOpnameItems.forEach(item => {
      const raw = rawMaterials.find(rm => rm.id === item.rawMaterialId);
      if (raw) {
        // Adjust stock to match actual count
        onModifyRawMaterial({
          ...raw,
          stock: item.actualStock
        });

        // Register OPNAME adjustment log if difference != 0
        if (item.difference !== 0) {
          onAddMovement({
            id: `move_opname_${Date.now()}_${raw.id}`,
            rawMaterialId: raw.id,
            rawMaterialName: raw.name,
            type: 'OPNAME',
            quantity: item.difference,
            notes: `Discrepancy Opname: system ${item.systemStock}, actual ${item.actualStock}`,
            createdAt: new Date().toISOString(),
            user: currentUser.name
          });
        }
      }
    });

    onAddAuditLog('Complete Stock Opname', 'Inventory', `Completed global stock opname, verified ${finalOpnameItems.length} materials`);
    setIsOpnameActive(false);
    setOpnameItems([]);
    alert("✅ Stock Opname berhasil disimpan dan stok sistem telah disesuaikan!");
  };

  // Low stock counter
  const lowStockCount = rawMaterials.filter(rm => rm.stock <= rm.minStock).length;

  // Filtered movements for History logs
  const filteredMovements = movements.filter(m => {
    const matchesSearch = m.rawMaterialName.toLowerCase().includes(historySearch.toLowerCase()) || m.notes.toLowerCase().includes(historySearch.toLowerCase());
    const matchesType = historyFilter === 'all' || m.type === historyFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto">
      
      {/* Upper overview info metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-[#16251D] border border-[#2C4737] rounded-xl flex items-center justify-between text-white">
          <div className="space-y-1">
            <span className="text-[10px] text-[#CFCFCF] uppercase font-mono tracking-widest block">Total Bahan Baku</span>
            <span className="text-xl font-bold font-mono text-[#85A947]">{rawMaterials.length}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-[#123524] flex items-center justify-center">
            <Layers className="h-5 w-5 text-[#85A947]" />
          </div>
        </div>

        <div className="p-4 bg-[#16251D] border border-[#2C4737] rounded-xl flex items-center justify-between text-white">
          <div className="space-y-1">
            <span className="text-[10px] text-[#CFCFCF] uppercase font-mono tracking-widest block">Alert Stok Minim</span>
            <span className={`text-xl font-bold font-mono ${lowStockCount > 0 ? 'text-red-400' : 'text-[#85A947]'}`}>{lowStockCount} Item</span>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${lowStockCount > 0 ? 'bg-red-950 text-red-400' : 'bg-[#123524] text-[#85A947]'}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-[#16251D] border border-[#2C4737] rounded-xl flex flex-col justify-center text-white">
          <button
            id="btn-trigger-opname"
            onClick={handleStartOpname}
            disabled={isOpnameActive}
            className="w-full py-2.5 bg-[#85A947] disabled:bg-[#85A947]/30 text-[#123524] font-bold text-xs rounded-lg flex items-center justify-center gap-2"
          >
            <CheckSquare className="h-4.5 w-4.5" />
            <span>Mulai Stock Opname</span>
          </button>
        </div>
      </div>

      {/* Module Navigation Subtabs */}
      <div className="flex border-b border-[#2C4737] gap-5">
        <button
          id="btn-subtab-materials"
          onClick={() => { setActiveSubTab('materials'); setIsOpnameActive(false); }}
          className={`pb-2.5 text-xs font-semibold uppercase tracking-wide transition border-b-2 leading-none ${
            activeSubTab === 'materials' && !isOpnameActive
              ? 'border-[#85A947] text-[#85A947]'
              : 'border-transparent text-[#CFCFCF] hover:text-white'
          }`}
        >
          Daftar Bahan Baku ({rawMaterials.length})
        </button>

        <button
          id="btn-subtab-history"
          onClick={() => { setActiveSubTab('history'); setIsOpnameActive(false); }}
          className={`pb-2.5 text-xs font-semibold uppercase tracking-wide transition border-b-2 leading-none ${
            activeSubTab === 'history'
              ? 'border-[#85A947] text-[#85A947]'
              : 'border-transparent text-[#CFCFCF] hover:text-white'
          }`}
        >
          Histori Pergerakan Stok
        </button>

        {isOpnameActive && (
          <button
            id="btn-subtab-opname"
            className="pb-2.5 text-xs font-bold uppercase tracking-wide text-red-400 border-b-2 border-red-400 leading-none"
          >
            Sesi Opname Aktif *
          </button>
        )}
      </div>

      {/* RENDER ACTIVE TAB */}

      {/* 1. Opname Active Panel */}
      {isOpnameActive && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 text-slate-800 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">FORM STOCK OPNAME AKTIF</h3>
              <p className="text-xs text-slate-500 font-semibold text-slate-500">Bandingkan stock tercatat di sistem dengan stock fisik sebenarnya.</p>
            </div>
            <button
              id="btn-cancel-opname"
              onClick={() => setIsOpnameActive(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 rounded-lg transition"
            >
              Batalkan Sesi
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 bg-slate-50 font-mono uppercase font-bold text-[10px]">
                  <th className="py-2.5 pl-3">Bahan Baku</th>
                  <th className="py-2.5 font-mono">Stock Sistem</th>
                  <th className="py-2.5 font-mono">Stock Fisik (Aktual)</th>
                  <th className="py-2.5 font-mono text-right pr-3">Selisih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opnameItems.map((item) => {
                  const diff = item.actual - item.system;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 pl-3 font-semibold text-slate-800">{item.name}</td>
                      <td className="py-2.5 font-mono font-bold text-slate-600">
                        {item.system.toLocaleString('id-ID')} {item.unit}
                      </td>
                      <td className="py-1">
                        <div className="flex items-center gap-1.5 max-w-[120px]">
                          <input
                            id={`opname-input-${item.id}`}
                            type="number"
                            value={item.actual}
                            onChange={(e) => handleUpdateOpnameActual(item.id, e.target.value)}
                            className="w-full px-2.5 py-1 bg-white border border-slate-300 focus:border-[#85A947] rounded font-mono text-slate-800 font-bold text-right focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-400 font-mono font-bold">{item.unit}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-right font-bold text-base">
                        {diff === 0 ? (
                          <span className="text-gray-400">Pas</span>
                        ) : diff > 0 ? (
                          <span className="text-emerald-700">+{diff.toLocaleString('id-ID')}</span>
                        ) : (
                          <span className="text-red-700">{diff.toLocaleString('id-ID')}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Notes / Catatan Deskripsi Opname:</label>
            <input
              id="opname-global-notes"
              type="text"
              value={opnameNotes}
              onChange={(e) => setOpnameNotes(e.target.value)}
              placeholder="Contoh: Opname akhir bulan Mei, selisih milk karena bocor..."
              className="w-full px-3 py-2 bg-slate-55 border border-slate-300 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#85A947]"
            />
          </div>

          <button
            id="btn-complete-opname-wizard"
            onClick={handleCompleteOpname}
            className="w-full mt-2 py-3 bg-[#123524] text-white hover:bg-[#1A3F2C] font-extrabold text-xs tracking-wider uppercase rounded-lg shadow cursor-pointer transition-colors"
          >
            Simpan & Selesaikan Stock Opname (Sesuai Stok Fisik)
          </button>
        </div>
      )}

      {/* 2. Materials List Panel */}
      {activeSubTab === 'materials' && !isOpnameActive && (
        <div className="space-y-4">
          
          {/* List Controls */}
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Ketersediaan Stok Bahan Baku</h3>
            <button
              id="btn-add-rm-modal"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2.5 bg-[#123524] text-white hover:bg-[#1A3F2C] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Bahan Baku Baru</span>
            </button>
          </div>

          {/* Table list */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-mono text-[10px] uppercase font-bold tracking-wider">
                  <th className="p-4 pl-4.5">Identifikasi</th>
                  <th className="p-4 font-mono">Stock Sekarang</th>
                  <th className="p-4 font-mono">Threshold Minimum</th>
                  <th className="p-4 font-mono">Unit Cost</th>
                  <th className="p-4 font-mono text-right pr-4.5">Tindakan Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rawMaterials.map((rm) => {
                  const isLow = rm.stock <= rm.minStock;
                  return (
                    <tr key={rm.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-4.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-[13px]">{rm.name}</span>
                          {isLow && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-red-50 text-red-700 border border-red-200 uppercase font-extrabold tracking-wider">Low</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-extrabold text-[13px]">
                        <span className={isLow ? 'text-red-600' : 'text-[#4D7C0F]'}>
                          {rm.stock.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1 font-bold uppercase">{rm.unit}</span>
                      </td>
                      <td className="p-4 font-mono text-slate-500 font-semibold">
                        {rm.minStock.toLocaleString('id-ID')} {rm.unit}
                      </td>
                      <td className="p-4 font-mono text-slate-500 font-bold">
                        Rp {rm.averageCost.toLocaleString('id-ID')} / {rm.unit}
                      </td>
                      <td className="p-4 text-right pr-4.5">
                        <button
                          id={`btn-adjust-${rm.id}`}
                          onClick={() => setSelectedAdjustRm(rm)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-[11px] font-bold font-sans rounded-lg text-slate-700 cursor-pointer shadow-xs transition-colors"
                        >
                          Adjustment
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

      {/* 3. History Movement Panel */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row gap-3 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                id="history-search-input"
                type="text"
                placeholder="Cari histori log mutasi bahan..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-[#85A947]"
              />
            </div>

            <div className="flex gap-2">
              <select
                id="history-filter-select"
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700"
              >
                <option value="all">Semua Tipe</option>
                <option value="PURCHASE">KULAKAN / PURCHASE</option>
                <option value="USAGE">RESEP / USAGE</option>
                <option value="ADJUSTMENT">KOREKSI / ADJUSTMENT</option>
                <option value="OPNAME">AUDIT / OPNAME</option>
              </select>
            </div>
          </div>

          {/* Historical lists */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-xs text-slate-700 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-mono text-[10px] uppercase font-bold tracking-wider">
                  <th className="p-3.5 pl-4">Waktu</th>
                  <th className="p-3.5">Item Bahan Baku</th>
                  <th className="p-3.5 font-mono text-center">Tipe</th>
                  <th className="p-3.5 font-mono text-right">Kuantitas</th>
                  <th className="p-3.5">Catatan</th>
                  <th className="p-3.5 pr-4">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map((move) => (
                  <tr key={move.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 pl-4 text-slate-500">
                      {new Date(move.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{move.rawMaterialName}</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase border ${
                        move.type === 'PURCHASE' ? 'bg-green-50 text-green-800 border-green-200' :
                        move.type === 'USAGE' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                        move.type === 'ADJUSTMENT' ? 'bg-orange-50 text-orange-850 border-orange-200' :
                        'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {move.type}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-right font-black">
                      {move.quantity > 0 ? (
                        <span className="text-green-800">+{move.quantity.toLocaleString('id-ID')}</span>
                      ) : (
                        <span className="text-red-700">{move.quantity.toLocaleString('id-ID')}</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600 font-semibold max-w-[200px] truncate">{move.notes}</td>
                    <td className="p-3.5 pr-4 text-slate-550 font-mono text-[10px] font-semibold">{move.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMovements.length === 0 && (
              <div className="p-8 text-center text-slate-400 font-bold">
                Belum ada histori log pergerakan stok.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Inline Quick Adjustment Panel */}
      {selectedAdjustRm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-sm w-full text-slate-800 space-y-4 shadow-xl">
            <h3 className="font-sans font-black text-xs uppercase tracking-wider text-[#123524]">Adjustment Stok Manual</h3>
            
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs text-slate-700 space-y-1.5 font-semibold">
              <p><strong>Item:</strong> {selectedAdjustRm.name}</p>
              <p><strong>Stok Sistem:</strong> {selectedAdjustRm.stock.toLocaleString('id-ID')} {selectedAdjustRm.unit}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Tipe Koreksi</label>
                <select
                  id="adjust-type-select"
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as MovementType)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 font-semibold focus:outline-none"
                >
                  <option value="PURCHASE">KULAKAN / TAMBAH STOK (+)</option>
                  <option value="ADJUSTMENT">KOREKSI UMUM (+ / -)</option>
                  <option value="OPNAME">DISCREPANCY OPNAME (+ / -)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Kuantitas Perubahan *</label>
                <div className="relative">
                  <input
                    id="adjust-qty-input"
                    type="number"
                    placeholder="Contoh: 500 atau -200"
                    value={adjustValue}
                    onChange={(e) => setAdjustValue(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-right pr-12 text-slate-900 font-bold focus:outline-[#85A947]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono font-bold uppercase">{selectedAdjustRm.unit}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Notes / Alasan Koreksi</label>
                <input
                  id="adjust-reason-input"
                  type="text"
                  placeholder="Deskripsi..."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-semibold focus:outline-[#85A947]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 font-sans">
              <button
                id="btn-close-adjust"
                onClick={() => setSelectedAdjustRm(null)}
                className="w-full py-2 border border-slate-300 text-xs font-bold rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-save-adjust"
                onClick={executeAdjustment}
                className="w-full py-2 bg-[#123524] text-white hover:bg-[#1A3F2C] font-bold text-xs rounded-lg cursor-pointer"
              >
                Simpan Penyesuaian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Raw Material */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-xs">
          <form onSubmit={handleCreateRawMaterial} className="bg-white border border-slate-200 p-6 rounded-2xl max-w-sm w-full text-slate-800 space-y-4 shadow-xl font-sans">
            <h3 className="font-sans font-black text-xs uppercase tracking-wider text-[#123524] border-b border-slate-100 pb-2">Tambah Bahan Baku Baru</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Nama Bahan Baku *</label>
                <input
                  id="new-rm-name"
                  type="text"
                  placeholder="Contoh: Susu Fresh Milk Diamond"
                  value={newRmName}
                  onChange={(e) => setNewRmName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#85A947]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Satuan Unit</label>
                  <select
                    id="new-rm-unit"
                    value={newRmUnit}
                    onChange={(e) => setNewRmUnit(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 font-semibold focus:outline-none"
                  >
                    <option value="gr">Gram (gr)</option>
                    <option value="ml">Mililiter (ml)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="portion">Porsi (portion)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Stok Awal</label>
                  <input
                    id="new-rm-stock"
                    type="number"
                    value={newRmStock}
                    onChange={(e) => setNewRmStock(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-right font-bold font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Limit Minim Alert</label>
                  <input
                    id="new-rm-minstock"
                    type="number"
                    value={newRmMinStock}
                    onChange={(e) => setNewRmMinStock(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-right font-bold font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Harga Per Satuan (Rp)</label>
                  <input
                    id="new-rm-cost"
                    type="number"
                    value={newRmCost}
                    onChange={(e) => setNewRmCost(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-right font-bold font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                id="btn-close-new-rm"
                onClick={() => { setShowAddModal(false); resetRmInputs(); }}
                className="w-full py-2 border border-slate-300 text-xs font-bold rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                id="btn-save-new-rm"
                className="w-full py-2 bg-[#123524] text-white hover:bg-[#1A3F2C] font-bold text-xs rounded-lg cursor-pointer"
              >
                Simpan Bahan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
