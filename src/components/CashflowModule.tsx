import React, { useState } from 'react';
import { 
  ArrowUpRight, ArrowDownLeft, Plus, Trash2, Search, 
  Filter, Calendar, TrendingUp, TrendingDown, ArrowLeftRight, 
  DollarSign, RefreshCw, Layers 
} from 'lucide-react';
import { Order, Payment, Expense, CashflowEntry, CashflowType, CashflowCategory } from '../types';

interface CashflowModuleProps {
  orders: Order[];
  payments: Payment[];
  expenses: Expense[];
  customCashflows: CashflowEntry[];
  onAddCustomCashflow: (entry: CashflowEntry) => void;
  onDeleteCustomCashflow: (id: string) => void;
  currentUser: { name: string };
  onAddAuditLog: (action: string, module: string, details: string) => void;
}

export default function CashflowModule({
  orders,
  payments,
  expenses,
  customCashflows,
  onAddCustomCashflow,
  onDeleteCustomCashflow,
  currentUser,
  onAddAuditLog
}: CashflowModuleProps) {
  // UI filter states
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CASH_IN' | 'CASH_OUT'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  
  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form input states
  const [formType, setFormType] = useState<CashflowType>('CASH_IN');
  const [formCategory, setFormCategory] = useState<CashflowCategory>('CAPITAL');
  const [formAmount, setFormAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formPaymentMethod, setFormPaymentMethod] = useState('CASH');

  // CONSOLIDATE ALL CASHFLOW ENTRIES:
  // 1. Paid Sales payments -> CASH_IN (SALES)
  const salesCashflow: CashflowEntry[] = payments.map(pay => ({
    id: `pay_${pay.id}`,
    type: 'CASH_IN',
    category: 'SALES',
    amount: pay.amount,
    notes: `Penjualan Kasir - Ref: ${pay.orderCode}`,
    date: pay.paymentTime.slice(0, 10),
    paymentMethod: pay.method,
    recordedBy: 'Sistem POS'
  }));

  // 2. Expenses -> CASH_OUT (EXPENSE)
  const expenseCashflow: CashflowEntry[] = expenses.map(exp => ({
    id: `exp_${exp.id}`,
    type: 'CASH_OUT',
    category: 'EXPENSE',
    amount: exp.amount,
    notes: `${exp.category} - ${exp.notes}`,
    date: exp.date,
    paymentMethod: 'CASH',
    recordedBy: exp.recordedBy
  }));

  // 3. Combine custom entries
  const allLedgerEntries = [...salesCashflow, ...expenseCashflow, ...customCashflows];

  // Helper resetting dates
  const handleQuickDateFilter = (range: 'today' | 'week' | 'month' | 'all') => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (range === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (range === 'week') {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      setStartDate(lastWeek.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (range === 'month') {
      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filter application
  const filteredEntries = allLedgerEntries.filter(entry => {
    // 1. Search Query
    const matchesSearch = entry.notes.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          entry.recordedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.id.includes(searchQuery);

    // 2. Type matching
    const matchesType = typeFilter === 'ALL' || entry.type === typeFilter;

    // 3. Category matching
    const matchesCategory = categoryFilter === 'all' || entry.category === categoryFilter;

    // 4. Method matching
    const matchesMethod = methodFilter === 'all' || entry.paymentMethod === methodFilter;

    // 5. Date matching
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && (entry.date >= startDate);
    }
    if (endDate) {
      matchesDate = matchesDate && (entry.date <= endDate);
    }

    return matchesSearch && matchesType && matchesCategory && matchesMethod && matchesDate;
  });

  // Sort descending by date, then ID
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.id.localeCompare(a.id);
  });

  // METRIC SUMMARIES (Calculated based on currently filtered subset, or overall? Usually overall or filtered is best, let's do filtered subset so metrics update with search/date range!)
  const totalInflow = filteredEntries
    .filter(e => e.type === 'CASH_IN')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalOutflow = filteredEntries
    .filter(e => e.type === 'CASH_OUT')
    .reduce((sum, e) => sum + e.amount, 0);

  const netCashflow = totalInflow - totalOutflow;

  // Let's also calculate overall ALL-TIME Balance to show absolute book value
  const allTimeInflow = allLedgerEntries
    .filter(e => e.type === 'CASH_IN')
    .reduce((sum, e) => sum + e.amount, 0);
  const allTimeOutflow = allLedgerEntries
    .filter(e => e.type === 'CASH_OUT')
    .reduce((sum, e) => sum + e.amount, 0);
  const allTimeBookBalance = allTimeInflow - allTimeOutflow;

  // Save manual transaction adjustment
  const handleSaveCustomEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || Number(formAmount) <= 0) {
      alert("⚠️ Harap masukkan nominal transaksi tunai yang valid.");
      return;
    }
    if (!formNotes.trim()) {
      alert("⚠️ Masukkan deskripsi / penjelasan catatan cashflow.");
      return;
    }

    const nextEntry: CashflowEntry = {
      id: `cf_custom_${Date.now()}`,
      type: formType,
      category: formCategory,
      amount: Number(formAmount),
      notes: formNotes.trim(),
      date: formDate,
      paymentMethod: formPaymentMethod,
      recordedBy: currentUser.name
    };

    onAddCustomCashflow(nextEntry);
    onAddAuditLog(
      'Add Cashflow', 
      'Cashflow Management', 
      `Recorded manual ${formType} [${formCategory}] Rp ${nextEntry.amount.toLocaleString('id-ID')} - ${nextEntry.notes}`
    );

    // Reset Form
    setShowAddModal(false);
    setFormAmount('');
    setFormNotes('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormPaymentMethod('CASH');
    alert("✅ Transaksi kas masuk/keluar berhasil disimpan!");
  };

  const handleDeleteEntry = (entry: CashflowEntry) => {
    if (!entry.id.startsWith('cf_custom_') && entry.id !== 'cf_init') {
      alert("⚠️ Transaksi sistem otomatis (Sales/Expenses) tidak boleh dihapus dari sini untuk integritas pembukuan. Hapus transaksi dari POS atau Buku Pengeluaran.");
      return;
    }
    
    if (confirm(`Apakah Anda yakin ingin menghapus catatan cashflow manual: "${entry.notes}" senilai Rp ${entry.amount.toLocaleString('id-ID')}?`)) {
      onDeleteCustomCashflow(entry.id);
      onAddAuditLog(
        'Delete Cashflow',
        'Cashflow Management',
        `Deleted manual cashflow record: ${entry.notes} (Rp ${entry.amount})`
      );
      alert("✅ Catatan berhasil dihapus.");
    }
  };

  // Helper mapping source badge color
  const getCategoryBadgeStyles = (cat: CashflowCategory) => {
    switch (cat) {
      case 'SALES':
        return 'bg-emerald-100 text-emerald-950 border border-emerald-300';
      case 'EXPENSE':
        return 'bg-red-100 text-red-950 border border-red-300';
      case 'CAPITAL':
        return 'bg-blue-105 text-blue-900 border border-blue-300';
      case 'WITHDRAWAL':
        return 'bg-amber-100 text-amber-950 border border-amber-300';
      case 'ADJUSTMENT':
        return 'bg-purple-100 text-purple-900 border border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-300';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 h-full overflow-y-auto">
      
      {/* Top Ledger Financial Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        
        {/* Book Balance - Safe Total Cash */}
        <div className="p-4.5 bg-white border-2 border-slate-300 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-sans tracking-wider font-extrabold">Saldo Kas Total Buku (All-time)</span>
            <span className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3.5">
            <span className={`text-xl font-black font-mono ${allTimeBookBalance >= 0 ? 'text-emerald-700' : 'text-red-650'}`}>
              Rp {allTimeBookBalance.toLocaleString('id-ID')}
            </span>
            <p className="text-[9px] text-slate-400 font-extrabold mt-1">SINKRONISASI AKTIF DUA ARAH</p>
          </div>
        </div>

        {/* Filtered Total Inflow */}
        <div className="p-4.5 bg-white border border-slate-205 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-sans tracking-wider font-extrabold">Total Uang Masuk (Periode)</span>
            <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-800">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3.5">
            <span className="text-xl font-black font-mono text-emerald-700">
              + Rp {totalInflow.toLocaleString('id-ID')}
            </span>
            <p className="text-[9px] text-slate-400 font-extrabold mt-1">DARI PENJUALAN & MODAL UTAMA</p>
          </div>
        </div>

        {/* Filtered Total Outflow */}
        <div className="p-4.5 bg-white border border-slate-205 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-sans tracking-wider font-extrabold">Total Uang Keluar (Periode)</span>
            <span className="p-1.5 bg-red-50 rounded-lg text-red-600">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3.5">
            <span className="text-xl font-black font-mono text-red-650">
              - Rp {totalOutflow.toLocaleString('id-ID')}
            </span>
            <p className="text-[9px] text-slate-400 font-extrabold mt-1">DARI KULAKAN & PENGELUARAN</p>
          </div>
        </div>

        {/* Period Net Profit */}
        <div className="p-4.5 bg-white border border-slate-205 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-sans tracking-wider font-extrabold">Aliran Kas Bersih (Periode)</span>
            <span className="p-1.5 bg-blue-50 rounded-lg text-blue-700">
              <ArrowLeftRight className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3.5">
            <span className={`text-xl font-black font-mono ${netCashflow >= 0 ? 'text-blue-700' : 'text-red-650'}`}>
              Rp {netCashflow.toLocaleString('id-ID')}
            </span>
            <p className="text-[9px] text-slate-400 font-extrabold mt-1">ARUS KAS OPERASIONAL KAFE</p>
          </div>
        </div>

      </div>

      {/* Button Tool Controls & New Entry button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-205 p-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition select-none cursor-pointer border ${
              typeFilter === 'ALL'
                ? 'bg-[#123524] text-white border-[#123524]'
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-250'
            }`}
          >
            Semua Aliran
          </button>
          
          <button
            type="button"
            onClick={() => setTypeFilter('CASH_IN')}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition select-none cursor-pointer border flex items-center gap-1 ${
              typeFilter === 'CASH_IN'
                ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                : 'bg-white text-slate-605 hover:bg-slate-50 border-slate-250'
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-700" />
            Uang Masuk (+)
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter('CASH_OUT')}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition select-none cursor-pointer border flex items-center gap-1 ${
              typeFilter === 'CASH_OUT'
                ? 'bg-red-50 text-red-950 border-red-300'
                : 'bg-white text-slate-605 hover:bg-slate-50 border-slate-250'
            }`}
          >
            <ArrowDownLeft className="h-3.5 w-3.5 text-red-600" />
            Uang Keluar (-)
          </button>
        </div>

        <button
          id="btn-add-cashflow-modal"
          type="button"
          onClick={() => {
            setFormType('CASH_IN');
            setFormCategory('CAPITAL');
            setShowAddModal(true);
          }}
          className="py-1.5 px-4.5 bg-[#123524] text-white hover:bg-[#1C3E2F] font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Catat Mutasi Kas Manual</span>
        </button>
      </div>

      {/* Advanced Filter Tool Section */}
      <div className="bg-white border border-slate-205 p-4 rounded-2xl shadow-xs space-y-3.5">
        <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">Opsi Filter Pencarian & Waktu</p>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Notes Query */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              id="cashflow-search-query"
              type="text"
              placeholder="Cari deskripsi (contoh: Kopi, Susu, Kasir, Setoran)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-250 rounded-xl text-xs text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:border-[#85A947]"
            />
          </div>

          {/* Source Category selector */}
          <div className="md:col-span-3">
            <select
              id="cashflow-category-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-[#85A947]"
            >
              <option value="all">Semua Kategori Kas</option>
              <option value="SALES">SALES (Penjualan Kasir)</option>
              <option value="EXPENSE">EXPENSE (Buku Pengeluaran)</option>
              <option value="CAPITAL">CAPITAL (Modal Awal / Suntikan)</option>
              <option value="WITHDRAWAL">WITHDRAWAL (Tarik / Bank Deposit)</option>
              <option value="ADJUSTMENT">ADJUSTMENT (Selisih Laci)</option>
              <option value="OTHERS">OTHERS (Mutasi Lain-Lain)</option>
            </select>
          </div>

          {/* Payment Method selector */}
          <div className="md:col-span-2">
            <select
              id="cashflow-method-select"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-xl text-xs font-black text-slate-850 focus:outline-none focus:border-[#85A947]"
            >
              <option value="all">Semua Metode</option>
              <option value="CASH">CASH (Uang Tunai)</option>
              <option value="QRIS">QRIS / Digital</option>
              <option value="DEBIT">DEBIT / Transfer</option>
              <option value="GOPAY">GOPAY</option>
              <option value="OVO">OVO</option>
              <option value="SHOPEEPAY">SHOPEEPAY</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setMethodFilter('all');
                setStartDate('');
                setEndDate('');
                setTypeFilter('ALL');
              }}
              className="text-xs text-slate-500 hover:text-red-650 hover:underline font-extrabold flex items-center gap-1 cursor-pointer select-none"
            >
              <RefreshCw className="h-3 w-3" />
              Reset Filter
            </button>
          </div>
        </div>

        {/* Date Ranges selectors */}
        <div className="flex flex-wrap items-center gap-3.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              id="cashflow-date-from"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-205 rounded-lg text-xs font-bold text-slate-800"
            />
            <span className="text-xs text-slate-400 font-bold">s/d</span>
            <input
              id="cashflow-date-to"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-205 rounded-lg text-xs font-bold text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDateFilter('today')}
              className="px-3 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase rounded-md tracking-wide transition select-none cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handleQuickDateFilter('week')}
              className="px-3 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase rounded-md tracking-wide transition select-none cursor-pointer"
            >
              7 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={() => handleQuickDateFilter('month')}
              className="px-3 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase rounded-md tracking-wide transition select-none cursor-pointer"
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => handleQuickDateFilter('all')}
              className="px-3 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase rounded-md tracking-wide transition select-none cursor-pointer"
            >
              Semua Waktu
            </button>
          </div>
        </div>
      </div>

      {/* Main Ledger data table layout */}
      <div className="bg-white border border-slate-205 rounded-2xl overflow-hidden shadow-xs text-xs">
        <div className="p-4 bg-slate-50/50 border-b border-slate-205 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-slate-500" />
            <span className="font-sans font-black text-xs text-slate-900 tracking-wide uppercase">Buku Jurnal Aliran Kas ({sortedEntries.length} Baris Jurnal)</span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold bg-[#123524]/5 border border-dashed border-[#123524]/20 px-2 py-0.5 rounded text-emerald-955 select-none">
            Keamanan Buku Ganda Terkoneksi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 bg-[#FAF9F6]/50 font-mono text-[10px] uppercase font-bold tracking-wider">
                <th className="p-3.5 pl-6">Tanggal</th>
                <th className="p-3.5">Kategori Jurnal</th>
                <th className="p-3.5">Deskripsi Aliran Kas</th>
                <th className="p-3.5 font-mono">Metode Keuangan</th>
                <th className="p-3.5 font-mono text-center">Tipe Kas</th>
                <th className="p-3.5 font-mono text-right">Mutasi Nilai Kas</th>
                <th className="p-3.5 pr-6 text-center">Aksi / Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {sortedEntries.map((item) => {
                const isCustom = item.id.startsWith('cf_custom_') || item.id === 'cf_init';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Date */}
                    <td className="p-3.5 pl-6 text-slate-500 font-mono">
                      {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Category */}
                    <td className="p-3.5 font-sans font-black text-[10.5px]">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-black ${getCategoryBadgeStyles(item.category)}`}>
                        {item.category}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="p-3.5 text-slate-900 font-semibold max-w-[280px] truncate leading-normal">
                      {item.notes}
                    </td>

                    {/* Payment Method */}
                    <td className="p-3.5 font-mono font-bold text-slate-700">
                      <span className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-[10px]">
                        {item.paymentMethod || 'CASH'}
                      </span>
                    </td>

                    {/* Direct Flow Type (badge with green / red) */}
                    <td className="p-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-black text-[9px] border ${
                        item.type === 'CASH_IN'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : 'bg-red-50 text-red-900 border-red-300'
                      }`}>
                        {item.type === 'CASH_IN' ? (
                          <>
                            <ArrowUpRight className="h-3 w-3 text-emerald-700" />
                            MASUK
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft className="h-3 w-3 text-red-600" />
                            KELUAR
                          </>
                        )}
                      </span>
                    </td>

                    {/* Mutasi Nilai Kas */}
                    <td className={`p-3.5 font-mono font-black text-right text-xs ${
                      item.type === 'CASH_IN' ? 'text-emerald-700' : 'text-red-650'
                    }`}>
                      {item.type === 'CASH_IN' ? '+' : '-'} Rp {item.amount.toLocaleString('id-ID')}
                    </td>

                    {/* Actions / Operators */}
                    <td className="p-3.5 pr-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-mono text-[9px] text-slate-400 font-bold block bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                          {item.recordedBy}
                        </span>
                        
                        {isCustom ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(item)}
                            className="p-1 text-slate-450 hover:bg-red-50 hover:text-red-650 border border-transparent hover:border-red-200 rounded transition cursor-pointer"
                            title="Hapus Catatan Manual"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <div className="w-5" /> // Blank placeholder for locked system items
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {sortedEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 font-extrabold font-sans">
                    Arus kas kosong. Hubungi Admin atau silakan sesuaikan opsi filter pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Record custom cashflow insertion/extraction */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form onSubmit={handleSaveCustomEntry} className="bg-white border border-slate-250 p-6 rounded-2xl max-w-sm w-full text-slate-800 space-y-4 shadow-2xl">
            <h3 className="font-sans font-black text-xs uppercase tracking-wider text-[#123524] border-b border-slate-150 pb-2">Catat Mutasi Kas Baru</h3>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setFormType('CASH_IN');
                  setFormCategory('CAPITAL');
                }}
                className={`py-2 text-xs font-black rounded-lg border transition select-none cursor-pointer flex justify-center items-center gap-1.5 ${
                  formType === 'CASH_IN'
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-400 ring-2 ring-emerald-250/20'
                    : 'bg-white text-slate-500 border-slate-205'
                }`}
              >
                <ArrowUpRight className="h-4.5 w-4.5 text-emerald-700" />
                Uang Masuk
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormType('CASH_OUT');
                  setFormCategory('WITHDRAWAL');
                }}
                className={`py-2 text-xs font-black rounded-lg border transition select-none cursor-pointer flex justify-center items-center gap-1.5 ${
                  formType === 'CASH_OUT'
                    ? 'bg-red-50 text-red-950 border-red-300 hover:bg-red-50 ring-2 ring-red-250/20'
                    : 'bg-white text-slate-500 border-slate-205'
                }`}
              >
                <ArrowDownLeft className="h-4.5 w-4.5 text-red-600" />
                Uang Keluar
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold mb-1 uppercase tracking-wide">Kategori Aliran Kas *</label>
                <select
                  id="cashflow-add-category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as CashflowCategory)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-black focus:outline-none focus:border-[#85A947]"
                  required
                >
                  {formType === 'CASH_IN' ? (
                    <>
                      <option value="CAPITAL">CAPITAL (Modal Awal / Suntikan Kasir)</option>
                      <option value="ADJUSTMENT">ADJUSTMENT (Kelebihan Uang Laci Kasir)</option>
                      <option value="OTHERS">OTHERS (Uang Masuk Lain)</option>
                    </>
                  ) : (
                    <>
                      <option value="WITHDRAWAL">WITHDRAWAL (Setoran Bank / Tarik Uang Tunai)</option>
                      <option value="ADJUSTMENT">ADJUSTMENT (Kekurangan Uang Laci Kasir / Selisih)</option>
                      <option value="OTHERS">OTHERS (Uang Keluar Lain)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold mb-1 uppercase tracking-wide font-mono">Metode Kas</label>
                  <select
                    id="cashflow-add-method"
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-black"
                  >
                    <option value="CASH">CASH (Tunai)</option>
                    <option value="QRIS">QRIS / Digital</option>
                    <option value="DEBIT">DEBIT Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold mb-1 uppercase tracking-wide font-mono">Tanggal Mutasi</label>
                  <input
                    id="cashflow-add-date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold mb-1 uppercase tracking-wide font-mono">Nominal Mutasi Kas (Rp) *</label>
                <input
                  id="cashflow-add-amount"
                  type="number"
                  placeholder="Contoh: 500000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-right text-xs font-black font-mono focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold mb-1 uppercase tracking-wide font-mono">Keterangan Catatan *</label>
                <input
                  id="cashflow-add-notes"
                  type="text"
                  placeholder="Contoh: Setor tunai omset kemarin ke Bank BCA"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3.5 border-t border-slate-100">
              <button
                type="button"
                id="btn-close-cashflow-modal"
                onClick={() => setShowAddModal(false)}
                className="w-full py-2 bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-705 text-xs font-black rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                id="btn-save-cashflow"
                className="w-full py-2 bg-[#123524] text-white hover:bg-[#1C3E2F] text-xs font-black rounded-xl cursor-pointer"
              >
                Simpan Mutasi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
