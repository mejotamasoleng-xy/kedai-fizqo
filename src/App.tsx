import React, { useState, useEffect } from 'react';
import { Menu, Coffee, Sparkles, User, LogOut, ChevronRight } from 'lucide-react';
import { 
  User as UserType, Category, Product, RawMaterial, Recipe, 
  Order, Payment, Expense, AuditLog, InventoryMovement, CafeSettings, OrderItem,
  CashflowEntry
} from './types';
import { 
  INITIAL_USERS, CURRENT_USER, OWNER_USER, INITIAL_CATEGORIES, INITIAL_RAW_MATERIALS, 
  INITIAL_PRODUCTS, INITIAL_RECIPES, DEFAULT_SETTINGS, seedMockData 
} from './data';
import Sidebar from './components/Sidebar';
import POSModule from './components/POSModule';
import DashboardModule from './components/DashboardModule';
import InventoryModule from './components/InventoryModule';
import RecipeModule from './components/RecipeModule';
import ExpenseModule from './components/ExpenseModule';
import ReportingModule from './components/ReportingModule';
import AuditLogModule from './components/AuditLogModule';
import SettingsModule from './components/SettingsModule';
import UsersModule from './components/UsersModule';
import MenuCatalogModule from './components/MenuCatalogModule';
import LoginScreen from './components/LoginScreen';
import CashflowModule from './components/CashflowModule';
import TutorialModule from './components/TutorialModule';

