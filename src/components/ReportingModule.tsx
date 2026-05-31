import React, { useState } from 'react';
import { 
  FileSpreadsheet, Search, Filter, ArrowUpDown, ChevronLeft, 
  ChevronRight, Download, RefreshCw, Printer, Calendar
} from 'lucide-react';
import { Order, Payment, Product, RawMaterial, Recipe, Expense } from '../types';
import { calculateProductHpp } from '../data';

interface ReportProps {
  orders: Order[];
  payments: Payment[];
  products: Product[];
  rawMaterials: RawMaterial[];
  recipes: Recipe[];
  expenses: Expense[];
}

type ReportType = 'sales' | 'inventory' | 'expenses' | 'profit' | 'cashier';

export default function ReportingModule({
  orders,
  payments,
  products,
  rawMaterials,
  recipes,
  expenses
}: ReportProps) {
  // States
  const [activeReport, setActiveReport] = useState<ReportType>('sales');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // YYYY-MM-DD
  const [sortField, setSortField] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const completedOrders = orders.filter(o => o.status !== 'OPEN');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Convert array rows into a downloadable CSV string file
  const exportToCSV = (headers: string[], rows: any[][], fileName: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => {
          if (typeof val === 'string') {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Sales Report Process
  const getSalesReportData = () => {
    let rawData = completedOrders.map(o => {
      const payment = payments.find(p => p.orderId === o.id);
      return {
        id: o.id,
        date: o.createdAt,
        code: o.code,
        tableName: o.tableName || 'Take Away',
        customerName: o.customerName,
        itemsCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
        amount: o.total,
        method: payment?.method || 'CASH',
        cashier: o.cashierName
      };
    });

    // Query Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rawData = rawData.filter(d => 
        d.code.toLowerCase().includes(q) || 
        d.customerName.toLowerCase().includes(q) || 
        d.cashier.toLowerCase().includes(q)
      );
    }

    if (dateFilter) {
      rawData = rawData.filter(d => d.date.startsWith(dateFilter));
    }

    // Sorting
    rawData.sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (valA === undefined) return 1;
      if (valB === undefined) return -1;
      if (typeof valA === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });

    return rawData;
  };

  // Render Inventory Report
  const getInventoryReportData = () => {
    let rawData = rawMaterials.map(rm => {
      return {
        id: rm.id,
        name: rm.name,
        stock: rm.stock,
        min: rm.minStock,
        unit: rm.unit,
        value: rm.stock * rm.averageCost,
        cost: rm.averageCost,
        status: rm.stock <= rm.minStock ? 'CRITICAL' : 'SAFE'
      };
    });

    if (searchQuery) {
      rawData = rawData.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    rawData.sort((a: any, b: any) => {
      let valA = a[sortField === 'date' ? 'name' : sortField];
      let valB = b[sortField === 'date' ? 'name' : sortField];
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });

    return rawData;
  };

  // Render Expense Report
  const getExpenseReportData = () => {
    let rawData = expenses.map(e => ({
      id: e.id,
      date: e.date,
      category: e.category,
      notes: e.notes,
      amount: e.amount,
      recordedBy: e.recordedBy
    }));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rawData = rawData.filter(d => d.notes.toLowerCase().includes(q) || d.recordedBy.toLowerCase().includes(q));
    }

    if (dateFilter) {
      rawData = rawData.filter(d => d.date.startsWith(dateFilter));
    }

    rawData.sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });

    return rawData;
  };

  // Render Profit/Loss Report (Date Bound)
  const getProfitReportData = () => {
    // Collect financial statements grouped by Days
    // Date dates lists
    const dates = Array.from(new Set([
      ...completedOrders.map(o => o.createdAt.slice(0, 10)),
      ...expenses.map(e => e.date.slice(0, 10))
    ])).sort().reverse();

    let rawData = dates.map(date => {
      const dayCompleted = completedOrders.filter(o => o.createdAt.startsWith(date));
      const dayRevenue = dayCompleted.reduce((sum, o) => sum + o.total, 0);
      
      const dayCogs = dayCompleted.reduce((sumCogs, order) => {
        const orderCogs = order.items.reduce((sum, item) => {
          return sum + (calculateProductHpp(item.productId, recipes, rawMaterials, products) * item.quantity);
        }, 0);
        return sumCogs + orderCogs;
      }, 0);

      const dayExpenses = expenses.filter(e => e.date.startsWith(date)).reduce((sum, e) => sum + e.amount, 0);
      
      return {
        id: date,
        date: date,
        revenue: dayRevenue,
        cogs: dayCogs,
        gross: dayRevenue - dayCogs,
        expenses: dayExpenses,
        net: dayRevenue - dayCogs - dayExpenses
      };
    });

    if (searchQuery) {
      rawData = rawData.filter(d => d.date.includes(searchQuery));
    }

    if (dateFilter) {
      rawData = rawData.filter(d => d.date === dateFilter);
    }

    return rawData;
  };

  // Render Cashier Report
  const getCashierReportData = () => {
    // Group active cashier profiles and totals
    const cashiers = Array.from(new Set(completedOrders.map(o => o.cashierName || 'Kasir Default')));
    
    let rawData = cashiers.map(cName => {
      const myOrders = completedOrders.filter(o => o.cashierName === cName);
      const trxCount = myOrders.length;
      const totalAmount = myOrders.reduce((sum, o) => sum + o.total, 0);
      return {
        id: cName,
        cashierName: cName,
        transactions: trxCount,
        omzetSum: totalAmount,
        avgTicket: trxCount > 0 ? Math.round(totalAmount / trxCount) : 0
      };
    });

    if (searchQuery) {
      rawData = rawData.filter(d => d.cashierName.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return rawData;
  };

  // Unified Data Resolver
  const getReportRows = () => {
    switch(activeReport) {
      case 'sales': return getSalesReportData();
      case 'inventory': return getInventoryReportData();
      case 'expenses': return getExpenseReportData();
      case 'profit': return getProfitReportData();
      case 'cashier': return getCashierReportData();
    }
  };

  const reportRows = getReportRows();

  // Handle Paginate
  const pageCount = Math.ceil(reportRows.length / itemsPerPage) || 1;
  const paginatedRows = reportRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Trigger CSV Download action
  const handleTriggerExport = () => {
    const timeStr = new Date().toISOString().slice(0, 10);
    const prefix = `kedai_fizqo_report_${activeReport}_${timeStr}`;

    if (activeReport === 'sales') {
      const headers = ['Waktu', 'Order Code', 'Meja', 'Customer', 'Jumlah Item', 'Metode Bayar', 'Total (Rp)', 'Kasir'];
      const data = reportRows.map((d: any) => [
        d.date, d.code, d.tableName, d.customerName, d.itemsCount, d.method, d.amount, d.cashier
      ]);
      exportToCSV(headers, data, prefix);
    } else if (activeReport === 'inventory') {
      const headers = ['Bahan Baku', 'Tingkat Stok', 'Minimum Alert', 'Satuan', 'Unit Cost (Rp)', 'Nilai Inventory (Rp)', 'Status'];
      const data = reportRows.map((d: any) => [
        d.name, d.stock, d.min, d.unit, d.cost, d.value, d.status
      ]);
      exportToCSV(headers, data, prefix);
    } else if (activeReport === 'expenses') {
      const headers = ['Tanggal', 'Kategori', 'Keterangan', 'Nominal Tagihan (Rp)', 'Pembuat'];
      const data = reportRows.map((d: any) => [
        d.date, d.category, d.notes, d.amount, d.recordedBy
      ]);
      exportToCSV(headers, data, prefix);
    } else if (activeReport === 'profit') {
      const headers = ['Tanggal', 'Omzet Kotor (Rp)', 'COGS HPP (Rp)', 'Profit Kotor (Rp)', 'Expense Outlay (Rp)', 'Profit Bersih (Rp)'];
      const data = reportRows.map((d: any) => [
        d.date, d.revenue, d.cogs, d.gross, d.expenses, d.net
      ]);
      exportToCSV(headers, data, prefix);
    } else if (activeReport === 'cashier') {
      const headers = ['Nama Kasir', 'Total Transaksi', 'Akumulasi Omzet (Rp)', 'Average Ticket size (Rp)'];
      const data = reportRows.map((d: any) => [
        d.cashierName, d.transactions, d.omzetSum, d.avgTicket
      ]);
      exportToCSV(headers, data, prefix);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 h-full overflow-y-auto font-sans">

      {/* Primary Report Selector Navigation buttons */}
      <div className="flex bg-slate-100 border border-slate-200 p-1.5 rounded-2xl justify-between overflow-x-auto gap-1 shadow-xs">
        {[
          { id: 'sales', label: 'Laporan Penjualan (Sales)' },
          { id: 'inventory', label: 'Laporan Inventory Stok' },
          { id: 'expenses', label: 'Laporan Pengeluaran' },
          { id: 'profit', label: 'Estimasi Laba / Rugi (P&L)' },
          { id: 'cashier', label: 'Laporan Kasir' }
        ].map((rep) => (
          <button
            id={`btn-report-${rep.id}`}
            key={rep.id}
            onClick={() => {
              setActiveReport(rep.id as ReportType);
              setCurrentPage(1);
              setSearchQuery('');
              setDateFilter('');
            }}
            className={`px-4 py-3 rounded-xl text-xs font-black whitespace-nowrap tracking-wide flex-1 transition-all cursor-pointer ${
              activeReport === rep.id
                ? 'bg-[#123524] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {rep.label}
          </button>
        ))}
      </div>

      {/* Dynamic Search Filters frame */}
      <div className="bento-card flex flex-col md:flex-row gap-3.5 bg-white border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="report-query-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik kata kunci pencarian..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:border-[#85A947] transition"
          />
        </div>

        {activeReport !== 'inventory' && activeReport !== 'cashier' && (
          <div className="flex gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="report-date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-[#85A947] font-mono"
              />
            </div>
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-red-600 font-mono hover:underline font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Primary Export trigger */}
        <button
          id="btn-export-csv"
          onClick={handleTriggerExport}
          className="px-4 py-2 bg-[#123524] hover:bg-[#1A3F2C] border border-[#1A3F2C] rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Export (CSV)</span>
        </button>
      </div>

      {/* RENDER TABLE DYNAMIC CONTENT */}
      <div className="bento-card overflow-hidden !p-0 bg-white border border-slate-200 shadow-xs">
        
        {/* Sales report */}
        {activeReport === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-bold font-mono">
                  <th className="p-3.5 cursor-pointer" onClick={() => handleSort('date')}>Tanggal Trx <ArrowUpDown className="inline h-3 w-3 ml-1" /></th>
                  <th className="p-3.5 cursor-pointer" onClick={() => handleSort('code')}>Order ID <ArrowUpDown className="inline h-3 w-3 ml-1" /></th>
                  <th className="p-3.5">Meja</th>
                  <th className="p-3.5 cursor-pointer" onClick={() => handleSort('customerName')}>Customer <ArrowUpDown className="inline h-3 w-3 ml-1" /></th>
                  <th className="p-3.5 text-center">Items</th>
                  <th className="p-3.5 text-center">Metode</th>
                  <th className="p-3.5 text-right cursor-pointer" onClick={() => handleSort('amount')}>Total Sales <ArrowUpDown className="inline h-3 w-3 ml-1" /></th>
                  <th className="p-3.5">Kasir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedRows.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50/65 transition-colors">
                    <td className="p-3.5 text-slate-500">{new Date(row.date).toLocaleString('id-ID')}</td>
                    <td className="p-3.5 font-mono font-black text-emerald-850">{row.code}</td>
                    <td className="p-3.5 font-mono">{row.tableName}</td>
                    <td className="p-3.5 font-bold uppercase text-slate-900">{row.customerName}</td>
                    <td className="p-3.5 text-center font-mono font-bold">{row.itemsCount}</td>
                    <td className="p-3.5 text-center font-mono"><span className="px-1.5 py-0.5 bg-green-50 text-green-850 font-extrabold border border-green-200 rounded text-[10px]">{row.method}</span></td>
                    <td className="p-3.5 text-right font-mono font-black text-slate-850">Rp {row.amount.toLocaleString('id-ID')}</td>
                    <td className="p-3.5 text-slate-500 font-bold">{row.cashier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Inventory report */}
        {activeReport === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-bold font-mono">
                  <th className="p-3.5 cursor-pointer" onClick={() => handleSort('name')}>Nama Bahan Baku <ArrowUpDown className="inline h-3 w-3 ml-1" /></th>
                  <th className="p-3.5 text-center cursor-pointer" onClick={() => handleSort('stock')}>Tingkat Stok <ArrowUpDown className="inline h-3 w-3 ml-1" /></th>
                  <th className="p-3.5 text-center">Threshold Minim</th>
                  <th className="p-3.5 text-right cursor-pointer" onClick={() => handleSort('cost')}>Unit Cost <ArrowUpDown className="inline h-3 w-3 ml-1" /></th>
                  <th className="p-3.5 text-right cursor-pointer" onClick={() => handleSort('value')}>Aset Valuation <ArrowUpDown className="inline h-3 w-3 ml-1" /></th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedRows.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50/65 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{row.name}</td>
                    <td className="p-3.5 text-center font-mono font-black text-slate-800">
                      {row.stock.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-bold">{row.unit}</span>
                    </td>
                    <td className="p-3.5 text-center font-mono text-slate-500 font-bold">
                      {row.min.toLocaleString('id-ID')} {row.unit}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold">Rp {row.cost.toLocaleString('id-ID')}</td>
                    <td className="p-3.5 text-right font-mono font-black text-emerald-800">
                      Rp {row.value.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8.5px] uppercase font-mono font-black border ${
                        row.status === 'CRITICAL' 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : 'bg-green-50 text-green-800 border-green-200'
                      }`}>
                        {row.status === 'CRITICAL' ? 'LOW STOK' : 'AMAN'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Expenses report */}
        {activeReport === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-bold font-mono">
                  <th className="p-3.5 cursor-pointer" onClick={() => handleSort('date')}>Tanggal <ArrowUpDown className="inline h-3 w-3 ml-1" /></th>
                  <th className="p-3.5 cursor-pointer" onClick={() => handleSort('category')}>Kategori <ArrowUpDown className="inline h-3 w-3 ml-1" /></th>
                  <th className="p-3.5 font-bold text-slate-800">Notes Pengeluaran</th>
                  <th className="p-3.5 text-right cursor-pointer" onClick={() => handleSort('amount')}>Nominal Biaya <ArrowUpDown className="inline h-3 w-3 ml-1" /></th>
                  <th className="p-3.5">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedRows.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50/65 transition-colors">
                    <td className="p-3.5 text-slate-500 font-semibold">
                      {new Date(row.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-3.5">
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-extrabold bg-[#123524] text-white">{row.category}</span>
                    </td>
                    <td className="p-3.5 max-w-[300px] truncate text-slate-800 font-semibold">{row.notes}</td>
                    <td className="p-3.5 text-right font-mono font-black text-red-700">Rp {row.amount.toLocaleString('id-ID')}</td>
                    <td className="p-3.5 text-slate-400 font-bold font-mono text-[10px]">{row.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Profit report */}
        {activeReport === 'profit' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-bold font-mono">
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5 text-right font-mono">Pendapatan Kotor (Rev)</th>
                  <th className="p-3.5 text-right font-mono">Beban Pokok (COGS)</th>
                  <th className="p-3.5 text-right font-mono">Margin Kotor</th>
                  <th className="p-3.5 text-right font-mono">Operational Outflow</th>
                  <th className="p-3.5 text-right font-mono">Pendapatan Bersih (Net)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedRows.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50/65 transition-colors">
                    <td className="p-3.5 text-slate-500 font-bold">
                      {new Date(row.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold">Rp {row.revenue.toLocaleString('id-ID')}</td>
                    <td className="p-3.5 text-right font-mono text-slate-400 font-bold">Rp {row.cogs.toLocaleString('id-ID')}</td>
                    <td className="p-3.5 text-right font-mono text-emerald-800 font-extrabold">Rp {row.gross.toLocaleString('id-ID')}</td>
                    <td className="p-3.5 text-right font-mono text-red-700 font-bold">Rp {row.expenses.toLocaleString('id-ID')}</td>
                    <td className="p-3.5 text-right font-mono font-black text-emerald-900 bg-emerald-50/30">
                      Rp {row.net.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cashier report */}
        {activeReport === 'cashier' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-bold font-mono">
                  <th className="p-3.5">Petugas Kasir</th>
                  <th className="p-3.5 text-center font-mono">Jumlah Shift Pembayaran</th>
                  <th className="p-3.5 text-right font-mono">Total Akumulasi Omzet</th>
                  <th className="p-3.5 text-right font-mono">Average Ticket Size (AOV)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedRows.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50/65 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 uppercase">{row.cashierName}</td>
                    <td className="p-3.5 text-center font-mono font-bold text-slate-600">{row.transactions} Trx</td>
                    <td className="p-3.5 text-right font-mono font-black text-emerald-800">Rp {row.omzetSum.toLocaleString('id-ID')}</td>
                    <td className="p-3.5 text-right font-mono font-bold">Rp {row.avgTicket.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportRows.length === 0 && (
          <div className="p-16 text-center text-slate-400 font-black font-mono bg-slate-20/5">
            Data laporan tidak tersedia untuk kriteria ini.
          </div>
        )}

        {/* Simple Pagination Footer details */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono text-[10.5px] font-bold">
            Menampilkan {reportRows.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, reportRows.length)} dari {reportRows.length} baris
          </span>

          <div className="flex gap-2">
            <button
              id="btn-report-prev-page"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-2.5 py-1.5 bg-white font-extrabold disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 border border-slate-300 rounded cursor-pointer hover:bg-slate-50 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 bg-slate-200/60 text-slate-800 border border-slate-300 rounded font-mono font-black text-[11px] flex items-center justify-center">
              {currentPage} / {pageCount}
            </span>
            <button
              id="btn-report-next-page"
              disabled={currentPage === pageCount}
              onClick={() => setCurrentPage(prev => Math.min(pageCount, prev + 1))}
              className="px-2.5 py-1.5 bg-white font-extrabold disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 border border-slate-300 rounded cursor-pointer hover:bg-slate-50 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
