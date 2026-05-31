import React from 'react';
import { 
  TrendingUp, ShoppingBag, Banknote, Percent, Coffee, 
  Clock, Award, Users, AlertTriangle, Layers, Wallet 
} from 'lucide-react';
import { Order, Payment, Product, RawMaterial, Recipe, Expense } from '../types';
import { calculateProductHpp } from '../data';

interface DashboardProps {
  orders: Order[];
  payments: Payment[];
  products: Product[];
  rawMaterials: RawMaterial[];
  recipes: Recipe[];
  expenses: Expense[];
}

export default function DashboardModule({
  orders,
  payments,
  products,
  rawMaterials,
  recipes,
  expenses
}: DashboardProps) {
  
  // Helpers to check date matching (e.g. "today")
  // Since user local timezone is set (2026-05-29), let's use 2026-05-29 as today's benchmark
  const getTodayISOString = () => '2026-05-29';

  // Filter Completed orders (status === PAID / CLOSED)
  const completedOrders = orders.filter(o => o.status !== 'OPEN');

  // Today Orders
  const todayOrders = completedOrders.filter(o => o.createdAt.startsWith(getTodayISOString()));
  const todayCount = todayOrders.length;

  // KPIs
  const todayOmzet = todayOrders.reduce((sum, o) => sum + o.total, 0);

  // Today's total products COGS (HPP)
  const calculateTodayCogs = () => {
    return todayOrders.reduce((totalCogs, order) => {
      const orderCogs = order.items.reduce((sum, item) => {
        const itemHpp = calculateProductHpp(item.productId, recipes, rawMaterials, products);
        return sum + (itemHpp * item.quantity);
      }, 0);
      return totalCogs + orderCogs;
    }, 0);
  };
  const todayCogs = calculateTodayCogs();

  // Today Profit (Omzet - Today COGS - Today expenses representing raw purchases/operational)
  // For standard estimation: Profit = Today Omzet - Today COGS
  const todayProfit = todayOmzet - todayCogs;

  const averageTransaction = todayCount > 0 ? Math.round(todayOmzet / todayCount) : 0;

  // Let's build metrics for historical TRENDS (last 4 days)
  // Indexes: Day 3, Day 2, Day 1, Day 0 (today)
  const daysLabel = ['26 Mei', '27 Mei', '28 Mei', '29 Mei (Hari Ini)'];
  const dayDates = ['2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29'];

  const trendData = dayDates.map(date => {
    const dayCompleted = completedOrders.filter(o => o.createdAt.startsWith(date));
    const dayTotalSum = dayCompleted.reduce((sum, o) => sum + o.total, 0);
    return dayTotalSum;
  });

  // Calculate highest trend for scale
  const maxTrend = Math.max(...trendData, 100000);

  // Product sold count rankings (Best / Worst Seller)
  const productSalesMap: { [productId: string]: { name: string; qty: number; totalRev: number } } = {};
  
  // Initialize map with all available projects
  products.forEach(p => {
    productSalesMap[p.id] = { name: p.name, qty: 0, totalRev: 0 };
  });

  completedOrders.forEach(o => {
    o.items.forEach(item => {
      if (productSalesMap[item.productId]) {
        productSalesMap[item.productId].qty += item.quantity;
        productSalesMap[item.productId].totalRev += (item.price * item.quantity);
      }
    });
  });

  const rankedProducts = Object.keys(productSalesMap).map(id => ({
    id,
    ...productSalesMap[id]
  })).sort((a, b) => b.qty - a.qty);

  const bestSellers = rankedProducts.slice(0, 3);
  const worstSellers = rankedProducts.filter(p => products.some(prod => prod.id === p.id)).reverse().slice(0, 3);

  // Peak Hour analysis
  // 08:00 - 11:59 (Pagi / Siang)
  // 12:00 - 14:59 (Lunch Hour)
  // 15:00 - 17:59 (Sore Relax)
  // 18:00 - 22:00 (Dinner Hour / Peak)
  const hoursDistribution = { 'Pagi (08-12)': 0, 'Lunch (12-15)': 0, 'Sore (15-18)': 0, 'Malam (18-22)': 0 };
  
  completedOrders.forEach(o => {
    const hour = new Date(o.createdAt).getUTCHours() + 7; // Convert to WIB
    if (hour >= 8 && hour < 12) hoursDistribution['Pagi (08-12)'] += o.total;
    else if (hour >= 12 && hour < 15) hoursDistribution['Lunch (12-15)'] += o.total;
    else if (hour >= 15 && hour < 18) hoursDistribution['Sore (15-18)'] += o.total;
    else if (hour >= 18 && hour <= 23) hoursDistribution['Malam (18-22)'] += o.total;
  });

  const maxHourValue = Math.max(...Object.values(hoursDistribution), 10000);

  // Cashier performance analytics metrics
  const cashierMap: { [name: string]: { count: number; omzet: number } } = {};
  completedOrders.forEach(o => {
    const cName = o.cashierName || 'System Process';
    if (!cashierMap[cName]) {
      cashierMap[cName] = { count: 0, omzet: 0 };
    }
    cashierMap[cName].count += 1;
    cashierMap[cName].omzet += o.total;
  });

  // Expense distribution
  const expenseSummary = {
    'Raw Material': 0, 'Salary': 0, 'Utilities': 0, 'Internet': 0, 'Operational': 0, 'Others': 0
  };
  expenses.forEach(e => {
    if (expenseSummary[e.category] !== undefined) {
      expenseSummary[e.category] += e.amount;
    }
  });

  const totalExpense = Object.values(expenseSummary).reduce((sum, v) => sum + v, 0);

  return (
    <div className="p-4 md:p-6 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto font-sans">
      
      {/* KPI Section with Bento Card classes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Omzet */}
        <div className="bento-card flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 text-slate-800">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest block font-extrabold">Omzet Hari Ini</span>
            <span className="text-2xl font-black font-mono text-[#123524]">Rp {todayOmzet.toLocaleString('id-ID')}</span>
            <span className="text-[10px] text-slate-400 block font-semibold">Target: 1.000 Transaksi / hari</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-[#85A947]" />
          </div>
        </div>

        {/* Profit */}
        <div className="bento-card flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 text-slate-800">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest block font-extrabold">Estimasi Gross Profit</span>
            <span className="text-2xl font-black font-mono text-emerald-800">Rp {todayProfit.toLocaleString('id-ID')}</span>
            <span className="text-[10px] text-emerald-700 font-bold block">Margin: {todayOmzet > 0 ? ((todayProfit / todayOmzet) * 100).toFixed(0) : 0}%</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Banknote className="h-5 w-5 text-emerald-600" />
          </div>
        </div>

        {/* Transactions count */}
        <div className="bento-card flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 text-slate-800">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest block font-extrabold">Transaksi Berhasil</span>
            <span className="text-2xl font-black font-mono text-blue-800">{todayCount} Trx</span>
            <span className="text-[10px] text-slate-400 block font-semibold">Antrean POS Kasir Utama</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        {/* Average value */}
        <div className="bento-card flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 text-slate-800">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest block font-extrabold">Average Ticket Size</span>
            <span className="text-2xl font-black font-mono text-indigo-800">Rp {averageTransaction.toLocaleString('id-ID')}</span>
            <span className="text-[10px] text-slate-400 block font-semibold">Nilai belanja rata-rata</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Percent className="h-5 w-5 text-indigo-600" />
          </div>
        </div>

      </div>

      {/* Charts Bento Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend chart card (Bento grid col-span-2) */}
        <div className="lg:col-span-2 bento-card space-y-4 text-slate-800">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">GRAFIK OMZET BULANAN (TREN SALES)</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Sumbu diagram menunjukkan omzet harian akumulatif Kedai Fizqo.</p>
          </div>

          {/* SVG Custom Premium Line Chart */}
          <div className="relative w-full h-48 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            {/* Visual background lines */}
            <div className="absolute inset-x-0 top-1/4 border-b border-slate-200/50" />
            <div className="absolute inset-x-0 top-1/2 border-b border-slate-200/50" />
            <div className="absolute inset-x-0 top-3/4 border-b border-slate-200/50" />
            
            {/* Vector Plot Area */}
            <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible z-10">
              <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4D7C0F" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#4D7C0F" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Vector Area path */}
              <path
                d={`
                  M 10 110 
                  L 10 ${105 - (trendData[0] / maxTrend * 80)} 
                  L 130 ${105 - (trendData[1] / maxTrend * 80)} 
                  L 250 ${105 - (trendData[2] / maxTrend * 80)} 
                  L 370 ${105 - (trendData[3] / maxTrend * 80)}
                  L 370 110 Z
                `}
                fill="url(#chart-grad)"
              />

              {/* Vector stroke path */}
              <path
                d={`
                  M 10 ${105 - (trendData[0] / maxTrend * 80)} 
                  L 130 ${105 - (trendData[1] / maxTrend * 80)} 
                  L 250 ${105 - (trendData[2] / maxTrend * 80)} 
                  L 370 ${105 - (trendData[3] / maxTrend * 80)}
                `}
                fill="none"
                stroke="#4D7C0F"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points indicators */}
              <circle cx="10" cy={105 - (trendData[0] / maxTrend * 80)} r="4" fill="#4D7C0F" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx="130" cy={105 - (trendData[1] / maxTrend * 80)} r="4" fill="#4D7C0F" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx="250" cy={105 - (trendData[2] / maxTrend * 80)} r="4" fill="#4D7C0F" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx="370" cy={105 - (trendData[3] / maxTrend * 80)} r="4" fill="#123524" stroke="#FFFFFF" strokeWidth="1.5" />
            </svg>

            {/* Bottom X-Axis labels */}
            <div className="flex flex-wrap sm:flex-nowrap justify-between gap-2 font-mono text-[8px] sm:text-[9px] text-slate-500 px-1 border-t border-slate-200/50 pt-1">
              {daysLabel.map((dl, idx) => (
                <div key={idx} className="text-center min-w-[70px] sm:min-w-0">
                  <span className="font-semibold block truncate">{dl}</span>
                  <span className="block font-extrabold text-[#123524] whitespace-nowrap">Rp {trendData[idx].toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Peak Hours distribution widget */}
        <div className="bento-card space-y-4 text-slate-800">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">PEAK HOURS (SISTEM KASIR)</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Jam tersibuk perputaran omzet harian cafe.</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {Object.keys(hoursDistribution).map((key) => {
              const val = hoursDistribution[key];
              const percent = maxHourValue > 0 ? (val / maxHourValue) * 100 : 0;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex flex-wrap justify-between gap-1 font-mono text-[10px] font-semibold">
                    <span className="text-slate-500">{key}</span>
                    <span className="text-slate-850 font-extrabold whitespace-nowrap">Rp {val.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className="bg-[#123524] h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Rankings Side bento & Expense distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Best Sellers */}
        <div className="bento-card space-y-4 text-slate-800">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Award className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-800">🏆 BEST SELLER MENU</h3>
          </div>
          <div className="space-y-3">
            {bestSellers.map((item, idx) => (
              <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 bg-slate-50 p-3 border border-slate-150 rounded-xl transition-colors hover:bg-slate-100/50">
                <div className="flex items-center gap-2.5 overflow-hidden min-w-[120px] flex-1">
                  <span className="font-extrabold text-[#4D7C0F] font-mono">#{idx+1}</span>
                  <p className="text-xs font-bold truncate text-slate-800">{item.name}</p>
                </div>
                <div className="text-left sm:text-right shrink-0 min-w-[70px]">
                  <span className="block font-mono text-xs font-bold text-slate-900">{item.qty} Porsi</span>
                  <span className="text-[9px] text-[#4D7C0F]/80 font-bold block whitespace-nowrap">Rp {item.totalRev.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worst Sellers */}
        <div className="bento-card space-y-4 text-slate-800">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-800">⚠️ EVALUASI PENJUALAN KURANG</h3>
          </div>
          <div className="space-y-3">
            {worstSellers.map((item, idx) => (
              <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 bg-slate-50 p-3 border border-slate-150 rounded-xl transition-colors hover:bg-red-50/40">
                <div className="flex items-center gap-2.5 overflow-hidden min-w-[120px] flex-1">
                  <span className="font-extrabold text-red-650 font-mono">#{idx+1}</span>
                  <p className="text-xs font-bold truncate text-slate-700">{item.name}</p>
                </div>
                <div className="text-left sm:text-right shrink-0 min-w-[70px]">
                  <span className="block font-mono text-xs font-bold text-red-700">{item.qty} Trx</span>
                  <span className="text-[9px] text-slate-400 block font-semibold whitespace-nowrap">Rp {item.totalRev.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Expense allocation */}
        <div className="bento-card space-y-4 text-slate-800">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Wallet className="h-4 w-4 text-red-600" />
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-800 font-sans">💸 ALOKASI BIAYA OUTFLOW</h3>
          </div>
          <div className="space-y-3 text-xs">
            {Object.keys(expenseSummary).map((catName) => {
              const amt = expenseSummary[catName];
              const ratio = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
              return (
                <div key={catName} className="space-y-1">
                  <div className="flex flex-wrap justify-between gap-1 text-[11px] font-mono font-bold">
                    <span className="text-slate-500">{catName}</span>
                    <span className="text-slate-800 font-extrabold whitespace-nowrap">{ratio.toFixed(0)}% <span className="text-slate-400 font-semibold font-sans">({(amt/1000).toFixed(0)}k)</span></span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded border border-slate-200">
                    <div 
                      className="bg-red-500 h-full rounded"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