export default function App() {
  // Active User / Session State
  const [currentUser, setCurrentUser] = useState<UserType>(CURRENT_USER);
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data Tables from localStorage or Seed Defaults
  const [settings, setSettings] = useState<CafeSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
  
  // Dynamic Ledger State
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [customCashflows, setCustomCashflows] = useState<CashflowEntry[]>([]);

  // Local storage hydration
  useEffect(() => {
    // 0. Hydrate database schema for system user accounts
    const cachedUsers = localStorage.getItem('fizqo_users');
    let loadedUsers: UserType[] = [];
    if (cachedUsers) {
      loadedUsers = JSON.parse(cachedUsers);
    } else {
      loadedUsers = INITIAL_USERS;
      localStorage.setItem('fizqo_users', JSON.stringify(INITIAL_USERS));
    }
    setUsers(loadedUsers);

    // Hydrate custom cashflows
    const cachedCash = localStorage.getItem('fizqo_custom_cashflows');
    if (cachedCash) {
      setCustomCashflows(JSON.parse(cachedCash));
    } else {
      const initialCash: CashflowEntry[] = [
        {
          id: 'cf_init',
          type: 'CASH_IN',
          category: 'CAPITAL',
          amount: 500000,
          notes: 'Modal Awal Kasir Pagi (Laci Kasir)',
          date: new Date().toISOString().slice(0, 10),
          paymentMethod: 'CASH',
          recordedBy: 'Owner Kedai'
        }
      ];
      setCustomCashflows(initialCash);
      localStorage.setItem('fizqo_custom_cashflows', JSON.stringify(initialCash));
    }

    // Default current user to the cached session
    const cachedActiveUser = localStorage.getItem('fizqo_active_session_user');
    if (cachedActiveUser) {
      const parsed = JSON.parse(cachedActiveUser);
      const found = loadedUsers.find(u => u.id === parsed.id);
      if (found && found.active) {
        setCurrentUser(found);
        setIsLoggedIn(true);
      }
    }

    // 1. Settings
    const cachedSettings = localStorage.getItem('fizqo_settings');
    if (cachedSettings) setSettings(JSON.parse(cachedSettings));

    // 2. Categories
    const cachedCategories = localStorage.getItem('fizqo_categories');
    if (cachedCategories) setCategories(JSON.parse(cachedCategories));

    // 3. Products
    const cachedProducts = localStorage.getItem('fizqo_products');
    if (cachedProducts) setProducts(JSON.parse(cachedProducts));

    // 4. Recipes
    const cachedRecipes = localStorage.getItem('fizqo_recipes');
    if (cachedRecipes) setRecipes(JSON.parse(cachedRecipes));

    // 5. Dynamic data checks (Hydrate with seeds if totally empty)
    const cachedRaw = localStorage.getItem('fizqo_raw_materials');
    const cachedMove = localStorage.getItem('fizqo_movements');
    const cachedOrd = localStorage.getItem('fizqo_orders');
    const cachedPay = localStorage.getItem('fizqo_payments');
    const cachedExp = localStorage.getItem('fizqo_expenses');
    const cachedLog = localStorage.getItem('fizqo_logs');

    if (cachedRaw && cachedMove && cachedOrd && cachedPay && cachedExp && cachedLog) {
      setRawMaterials(JSON.parse(cachedRaw));
      setMovements(JSON.parse(cachedMove));
      setOrders(JSON.parse(cachedOrd));
      setPayments(JSON.parse(cachedPay));
      setExpenses(JSON.parse(cachedExp));
      setAuditLogs(JSON.parse(cachedLog));
    } else {
      // Seed initial mock transactions
      const seeded = seedMockData();
      setRawMaterials(seeded.rawMaterials);
      setMovements(seeded.movements);
      setOrders(seeded.orders);
      setPayments(seeded.payments);
      setExpenses(seeded.expenses);
      setAuditLogs(seeded.auditLogs);

      // Persist seeds
      localStorage.setItem('fizqo_raw_materials', JSON.stringify(seeded.rawMaterials));
      localStorage.setItem('fizqo_movements', JSON.stringify(seeded.movements));
      localStorage.setItem('fizqo_orders', JSON.stringify(seeded.orders));
      localStorage.setItem('fizqo_payments', JSON.stringify(seeded.payments));
      localStorage.setItem('fizqo_expenses', JSON.stringify(seeded.expenses));
      localStorage.setItem('fizqo_logs', JSON.stringify(seeded.auditLogs));
    }
  }, []);

  // Handle successful login verification
  const handleLoginSuccess = (userObj: UserType) => {
    setCurrentUser(userObj);
    setIsLoggedIn(true);
    localStorage.setItem('fizqo_active_session_user', JSON.stringify(userObj));
    
    // Default starting tab based on role
    if (userObj.role === 'cashier') {
      setActiveTab('pos');
    }

    handleAddAuditLog('User Login', 'Authentication', `Petugas ${userObj.name} [${userObj.role}] entered session successfully`);
  };

  // Sign out / lock shift
  const handleLogout = () => {
    handleAddAuditLog('User Logout', 'Authentication', `Petugas ${currentUser.name} signed out from session`);
    setIsLoggedIn(false);
    localStorage.removeItem('fizqo_active_session_user');
  };

  // Create account callback
  const handleCreateUser = (newUser: UserType) => {
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('fizqo_users', JSON.stringify(updatedUsers));
  };

  // Toggle user active status callback
  const handleToggleUserStatus = (userId: string) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, active: !u.active } : u);
    setUsers(updatedUsers);
    localStorage.setItem('fizqo_users', JSON.stringify(updatedUsers));
  };

  // Delete user account callback
  const handleDeleteUser = (userId: string) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('fizqo_users', JSON.stringify(updatedUsers));
  };

  // Helper adding logs
  const handleAddAuditLog = (action: string, module: string, details: string) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUser ? currentUser.name : 'System Process',
      action,
      module,
      details
    };
    const nextLogs = [newLog, ...auditLogs];
    setAuditLogs(nextLogs);
    localStorage.setItem('fizqo_logs', JSON.stringify(nextLogs));
  };

  // Updaters (CRUD)
  const handleUpdateSettings = (nextSettings: CafeSettings) => {
    setSettings(nextSettings);
    localStorage.setItem('fizqo_settings', JSON.stringify(nextSettings));
  };

  const handleAddProduct = (newProduct: Product) => {
    const nextProducts = [...products, newProduct];
    setProducts(nextProducts);
    localStorage.setItem('fizqo_products', JSON.stringify(nextProducts));
  };

  const handleModifyProduct = (modProduct: Product) => {
    const nextProducts = products.map(p => p.id === modProduct.id ? modProduct : p);
    setProducts(nextProducts);
    localStorage.setItem('fizqo_products', JSON.stringify(nextProducts));
  };

  const handleDeleteProduct = (productId: string) => {
    const nextProducts = products.filter(p => p.id !== productId);
    setProducts(nextProducts);
    localStorage.setItem('fizqo_products', JSON.stringify(nextProducts));
  };

  const handleResetAllTransactions = () => {
    // 1. Reset dynamic transactional lists
    setOrders([]);
    setPayments([]);
    setExpenses([]);
    setMovements([]);
    
    // Reset raw materials back to default starting level
    const freshRaw = INITIAL_RAW_MATERIALS.map(item => ({ ...item }));
    setRawMaterials(freshRaw);

    // Reset Custom Cashflow list to seed starting capital
    const freshCash: CashflowEntry[] = [
      {
        id: 'cf_init',
        type: 'CASH_IN',
        category: 'CAPITAL',
        amount: 500000,
        notes: 'Modal Awal Kasir Pagi (Laci Kasir)',
        date: new Date().toISOString().slice(0, 10),
        paymentMethod: 'CASH',
        recordedBy: 'Owner Kedai'
      }
    ];
    setCustomCashflows(freshCash);

    const freshLogs = [
      {
        id: `log_reset_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentUser.name,
        action: 'Database Truncated',
        module: 'System Settings',
        details: `Cleaned up dynamic transactional datasets (Orders, Payments, Expenses, Movements, and Cashflows). Default starting stock re-applied. Triggered by ${currentUser.name}`
      }
    ];
    setAuditLogs(freshLogs);

    // 2. Persist to storage
    localStorage.setItem('fizqo_orders', JSON.stringify([]));
    localStorage.setItem('fizqo_payments', JSON.stringify([]));
    localStorage.setItem('fizqo_expenses', JSON.stringify([]));
    localStorage.setItem('fizqo_movements', JSON.stringify([]));
    localStorage.setItem('fizqo_raw_materials', JSON.stringify(freshRaw));
    localStorage.setItem('fizqo_custom_cashflows', JSON.stringify(freshCash));
    localStorage.setItem('fizqo_logs', JSON.stringify(freshLogs));
  };

  const handleAddCustomCashflow = (newEntry: CashflowEntry) => {
    const nextCashflows = [newEntry, ...customCashflows];
    setCustomCashflows(nextCashflows);
    localStorage.setItem('fizqo_custom_cashflows', JSON.stringify(nextCashflows));
  };

  const handleDeleteCustomCashflow = (id: string) => {
    const nextCashflows = customCashflows.filter(c => c.id !== id);
    setCustomCashflows(nextCashflows);
    localStorage.setItem('fizqo_custom_cashflows', JSON.stringify(nextCashflows));
  };

  const handleUpdateProductHppOverride = (productId: string, hppOverride?: number) => {
    const nextProducts = products.map(p => 
      p.id === productId ? { ...p, hppManual: hppOverride } : p
    );
    setProducts(nextProducts);
    localStorage.setItem('fizqo_products', JSON.stringify(nextProducts));
  };

  const handleSaveRecipeBOM = (saveRecipe: Recipe) => {
    // Check if recipe already exists
    const idx = recipes.findIndex(r => r.productId === saveRecipe.productId);
    let nextRecipes = [...recipes];
    if (idx > -1) {
      nextRecipes[idx] = saveRecipe;
    } else {
      nextRecipes.push(saveRecipe);
    }
    setRecipes(nextRecipes);
    localStorage.setItem('fizqo_recipes', JSON.stringify(nextRecipes));
  };

  const handleAddRawMaterial = (newRm: RawMaterial) => {
    const nextRaw = [...rawMaterials, newRm];
    setRawMaterials(nextRaw);
    localStorage.setItem('fizqo_raw_materials', JSON.stringify(nextRaw));
  };

  const handleModifyRawMaterial = (modRm: RawMaterial) => {
    const nextRaw = rawMaterials.map(r => r.id === modRm.id ? modRm : r);
    setRawMaterials(nextRaw);
    localStorage.setItem('fizqo_raw_materials', JSON.stringify(nextRaw));
  };

  const handleAddInventoryMovement = (newMove: InventoryMovement) => {
    const nextMoves = [newMove, ...movements];
    setMovements(nextMoves);
    localStorage.setItem('fizqo_movements', JSON.stringify(nextMoves));
  };

  const handleCompleteStockOpname = (opname: any) => {
    // Stock opname handles materials adjustments directly. This triggers save opnames logging.
    // Audit actions are registered inside the component log processes.
  };

  const handleAddExpense = (newExp: Expense) => {
    const nextExp = [newExp, ...expenses];
    setExpenses(nextExp);
    localStorage.setItem('fizqo_expenses', JSON.stringify(nextExp));
  };

  const handleSaveOrder = (saveOrder: Order) => {
    const idx = orders.findIndex(o => o.id === saveOrder.id);
    let nextOrders = [...orders];
    if (idx > -1) {
      // Overwrite/Update (e.g., Open Bill Checkout or paying)
      nextOrders[idx] = saveOrder;
    } else {
      nextOrders.push(saveOrder);
    }
    setOrders(nextOrders);
    localStorage.setItem('fizqo_orders', JSON.stringify(nextOrders));
  };

  const handleSavePayment = (savePayment: Payment) => {
    const nextPayments = [savePayment, ...payments];
    setPayments(nextPayments);
    localStorage.setItem('fizqo_payments', JSON.stringify(nextPayments));
  };

  // Recipe subtraction engine
  const handleUpdateInventoryFromPaidBill = (cartItems: OrderItem[]) => {
    const updatedRawMaterials = [...rawMaterials];
    const newMovements: InventoryMovement[] = [];

    cartItems.forEach(item => {
      const activeRecipe = recipes.find(rec => rec.productId === item.productId);
      if (activeRecipe) {
        // Compute reduction for this recipe's materials
        activeRecipe.items.forEach(recipeItem => {
          const rawIndex = updatedRawMaterials.findIndex(r => r.id === recipeItem.rawMaterialId);
          if (rawIndex > -1) {
            const raw = updatedRawMaterials[rawIndex];
            const reduction = recipeItem.quantity * item.quantity;
            raw.stock = Math.max(0, raw.stock - reduction);
            
            // Build movement log item
            newMovements.push({
              id: `move_sale_${Date.now()}_${item.id}_${raw.id}`,
              rawMaterialId: raw.id,
              rawMaterialName: raw.name,
              type: 'USAGE',
              quantity: -reduction,
              notes: `Ref: checkout item - ${item.quantity}x ${item.productName}`,
              createdAt: new Date().toISOString(),
              user: currentUser.name
            });
          }
        });
      }
    });

    setRawMaterials(updatedRawMaterials);
    setMovements(prev => [...newMovements, ...prev]);

    localStorage.setItem('fizqo_raw_materials', JSON.stringify(updatedRawMaterials));
    localStorage.setItem('fizqo_movements', JSON.stringify([...newMovements, ...movements]));
  };

  if (!isLoggedIn) {
    return (
      <LoginScreen
        usersList={users}
        onLoginSuccess={handleLoginSuccess}
        cafeName={settings.cafeName}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#F3F5F4] overflow-hidden antialiased text-slate-800">
      
      {/* Sidebar navigation frame */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        cafeName={settings.cafeName}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onLogout={handleLogout}
      />

      {/* Main workspace container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Workspace Header Panel - Light Mode */}
        <header className="h-16 shrink-0 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 z-10 text-slate-800 font-sans shadow-sm">
          <div className="flex items-center gap-4">
            <button
              id="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-slate-500 hover:text-slate-800 pointer-events-auto cursor-pointer"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-sans">
              <span className="font-mono text-[#4D7C0F] font-bold">Fizqo OS</span>
              <ChevronRight className="h-3 w-3 text-slate-300" />
              <span className="font-bold text-slate-800 uppercase tracking-wider">
                {activeTab === 'pos' && 'Point Of Sale (POS)'}
                {activeTab === 'catalog' && 'Katalog Menu Jual'}
                {activeTab === 'cashflow' && 'Manajemen Cashflow'}
                {activeTab === 'dashboard' && 'Dashboard Analitis'}
                {activeTab === 'recipe' && 'BOM & Resep Biaya'}
                {activeTab === 'inventory' && 'Inventory Kafe'}
                {activeTab === 'expenses' && 'Buku Pengeluaran'}
                {activeTab === 'reports' && 'Laporan Penjualan'}
                {activeTab === 'users' && 'Akun & Petugas'}
                {activeTab === 'audit' && 'System Security Logs'}
                {activeTab === 'settings' && 'System Settings'}
                {activeTab === 'tutorial' && 'Panduan Aplikasi & Tutorial'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4.5">
            {/* Quick Lock Out shift action */}
            <button 
              id="role-switch-badge"
              onClick={handleLogout}
              className="cursor-pointer bg-slate-100 hover:bg-red-50 hover:border-red-200 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2 transition text-xs font-mono font-bold"
              title="Click to lock current session"
            >
              <LogOut className="h-3.5 w-3.5 text-red-600" />
              <span className="text-[10px] uppercase tracking-wider text-slate-600 block">
                Logout ({currentUser.name})
              </span>
            </button>
          </div>
        </header>

        {/* Dynamic Inner Module Content Frame */}
        <main className="flex-1 overflow-hidden relative">
          {activeTab === 'pos' && (
            <POSModule
              products={products}
              categories={categories}
              orders={orders}
              recipes={recipes}
              rawMaterials={rawMaterials}
              settings={settings}
              currentUser={currentUser}
              onUpdateInventory={handleUpdateInventoryFromPaidBill}
              onSaveOrder={handleSaveOrder}
              onSavePayment={handleSavePayment}
              onAddAuditLog={handleAddAuditLog}
              onCreateProduct={handleAddProduct}
              onModifyProduct={handleModifyProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'catalog' && (
            <MenuCatalogModule
              products={products}
              categories={categories}
              onCreateProduct={handleAddProduct}
              onModifyProduct={handleModifyProduct}
              currentUser={currentUser}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {activeTab === 'cashflow' && (
            <CashflowModule
              orders={orders}
              payments={payments}
              expenses={expenses}
              customCashflows={customCashflows}
              onAddCustomCashflow={handleAddCustomCashflow}
              onDeleteCustomCashflow={handleDeleteCustomCashflow}
              currentUser={currentUser}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardModule
              orders={orders}
              payments={payments}
              products={products}
              rawMaterials={rawMaterials}
              recipes={recipes}
              expenses={expenses}
            />
          )}

          {activeTab === 'recipe' && (
            <RecipeModule
              products={products}
              rawMaterials={rawMaterials}
              recipes={recipes}
              onSaveRecipe={handleSaveRecipeBOM}
              onUpdateProductHppOverride={handleUpdateProductHppOverride}
              currentUser={currentUser}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryModule
              rawMaterials={rawMaterials}
              movements={movements}
              onAddRawMaterial={handleAddRawMaterial}
              onModifyRawMaterial={handleModifyRawMaterial}
              onAddMovement={handleAddInventoryMovement}
              onRunStockOpname={handleCompleteStockOpname}
              currentUser={currentUser}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpenseModule
              expenses={expenses}
              onAddExpense={handleAddExpense}
              currentUser={currentUser}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {activeTab === 'reports' && (
            <ReportingModule
              orders={orders}
              payments={payments}
              products={products}
              rawMaterials={rawMaterials}
              recipes={recipes}
              expenses={expenses}
            />
          )}

          {activeTab === 'users' && (
            <UsersModule
              usersList={users}
              onCreateUser={handleCreateUser}
              onToggleUserStatus={handleToggleUserStatus}
              onDeleteUser={handleDeleteUser}
              currentUser={currentUser}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogModule
              logs={auditLogs}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsModule
              settings={settings}
              products={products}
              categories={categories}
              onSaveSettings={handleUpdateSettings}
              onModifyProduct={handleModifyProduct}
              onAddProduct={handleAddProduct}
              currentUser={currentUser}
              onAddAuditLog={handleAddAuditLog}
              onResetDatabase={handleResetAllTransactions}
            />
          )}

          {activeTab === 'tutorial' && (
            <TutorialModule
              currentUser={currentUser}
              onAddAuditLog={handleAddAuditLog}
              cafeName={settings.cafeName}
            />
          )}
        </main>
      </div>

    </div>
  );
}
