import React from 'react';
import { 
  ShoppingBag, BarChart3, BookOpen, Layers, 
  Wallet, FileSpreadsheet, ShieldAlert, Settings, 
  Menu, X, Coffee, User, LogOut, Coins, HelpCircle
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: { name: string; role: UserRole };
  cafeName: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onLogout: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentUser,
  cafeName,
  mobileMenuOpen,
  setMobileMenuOpen,
  onLogout
}: SidebarProps) {
  // Main/Transactions Menu items (Simple 1-2 words)
  const mainMenuItems = [
    { id: 'pos', name: 'POS Kasir', icon: ShoppingBag, roles: ['owner', 'manager', 'cashier'] },
    { id: 'expenses', name: 'Pengeluaran', icon: Wallet, roles: ['owner', 'manager', 'cashier'] },
    { id: 'reports', name: 'Laporan', icon: FileSpreadsheet, roles: ['owner', 'manager'] },
    { id: 'dashboard', name: 'Analitik', icon: BarChart3, roles: ['owner', 'manager'] },
  ];

  // Master Menu items (Simple 1-2 words, primary keys/templates configuration)
  const masterMenuItems = [
    { id: 'catalog', name: 'Menu Jual', icon: Coffee, roles: ['owner', 'manager', 'cashier'] },
    { id: 'cashflow', name: 'Cashflow', icon: Coins, roles: ['owner', 'manager'] },
    { id: 'recipe', name: 'Resep BOM', icon: BookOpen, roles: ['owner', 'manager'] },
    { id: 'inventory', name: 'Stok Gudang', icon: Layers, roles: ['owner', 'manager'] },
    { id: 'users', name: 'Data User', icon: User, roles: ['owner'] },
    { id: 'audit', name: 'Audit Log', icon: ShieldAlert, roles: ['owner'] },
    { id: 'settings', name: 'Pengaturan', icon: Settings, roles: ['owner', 'manager'] },
    { id: 'tutorial', name: 'Panduan App', icon: HelpCircle, roles: ['owner', 'manager', 'cashier'] }
  ];

  const filteredMainItems = mainMenuItems.filter(item => item.roles.includes(currentUser.role));
  const filteredMasterItems = masterMenuItems.filter(item => item.roles.includes(currentUser.role));

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-[#E2E8F0] text-[#1E293B]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#123524] flex items-center justify-center font-extrabold text-[#85A947] text-xl shadow-md transition-all hover:scale-105">
          <span>F</span>
        </div>
        <div>
          <h1 className="font-sans font-extrabold text-sm tracking-wider text-[#1E293B] uppercase leading-tight">FIZQO</h1>
          <p className="font-mono text-[9px] text-[#4D7C0F] tracking-wider uppercase font-bold opacity-80">Cafe Operating System</p>
        </div>
      </div>

      {/* Navigation Groups wrapper */}
      <div className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
        {/* Menu Utama (Transactions Group) */}
        {filteredMainItems.length > 0 && (
          <div className="space-y-1.5">
            <p className="px-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-2">MENU UTAMA</p>
            <nav className="space-y-1">
              {filteredMainItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    id={`sidebar-btn-${item.id}`}
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#EBF1ED] text-[#123524] border-l-3 border-[#85A947] shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 transition-colors duration-155 ${isActive ? 'text-[#4D7C0F]' : 'text-slate-400'}`} />
                    <span className="flex-1 text-left truncate">{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Master Menu (Templates Group) */}
        {filteredMasterItems.length > 0 && (
          <div className="space-y-1.5">
            <p className="px-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-2">MASTER MENU</p>
            <nav className="space-y-1">
              {filteredMasterItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    id={`sidebar-btn-${item.id}`}
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#EBF1ED] text-[#123524] border-l-3 border-[#85A947] shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 transition-colors duration-155 ${isActive ? 'text-[#4D7C0F]' : 'text-slate-400'}`} />
                    <span className="flex-1 text-left truncate">{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Active Shift Card - White styled */}
      <div className="p-4 mx-3 mb-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold">PETUGAS AKTIF</p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#123524] flex items-center justify-center font-bold text-xs text-[#85A947] shrink-0">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
            <p className="text-[10px] text-[#4D7C0F] font-mono font-semibold">Aktif Sejak 08:30</p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-2 text-[10px]">
          <span className="text-slate-500 font-mono uppercase text-[9px] font-bold">Role: {currentUser.role}</span>
          <button
            id="role-shift-toggle"
            onClick={onLogout}
            className="text-red-600 hover:text-red-700 font-mono font-extrabold uppercase text-[9px] hover:underline cursor-pointer flex items-center gap-1"
          >
            <LogOut className="h-3 w-3" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-screen font-sans shrink-0 border-r border-slate-200">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          id="mobile-backdrop"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Cabinet */}
      <aside
        id="mobile-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white transition-transform duration-300 transform md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          id="close-mobile-menu"
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"
        >
          <X className="h-6 w-6" />
        </button>
        <SidebarContent />
      </aside>
    </>
  );
}
