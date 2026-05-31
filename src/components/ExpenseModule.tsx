import React, { useState } from 'react';
import { Wallet, Plus, Trash2, Search, Filter, Calendar, Tag } from 'lucide-react';
import { Expense, ExpenseCategory } from '../types';

interface ExpenseProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  currentUser: { name: string };
  onAddAuditLog: (action: string, module: string, details: string) => void;
}

export default function ExpenseModule({
  expenses,
  onAddExpense,
  currentUser,
  onAddAuditLog
}: ExpenseProps) {
  // States
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  
  // Form input states
  const [category, setCategory] = useState<ExpenseCategory>('Operational');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert("⚠️ Harap masukkan nominal pengeluaran yang valid.");
      return;
    }

    if (!notes.trim()) {
      alert("⚠️ Masukkan deskripsi pengeluaran.");
      return;
    }

    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      category,
      amount: Number(amount),
      notes: notes.trim(),
      date,
      recordedBy: currentUser.name
    };

    onAddExpense(newExpense);
    onAddAuditLog('Add Expense', 'Expenses', `Added Rp ${newExpense.amount.toLocaleString('id-ID')} expense for category ${category}`);
    
    // Reset
    setShowAddModal(false);
    setAmount('');
    setNotes('');
    setCategory('Operational');
    alert("✅ Pengeluaran berhasil dicatat!");
  };

  // Aggregated totals
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Filtered expense lists
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.notes.toLowerCase().includes(searchQuery.toLowerCase()) || e.recordedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' || e.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 h-full overflow-y-auto">
      
      {/* Metric totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-slate-800 shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest font-extrabold block">Total Pengeluaran</span>
            <span className="text-xl font-bold font-mono text-red-650">Rp {totalExpenseAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="h-10 w-10 text-red-600 rounded-lg bg-red-50 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-red-600" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
          <button
            id="btn-add-expense-modal"
            onClick={() => setShowAddModal(true)}
            className="w-full py-2.5 bg-[#123524] text-white hover:bg-[#1A3F2C] font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Catat Pengeluaran Baru</span>
          </button>
        </div>
      </div>

      {/* Expense lists and query filters */}
      <div className="space-y-4">
        
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row gap-4 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              id="expense-search"
              type="text"
              placeholder="Cari pengeluaran atau penginput..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#85A947]"
            />
          </div>

          <div className="flex gap-2.5">
            <select
              id="expense-category-filter"
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#85A947]"
            >
              <option value="all">Semua Kategori</option>
              <option value="Raw Material">Raw Material</option>
              <option value="Salary">Salary</option>
              <option value="Utilities">Utilities</option>
              <option value="Rent">Rent</option>
              <option value="Internet">Internet</option>
              <option value="Operational">Operational</option>
              <option value="Others">Others</option>
            </select>
          </div>
        </div>

        {/* Expenses List Tables */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-xs text-slate-700 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-mono text-[10px] uppercase font-bold tracking-wider">
                <th className="p-3 pl-4">Tanggal</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Keterangan / Deskripsi</th>
                <th className="p-3 font-mono text-right">Nominal Tagihan</th>
                <th className="p-3 pr-4">Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 pl-4 text-slate-500">
                    {new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-3 font-semibold">
                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold bg-green-50 text-green-800 border border-green-200">
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-3 text-slate-900 font-semibold max-w-[280px] truncate">{exp.notes}</td>
                  <td className="p-3 font-mono text-right font-bold text-red-650">
                    Rp {exp.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 pr-4 text-slate-500 font-mono text-[10px] font-semibold">{exp.recordedBy}</td>
                </tr>
              ))}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                    Belum ada pengeluaran dicatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL: Record Expense Form */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-xs">
          <form onSubmit={handleSaveExpense} className="bg-white border border-slate-250 p-6 rounded-2xl max-w-sm w-full text-slate-800 space-y-4 shadow-xl">
            <h3 className="font-sans font-extrabold text-xs uppercase tracking-wider text-[#123524] border-b border-slate-100 pb-2">Catat Pengeluaran Baru</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Kategori Pengeluaran</label>
                <select
                  id="expense-add-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 font-semibold"
                >
                  <option value="Raw Material">Raw Material (Kulakan Bahan)</option>
                  <option value="Salary">Salary (Gaji Staf)</option>
                  <option value="Utilities">Utilities (Listrik, Air)</option>
                  <option value="Rent">Rent (Sewa Lahan)</option>
                  <option value="Internet">Internet (WiFi Kafe)</option>
                  <option value="Operational">Operational (Operasional Harian)</option>
                  <option value="Others">Others (Lain-lain)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Nominal Biaya (Rp) *</label>
                <input
                  id="expense-add-amount"
                  type="number"
                  placeholder="Contoh: 154000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-right font-bold font-mono focus:outline-[#85A947]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Tanggal Transaksi</label>
                <input
                  id="expense-add-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase font-mono">Catatan Deskripsi *</label>
                <input
                  id="expense-add-notes"
                  type="text"
                  placeholder="Contoh: Pembelian susu milk murni..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                id="btn-close-expense-modal"
                onClick={() => setShowAddModal(false)}
                className="w-full py-2 border border-slate-300 text-slate-600 text-xs font-bold rounded-lg transition hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                id="btn-save-expense-submit"
                className="w-full py-2 bg-[#123524] text-white hover:bg-[#1A3F2C] font-bold text-xs rounded-lg shadow cursor-pointer"
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
