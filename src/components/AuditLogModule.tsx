import React, { useState } from 'react';
import { ShieldAlert, Search, RefreshCw, Layers } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogProps {
  logs: AuditLog[];
}

export default function AuditLogModule({ logs }: AuditLogProps) {
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');

  // Filter lists
  const filtered = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(search.toLowerCase()) || 
                          log.user.toLowerCase().includes(search.toLowerCase()) || 
                          log.details.toLowerCase().includes(search.toLowerCase());
    const matchesModule = selectedModule === 'all' || log.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto font-sans">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-600" />
          <h2 className="text-sm font-black tracking-wide text-slate-800 uppercase animate-pulse">SYSTEM AUDIT TRAIL LOGS</h2>
        </div>
        <span className="text-[10px] font-mono font-bold text-red-700 bg-red-50 px-2 py-1 border border-red-200 rounded">
          Immutable Ledger
        </span>
      </div>

      <div className="bento-card flex flex-col md:flex-row gap-3.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            id="audit-search"
            type="text"
            placeholder="Cari aktivitas, nama petugas, deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-450 focus:outline-none focus:border-[#85A947] font-semibold transition"
          />
        </div>

        <div>
          <select
            id="audit-module-filter"
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:border-[#85A947]"
          >
            <option value="all">Semua Modul</option>
            <option value="POS">POS (Cashier)</option>
            <option value="Inventory">Inventory</option>
            <option value="Recipe">Recipes (BOM)</option>
            <option value="Expenses">Expenses Outlay</option>
            <option value="System Settings">System Settings</option>
          </select>
        </div>
      </div>

      <div className="bento-card !p-0 overflow-hidden text-xs text-slate-800 shadow-sm border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-mono font-bold text-[11px] uppercase tracking-wider">
              <th className="p-3">Timestamp</th>
              <th className="p-3">Petugas</th>
              <th className="p-3">Aksi / Operasi</th>
              <th className="p-3 font-mono text-center">Modul</th>
              <th className="p-3 font-mono">Log Detail Deskripsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="p-3 text-slate-500 font-mono text-[11px] font-semibold">
                  {new Date(log.timestamp).toLocaleString('id-ID')}
                </td>
                <td className="p-3 font-black text-slate-850 uppercase shrink-0">{log.user}</td>
                <td className="p-3 font-extrabold text-slate-900">{log.action}</td>
                <td className="p-3 text-center">
                  <span className="px-1.5 py-0.5 rounded text-[8.5px] uppercase font-mono bg-[#123524] text-white font-extrabold">
                    {log.module}
                  </span>
                </td>
                <td className="p-3 text-slate-600 leading-snug font-medium">{log.details}</td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-400 font-bold font-mono">
                  Belum ada log audit terekam atau filter tidak cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
