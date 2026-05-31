import React, { useState, useEffect } from 'react';
import { 
  Search, Grid, Plus, Minus, Trash2, Printer, 
  CreditCard, DollarSign, Wallet, ClipboardCheck, 
  RotateCcw, AlertTriangle, ChevronRight, ShoppingCart, UserCheck, Pencil
} from 'lucide-react';
import { 
  Product, Category, Order, OrderItem, Payment, 
  PaymentMethod, OrderStatus, RawMaterial, Recipe, AuditLog, CafeSettings
} from '../types';
import { calculateProductHpp } from '../data';

interface POSProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
  recipes: Recipe[];
  rawMaterials: RawMaterial[];
  settings: CafeSettings;
  currentUser: { name: string; role: string };
  onUpdateInventory: (orderItems: OrderItem[]) => void;
  onSaveOrder: (order: Order) => void;
  onSavePayment: (payment: Payment) => void;
  onAddAuditLog: (action: string, module: string, details: string) => void;
  onCreateProduct: (newProduct: Product) => void;
  onModifyProduct: (modProduct: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

export default function POSModule({
  products,
  categories,
  orders,
  recipes,
  rawMaterials,
  settings,
  currentUser,
  onUpdateInventory,
  onSaveOrder,
  onSavePayment,
  onAddAuditLog,
  onCreateProduct,
  onModifyProduct,
  onDeleteProduct
}: POSProps) {
  // POS States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customerName, setCustomerName] = useState('');
  const [tableName, setTableName] = useState('');
  const [serviceType, setServiceType] = useState<'DINE_IN' | 'TAKE_AWAY'>('DINE_IN');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrderCode, setActiveOrderCode] = useState<string>('');
  const [mobileView, setMobileView] = useState<'menu' | 'cart'>('menu');

  // Permission Context
  const canEdit = currentUser.role === 'owner' || currentUser.role === 'manager';

  // Catalog CRUD States
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('25000');
  const [formCatId, setFormCatId] = useState(categories[0]?.id || '');
  const [formAvailable, setFormAvailable] = useState(true);
  const [formImage, setFormImage] = useState('☕');

  const handleOpenAddMenuModal = () => {
    setEditingId(null);
    setFormName('');
    setFormPrice('25000');
    setFormCatId(categories[0]?.id || 'cat_1');
    setFormAvailable(true);
    setFormImage('☕');
    setShowCatalogModal(true);
  };

  const handleOpenEditMenuModal = (p: Product) => {
    setEditingId(p.id);
    setFormName(p.name);
    setFormPrice(p.price.toString());
    setFormCatId(p.categoryId);
    setFormAvailable(p.isAvailable);
    setFormImage(p.image || '☕');
    setShowCatalogModal(true);
  };

  const handleConfirmDeleteProduct = (p: Product) => {
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${p.name}" dari sistem secara permanen?`)) {
      onDeleteProduct(p.id);
      onAddAuditLog('Delete Product', 'POS Catalog', `Permanently deleted product "${p.name}" directly via POS view.`);
    }
  };

  const handleSaveMenuSubmit = (e: React.FormEvent) => {
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
      const updated: Product = {
        id: editingId,
        name: formName.trim(),
        price: priceNum,
        categoryId: formCatId,
        isAvailable: formAvailable,
        image: formImage
      };
      onModifyProduct(updated);
      onAddAuditLog('Edit Product', 'POS Catalog', `Modified menu item "${updated.name}" directly via POS view.`);
    } else {
      const neu: Product = {
        id: `prod_${Date.now()}`,
        name: formName.trim(),
        price: priceNum,
        categoryId: formCatId,
        isAvailable: formAvailable,
        image: formImage
      };
      onCreateProduct(neu);
      onAddAuditLog('Create Product', 'POS Catalog', `Added new product "${neu.name}" with price Rp ${neu.price} directly via POS view.`);
    }

    setShowCatalogModal(false);
  };
  
  // Modals & Popups
  const [showOpenBillAlert, setShowOpenBillAlert] = useState<boolean>(false);
  const [pendingCartMerge, setPendingCartMerge] = useState<{ existingOrder: Order; currentCart: OrderItem[] } | null>(null);
  const [activeOpenBills, setActiveOpenBills] = useState<Order[]>([]);
  
  // Receipt Simulator States
  const [thermalReceipt, setThermalReceipt] = useState<{
    type: 'KITCHEN' | 'BILL' | 'FINAL';
    order: Order;
    payment?: Payment;
    additionsOnly?: boolean; // Kitchen ticket additions
  } | null>(null);

  // Payment Selection
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [cashChange, setCashChange] = useState<number>(0);

  // Filter Active Open Bills (Status === 'OPEN')
  useEffect(() => {
    setActiveOpenBills(orders.filter(o => o.status === 'OPEN'));
  }, [orders]);

  // Generate unique order code
  const generateOrderCode = () => {
    const today = new Date();
    const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `FZQ-${yyyymmdd}-${rand}`;
  };

  // Helper: check raw material availability for product
  const getProductStockStatus = (product: Product) => {
    const recipe = recipes.find(r => r.productId === product.id);
    if (!recipe) return { isAvailable: true, stockEstimate: 999 };

    let minEstimatedStock = 999;
    for (const item of recipe.items) {
      const raw = rawMaterials.find(rm => rm.id === item.rawMaterialId);
      if (!raw) continue;
      const possibleProducts = Math.floor(raw.stock / item.quantity);
      if (possibleProducts < minEstimatedStock) {
        minEstimatedStock = possibleProducts;
      }
    }
    return {
      isAvailable: minEstimatedStock > 0 && product.isAvailable,
      stockEstimate: minEstimatedStock
    };
  };

  // Add Item to Cart
  const handleAddToCart = (product: Product) => {
    const stockCheck = getProductStockStatus(product);
    if (!stockCheck.isAvailable) {
      alert(`⚠️ ${product.name} habis (bahan baku minim).`);
      return;
    }

    setCart(prevCart => {
      const existing = prevCart.find(item => item.productId === product.id);
      if (existing) {
        // Find existing amount
        return prevCart.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: product.price,
          printedQty: 0
        }];
      }
    });
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.productId === productId) {
        const nextQty = item.quantity + delta;
        return nextQty > 0 ? { ...item, quantity: nextQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleUpdateItemNotes = (productId: string, notes: string) => {
    setCart(prevCart => prevCart.map(item => 
      item.productId === productId ? { ...item, notes } : item
    ));
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const subtotal = calculateSubtotal();
  const tax = Math.round(subtotal * settings.taxRate);
  const serviceCharge = Math.round(subtotal * settings.serviceChargeRate);
  const grandTotal = subtotal + tax + serviceCharge;

  // Check Open Bill strategy prior to Saving
  const handleSaveOrderAttempt = (isPayLater: boolean) => {
    if (cart.length === 0) {
      alert("⚠️ Keranjang kosong!");
      return;
    }

    if (!customerName.trim()) {
      alert("⚠️ Harap masukkan Nama Customer terlebih dahulu.");
      return;
    }

    if (serviceType === 'DINE_IN' && !tableName.trim()) {
      alert("⚠️ Harap masukkan Nomor Meja untuk Dine-In.");
      return;
    }

    // Search for existing OPEN bills for the same customer OR same table
    const searchName = customerName.trim().toLowerCase();
    const searchTable = serviceType === 'DINE_IN' ? tableName.trim().toLowerCase() : '';

    const matchOrder = orders.find(o => 
      o.status === 'OPEN' && 
      o.id !== activeOrderId && (
        o.customerName.toLowerCase() === searchName || 
        (o.tableName && o.tableName.toLowerCase() === searchTable && searchTable !== '')
      )
    );

    if (matchOrder) {
      // Prompt modal "Open Bill Ditemukan"
      setPendingCartMerge({
        existingOrder: matchOrder,
        currentCart: [...cart]
      });
      setShowOpenBillAlert(true);
    } else {
      // Direct checkout execution
      executeSaveOrder(isPayLater);
    }
  };

  // Merge Cart or Start New
  const handleMergeOrderSelection = (merge: boolean) => {
    if (!pendingCartMerge) return;
    
    if (merge) {
      // Load and Merge items
      const existing = pendingCartMerge.existingOrder;
      const currentCart = pendingCartMerge.currentCart;

      // Merge currentCart items into existing order items
      const mergedItems = [...existing.items];
      currentCart.forEach(cartItem => {
        const dupIndex = mergedItems.findIndex(i => i.productId === cartItem.productId);
        if (dupIndex > -1) {
          mergedItems[dupIndex].quantity += cartItem.quantity;
        } else {
          mergedItems.push({ ...cartItem });
        }
      });

      // Recalculate
      const newSubtotal = mergedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newTax = Math.round(newSubtotal * settings.taxRate);
      const newService = Math.round(newSubtotal * settings.serviceChargeRate);
      const newTotal = newSubtotal + newTax + newService;

      const updatedOrder: Order = {
        ...existing,
        items: mergedItems,
        subtotal: newSubtotal,
        tax: newTax,
        serviceCharge: newService,
        total: newTotal,
        updatedAt: new Date().toISOString()
      };

      onSaveOrder(updatedOrder);
      onAddAuditLog('Update Open Bill', 'POS', `Merged new items into existing Order ${existing.code}`);
      
      // Update local cart state to represent the complete merged order
      setCart(mergedItems);
      setActiveOrderId(existing.id);
      setActiveOrderCode(existing.code);
      setCustomerName(existing.customerName);
      setTableName(existing.tableName || '');
      setServiceType(existing.serviceType);

      // Show simulator notification
      alert(`✅ Berhasil menggabungkan ke order active: ${existing.code}`);
    } else {
      // Force Create Separate Order
      executeSaveOrder(true);
    }

    setShowOpenBillAlert(false);
    setPendingCartMerge(null);
  };

  // Create or Update final active order state
  const executeSaveOrder = (isPayLater: boolean, orderIdOverride?: string) => {
    const nowStr = new Date().toISOString();
    const cleanId = orderIdOverride || activeOrderId || `ord_${Date.now()}`;
    const cleanCode = activeOrderCode || generateOrderCode();

    const orderObj: Order = {
      id: cleanId,
      code: cleanCode,
      tableName: serviceType === 'DINE_IN' ? tableName : 'Take Away',
      customerName: customerName,
      status: isPayLater ? 'OPEN' : 'PAID',
      items: cart,
      subtotal,
      tax,
      serviceCharge,
      total: grandTotal,
      serviceType,
      createdAt: activeOrderId ? (orders.find(o => o.id === activeOrderId)?.createdAt || nowStr) : nowStr,
      updatedAt: nowStr,
      cashierName: currentUser.name
    };

    onSaveOrder(orderObj);

    if (isPayLater) {
      onAddAuditLog('Save Open Bill', 'POS', `Saved open bill ${cleanCode} for Table: ${orderObj.tableName}`);
      // Show Bill Slip simulator directly
      setThermalReceipt({
        type: 'BILL',
        order: orderObj
      });
      resetPOS();
    } else {
      // Trigger Payment Dialog
      setActiveOrderId(cleanId);
      setActiveOrderCode(cleanCode);
      setShowPaymentModal(true);
    }
  };

  // Pay Now Trigger Setup
  const handleOpenDirectPayment = () => {
    if (cart.length === 0) return;
    if (!customerName || (serviceType === 'DINE_IN' && !tableName)) {
      handleSaveOrderAttempt(false);
      return;
    }
    setPaymentMethod('CASH');
    setCashReceived('');
    setCashChange(0);
    setShowPaymentModal(true);
  };

  // Complete Payment Action
  const handleCompletePayment = () => {
    const finalAmount = grandTotal;
    let numericCash = Number(cashReceived) || finalAmount;

    if (paymentMethod === 'CASH' && numericCash < finalAmount) {
      alert(`⚠️ Pembayaran tunai kurang! Tagihan: Rp ${finalAmount.toLocaleString('id-ID')}`);
      return;
    }

    const oId = activeOrderId || `ord_${Date.now()}`;
    const oCode = activeOrderCode || generateOrderCode();

    const orderObj: Order = {
      id: oId,
      code: oCode,
      tableName: serviceType === 'DINE_IN' ? tableName : 'Take Away',
      customerName: customerName,
      status: 'PAID',
      items: cart,
      subtotal,
      tax,
      serviceCharge,
      total: grandTotal,
      serviceType,
      createdAt: activeOrderId ? (orders.find(o => o.id === activeOrderId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cashierName: currentUser.name
    };

    // 1. Save order first
    onSaveOrder(orderObj);

    // 2. Reduce Inventory materials
    onUpdateInventory(cart);

    // 3. Save Payment Audit Log
    const payObj: Payment = {
      id: `pay_${Date.now()}`,
      orderId: oId,
      orderCode: oCode,
      amount: finalAmount,
      method: paymentMethod,
      paymentTime: new Date().toISOString(),
      cashReceived: paymentMethod === 'CASH' ? numericCash : undefined,
      change: paymentMethod === 'CASH' ? (numericCash - finalAmount) : undefined
    };

    onSavePayment(payObj);
    onAddAuditLog('Process Payment', 'POS', `Payment processed for order ${oCode}. Method: ${paymentMethod}`);

    // Show final transaction receipt
    setThermalReceipt({
      type: 'FINAL',
      order: orderObj,
      payment: payObj
    });

    setShowPaymentModal(false);
    resetPOS();
  };

  // Print Kitchen Ticket (Tracks modifications dynamically)
  const handlePrintKitchenTicket = (bypassCartReset = false) => {
    // Collect order items where quantity is greater than current printed quantity
    const orderToPrint = orders.find(o => o.id === activeOrderId) || {
      id: activeOrderId || 'temp',
      code: activeOrderCode || 'PREVIEW',
      tableName: serviceType === 'DINE_IN' ? tableName : 'Take Away',
      customerName: customerName,
      status: 'OPEN' as OrderStatus,
      items: cart,
      subtotal,
      tax,
      serviceCharge,
      total: grandTotal,
      serviceType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cashierName: currentUser.name
    };

    // Calculate items needing print (newly added items on kitchen queue)
    const additionsOnly = orderToPrint.items.some(item => item.printedQty < item.quantity);

    // Render print thermal preview for Kitchen queue
    setThermalReceipt({
      type: 'KITCHEN',
      order: {
        ...orderToPrint,
        items: cart // Render current state
      },
      additionsOnly: additionsOnly
    });

    // Mark current cart additions as successfully printed
    setCart(prevCart => prevCart.map(item => ({
      ...item,
      printedQty: item.quantity
    })));

    onAddAuditLog('Print Kitchen Ticket', 'POS', `Kitchen queue printed for ${orderToPrint.code}`);
  };

  // Select existing Open Bill to expand or settle
  const handleCheckoutOpenBill = (openBill: Order) => {
    setActiveOrderId(openBill.id);
    setActiveOrderCode(openBill.code);
    setCart(openBill.items);
    setCustomerName(openBill.customerName);
    setTableName(openBill.tableName || '');
    setServiceType(openBill.serviceType);
    onAddAuditLog('Retrieve Open Bill', 'POS', `Retrieved saved order ${openBill.code} onto active POS`);
  };

  // Reset POS states
  const resetPOS = () => {
    setCart([]);
    setCustomerName('');
    setTableName('');
    setServiceType('DINE_IN');
    setActiveOrderId(null);
    setActiveOrderCode('');
  };

  // Keyboard shortcut or cash buttons helper inside modal
  const handleInsertCashValue = (val: number) => {
    setCashReceived(val.toString());
  };

  // Generate dynamic product filter listing
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full w-full flex flex-col overflow-hidden font-sans bg-slate-50/25">
      
      {/* Mobile/Tablet Tab Switcher */}
      <div className="xl:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
        <button
          type="button"
          id="mobile-tab-menu"
          onClick={() => setMobileView('menu')}
          className={`flex-1 py-2.5 rounded-xl text-center text-xs font-black tracking-wide uppercase transition-all flex items-center justify-center gap-2 border cursor-pointer ${
            mobileView === 'menu'
              ? 'bg-[#123524] text-white border-[#123524] shadow-xs'
              : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
          }`}
        >
          <Grid className="h-4 w-4" />
          <span>1. Pilih Menu</span>
        </button>
        <button
          type="button"
          id="mobile-tab-cart"
          onClick={() => setMobileView('cart')}
          className={`flex-1 py-2.5 rounded-xl text-center text-xs font-black tracking-wide uppercase transition-all flex items-center justify-center gap-2 border cursor-pointer relative ${
            mobileView === 'cart'
              ? 'bg-[#123524] text-white border-[#123524] shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:text-slate-850'
          }`}
        >
          <ShoppingCart className="h-4 w-4 text-[#4D7C0F]" />
          <span>2. Keranjang</span>
          {cart.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1.5 bg-red-600 text-white font-black text-[9px] rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row gap-5 p-4 md:p-5 overflow-hidden">
        
        {/* Left pane: Menu Grid & Selector */}
        <div className={`flex-1 flex flex-col space-y-4 overflow-hidden ${mobileView === 'menu' ? 'flex' : 'hidden xl:flex'}`}>
          {/* Active Open Tables / Active Open Bills overview */}
          {activeOpenBills.length > 0 && (
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm shrink-0">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4.5 w-4.5 text-[#4D7C0F]" />
                  <h3 className="text-xs font-bold tracking-wide text-slate-800 uppercase">OPEN BILLS (Meja Aktif)</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-green-50 text-[#4D7C0F] border border-green-200 font-bold">
                  {activeOpenBills.length} Terbuka
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                {activeOpenBills.map((ob) => (
                  <button
                    id={`open-bill-card-${ob.id}`}
                    key={ob.id}
                    onClick={() => handleCheckoutOpenBill(ob)}
                    className="p-3 bg-slate-50 hover:bg-green-50/50 border border-slate-200 hover:border-[#85A947] rounded-lg transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[11px] font-bold font-mono text-slate-800 truncate">{ob.tableName || 'TA'}</span>
                      <span className="text-[9px] px-1.5 py-0.5 font-mono font-bold bg-green-100 text-green-800 rounded uppercase">Open</span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold truncate leading-tight">{ob.customerName}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                      <span>{ob.items.length} items</span>
                      <span className="font-bold text-[#4D7C0F]">Rp{ob.total.toLocaleString('id-ID')}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search bar and Category bar */}
          <div className="flex flex-col md:flex-row gap-3 items-center shrink-0">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="search-menu-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Menu atau Item..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#85A947] focus:ring-1 focus:ring-[#85A947]/30 transition shadow-sm"
              />
            </div>
            
            {/* Category selection horizontal bar */}
            <div className="flex gap-2 overflow-x-auto pb-1 max-w-full flex-1 w-full justify-start items-center">
              <button
                key="all"
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold leading-none whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#123524] text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Semua
              </button>
              {categories.map((cat) => (
                <button
                  id={`cat-filter-${cat.id}`}
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold leading-none whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#123524] text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {canEdit && (
              <button
                id="pos-add-menu-btn"
                onClick={handleOpenAddMenuModal}
                className="shrink-0 w-full md:w-auto px-4 py-2 bg-[#85A947] hover:bg-[#92b852] text-[#0B1812] font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition shadow cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Menu</span>
              </button>
            )}
          </div>

          {/* Products Grid with independent scroll container */}
          <div className="flex-1 overflow-y-auto pr-1 text-slate-700">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-4">
              {filteredProducts.map((p) => {
                const stock = getProductStockStatus(p);
                return (
                  <div
                    key={p.id}
                    className={`bg-white border hover:shadow-md border-slate-200 relative p-4 rounded-xl text-left transition select-none flex flex-col justify-between ${
                      stock.isAvailable 
                        ? 'hover:border-[#85A947]' 
                        : 'border-red-200 opacity-50 bg-slate-50'
                    }`}
                  >
                    {/* Clickable Area for Adding to Cart */}
                    <button
                      id={`product-pos-${p.id}`}
                      disabled={!stock.isAvailable}
                      onClick={() => handleAddToCart(p)}
                      className="absolute inset-0 w-full h-full cursor-pointer rounded-xl bg-transparent border-none focus:outline-none text-left z-0"
                      title={stock.isAvailable ? `Tambah ${p.name}` : `${p.name} Habis`}
                    />

                    {/* UI contents with higher z-index so sub-buttons are clickable */}
                    <div className="relative z-10 pointer-events-none flex flex-col justify-between h-full w-full">
                      <div className="flex items-start justify-between mb-3 w-full">
                        <span className="text-3xl" role="img" aria-label={p.name}>{p.image || '☕'}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase font-bold tracking-wider ${
                          stock.isAvailable 
                            ? (stock.stockEstimate <= 5 ? 'bg-orange-100 text-orange-850 border border-orange-200' : 'bg-green-100 text-green-800') 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {stock.isAvailable ? (stock.stockEstimate <= 5 ? `Sisa ${stock.stockEstimate}` : 'Ready') : 'Habis'}
                        </span>
                      </div>
                      
                      <div className="w-full">
                        <h4 className="font-sans font-extrabold text-xs text-slate-800 leading-snug line-clamp-2 h-8">{p.name}</h4>
                        <div className="flex items-center justify-between mt-1.5 w-full">
                          <p className="font-mono text-xs font-bold text-slate-800">Rp {p.price.toLocaleString('id-ID')}</p>
                          
                          {/* Admin quick edit / delete actions on product */}
                          {canEdit && (
                            <div className="flex items-center gap-1.5 pointer-events-auto">
                              <button
                                id={`edit-pos-prod-${p.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleOpenEditMenuModal(p);
                                }}
                                className="p-1.5 text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
                                title="Ubah Menu"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                id={`delete-pos-prod-${p.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleConfirmDeleteProduct(p);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
                                title="Hapus Menu"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-bold text-xs">
                Menu tidak ditemukan. Silakan tambahkan item baru atau coba penelusuran lain.
              </div>
            )}
          </div>

          {/* Sticky mobile cart summary footer */}
          {cart.length > 0 && (
            <div className="xl:hidden shrink-0 bg-white border border-slate-205 rounded-xl p-3 flex items-center justify-between gap-3 shadow-lg my-1 animate-fade-in z-20">
              <div className="space-y-0.5">
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Total Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} item)</p>
                <p className="font-mono text-xs font-black text-slate-900">Rp {grandTotal.toLocaleString('id-ID')}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileView('cart')}
                className="px-4 py-2 bg-[#123524] text-white hover:bg-[#1C3125] font-extrabold text-[11px] uppercase tracking-wider rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-xs"
              >
                <span>Konfirmasi Pembayaran</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right pane: Active Customer and Cart configuration - Large Legible Redesign */}
        <div className={`w-full xl:w-[410px] bg-white border border-slate-300 rounded-2xl flex flex-col overflow-hidden shrink-0 shadow-lg ${mobileView === 'cart' ? 'flex' : 'hidden xl:flex'} h-full relative`}>
          {/* Header Customer info */}
          <div className="p-4 bg-slate-50 border-b border-slate-300 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-800" />
                <h3 className="font-sans font-black text-xs tracking-wider text-slate-900 uppercase">DAFTAR PESANAN (CART)</h3>
              </div>
              {activeOrderCode && (
                <span className="font-mono text-[10px] bg-slate-100 border border-slate-350 text-slate-900 px-2.5 py-0.5 rounded font-black">Ref: {activeOrderCode}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                id="service-dinein"
                type="button"
                onClick={() => setServiceType('DINE_IN')}
                className={`py-1.5 rounded-lg text-[11px] font-black border transition cursor-pointer ${
                  serviceType === 'DINE_IN'
                    ? 'bg-[#123524] border-[#123524] text-white shadow-xs'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Makan Sini (Dine In)
              </button>
              <button
                id="service-takeaway"
                type="button"
                onClick={() => setServiceType('TAKE_AWAY')}
                className={`py-1.5 rounded-lg text-[11px] font-black border transition cursor-pointer ${
                  serviceType === 'TAKE_AWAY'
                    ? 'bg-[#123524] border-[#123524] text-white shadow-xs'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Bungkus (Take Away)
              </button>
            </div>

            {/* Symmetrical, compact customer metadata card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[9.5px] uppercase tracking-wider text-slate-800 font-extrabold mb-1">Nama Customer *</label>
                <input
                  id="pos-customer-name"
                  type="text"
                  placeholder="Ketik Nama..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-400 rounded-lg text-xs text-slate-950 placeholder-slate-500 font-black focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div>
                {serviceType === 'DINE_IN' ? (
                  <>
                    <label className="block text-[9.5px] uppercase tracking-wider text-slate-800 font-extrabold mb-1">No Meja / Kursi *</label>
                    <input
                      id="pos-table-no"
                      type="text"
                      placeholder="Meja 04..."
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-400 rounded-lg text-xs text-slate-950 placeholder-slate-500 font-black focus:outline-none focus-visible:border-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-600/30 focus-visible:shadow-md transition-all duration-200"
                    />
                  </>
                ) : (
                  <>
                    <label className="block text-[9.5px] uppercase tracking-wider text-slate-800 font-extrabold mb-1">Layanan</label>
                    <div className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-900 font-black tracking-normal select-none truncate">
                      Take Away (Bungkus)
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Cart item listing lists - High Density UX Card spacing */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 min-h-[140px]">
            {cart.map((item) => (
              <div id={`cart-item-${item.productId}`} key={item.productId} className="bg-white border-2 border-slate-250 p-3 shadow-md rounded-xl space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-black text-slate-950 flex-1 leading-snug">{item.productName}</span>
                  <div className="shrink-0 flex items-center bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300 font-mono text-xs text-emerald-950 font-black">
                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                  </div>
                </div>
                
                {/* Notes and Qty options (spacious targets) */}
                <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-200 animate-slide-in">
                  <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 rounded-lg px-2 py-1">
                    <span className="text-[10px] text-slate-800 font-black uppercase tracking-wider scale-95 select-none">Catatan:</span>
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => handleUpdateItemNotes(item.productId, e.target.value)}
                      placeholder="Catatan rasa, es, gula, dll..."
                      className="flex-1 bg-transparent text-[11px] text-slate-950 font-black border-none focus:outline-none placeholder-slate-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] text-slate-800 font-black uppercase tracking-wider">Jumlah Porsi:</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id={`cart-minus-${item.productId}`}
                        onClick={() => handleUpdateCartQty(item.productId, -1)}
                        className="h-8 w-8 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-black rounded-lg flex items-center justify-center transition cursor-pointer select-none"
                      >
                        <Minus className="h-4.5 w-4.5" />
                      </button>
                      
                      <span className="font-mono text-sm font-black text-slate-950 px-2 min-w-[24px] text-center bg-slate-100/70 border border-slate-200 rounded-md py-0.5">{item.quantity}</span>
                      
                      <button
                        type="button"
                        id={`cart-plus-${item.productId}`}
                        onClick={() => handleUpdateCartQty(item.productId, 1)}
                        className="h-8 w-8 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-black rounded-lg flex items-center justify-center transition cursor-pointer select-none"
                      >
                        <Plus className="h-4.5 w-4.5" />
                      </button>
                      
                      <button
                        type="button"
                        id={`cart-del-${item.productId}`}
                        onClick={() => handleRemoveItem(item.productId)}
                        className="h-8 w-8 bg-red-50 hover:bg-red-100 border border-red-300 text-red-650 rounded-lg flex items-center justify-center transition ml-1 cursor-pointer"
                        title="Hapus Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-500 space-y-2.5">
                <ShoppingCart className="h-10 w-10 text-slate-400" />
                <p className="text-xs font-black font-sans text-slate-800">Keranjang Belanja masih kosong</p>
                <p className="text-[10px] px-6 text-slate-500 font-bold">Silakan klik menu makanan/minuman di samping kiri untuk memesan.</p>
              </div>
            )}
          </div>

          {/* Checkout Footer Total */}
          <div className="p-4 border-t border-slate-305 bg-white rounded-b-xl space-y-3 shadow-md shrink-0">
            <div className="space-y-1 text-xs text-slate-900">
              <div className="flex justify-between text-[11.5px] text-slate-800 font-black">
                <span>SUBTOTAL:</span>
                <span className="font-mono font-black text-slate-950">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-800 font-black">
                <span>PAJAK & SERVICE ({settings.taxRate * 100}% + {settings.serviceChargeRate * 100}%):</span>
                <span className="font-mono text-slate-950 font-black">Rp {(tax + serviceCharge).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-emerald-950 bg-emerald-100/75 border-2 border-emerald-300 px-3 py-2.5 rounded-xl font-black text-[13px] mt-1.5 shadow-sm">
                <span>TOTAL HARUS DIBAYAR:</span>
                <span className="font-mono text-sm font-black text-emerald-950">Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Print trigger options if active bill exist */}
            {activeOrderId && (
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <button
                  type="button"
                  id="print-kitchen-active"
                  onClick={() => handlePrintKitchenTicket(true)}
                  className="flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-[10px] font-mono font-bold text-slate-700 transition cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  Kitchen Ticket
                </button>
                <button
                  type="button"
                  id="print-bill-active"
                  onClick={() => setThermalReceipt({ type: 'BILL', order: {
                    id: activeOrderId, code: activeOrderCode, tableName, customerName, status: 'OPEN', items: cart, subtotal, tax, serviceCharge, total: grandTotal, serviceType, createdAt: '', updatedAt: '', cashierName: currentUser.name
                  }})}
                  className="flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-[10px] font-mono font-bold text-slate-700 transition cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  Bill Slip
                </button>
              </div>
            )}

            {/* Dual Transaction Actions: Direct Payment / Open Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                id="btn-checkout-later"
                onClick={() => handleSaveOrderAttempt(true)}
                className="flex items-center justify-center flex-col gap-1 py-2 bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-800 rounded-xl text-xs font-black tracking-wide transition cursor-pointer"
              >
                <DollarSign className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                <span>Simpan (Bayar Nanti)</span>
              </button>
              
              <button
                type="button"
                id="btn-checkout-now"
                onClick={handleOpenDirectPayment}
                className="flex items-center justify-center flex-col gap-1 py-2 bg-[#85A947] hover:bg-[#92b852] text-[#123524] rounded-xl text-xs font-black tracking-wide transition shadow cursor-pointer"
              >
                <CreditCard className="h-4.5 w-4.5 shrink-0" />
                <span>Bayar Sekarang (Cash)</span>
              </button>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                id="btn-pos-reset"
                onClick={resetPOS}
                className="w-full text-center text-[10px] text-red-500 hover:text-red-750 block font-mono font-black hover:underline py-0.5 cursor-pointer"
              >
                BATALKAN / MULAI DARI NOL
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Open Bill Alert 'Duplicate Table or Name found' */}
      {showOpenBillAlert && pendingCartMerge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-md w-full text-slate-800 shadow-2xl">
            <div className="flex items-start gap-3.5 text-amber-600 mb-4 bg-amber-50/70 p-3.5 rounded-xl border border-amber-100">
              <AlertTriangle className="h-6 w-6 mt-0.5 shrink-0 text-amber-500" />
              <div>
                <h3 className="font-sans font-black text-xs uppercase tracking-wide">Open Bill Ditemukan!</h3>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-0.5">Sistem mendeteksi pesanan aktif yang sedang berlangsung pada meja atau nama customer ini.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs mb-6 text-slate-705">
              <div className="flex justify-between text-[#123524] font-mono font-black border-b border-slate-200/60 pb-2 truncate">
                <span>Ref Code Order:</span>
                <span>{pendingCartMerge.existingOrder.code}</span>
              </div>
              <p className="font-medium"><strong>Customer:</strong> {pendingCartMerge.existingOrder.customerName}</p>
              <p className="font-medium"><strong>Meja/Kursi:</strong> {pendingCartMerge.existingOrder.tableName || 'Take Away'}</p>
              <p className="font-medium"><strong>Akumulasi Item:</strong> {pendingCartMerge.existingOrder.items.length} porsi lama + {pendingCartMerge.currentCart.length} porsi baru</p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                id="btn-merge-order"
                onClick={() => handleMergeOrderSelection(true)}
                className="w-full py-2.5 bg-[#123524] hover:bg-[#1C3125] text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-xs"
              >
                Gabung ke Order Lama (Tambah Pesanan)
              </button>
              <button
                id="btn-separate-order"
                onClick={() => handleMergeOrderSelection(false)}
                className="w-full py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer"
              >
                Buat Order Baru Terpisah
              </button>
              <button
                id="btn-cancel-merge"
                onClick={() => { setShowOpenBillAlert(false); setPendingCartMerge(null); }}
                className="w-full text-center py-2 text-xs text-slate-400 hover:text-slate-700 font-bold hover:underline cursor-pointer"
              >
                Kembali ke POS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Payment Process */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-205 p-6 rounded-2xl max-w-lg w-full text-slate-800 space-y-5 shadow-2xl">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-150 pb-3.5">
              <h3 className="font-sans font-black text-xs tracking-wide text-green-800 uppercase">Input Metode Pembayaran</h3>
              <p className="font-mono text-xs font-bold text-slate-500">Total Tagihan: <span className="text-[#123524] font-black text-sm">Rp {grandTotal.toLocaleString('id-ID')}</span></p>
            </div>

            {/* Methods Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {(['CASH', 'QRIS', 'DEBIT', 'GOPAY', 'OVO', 'SHOPEEPAY'] as PaymentMethod[]).map((method) => (
                <button
                  id={`paymethod-${method}`}
                  type="button"
                  key={method}
                  onClick={() => {
                    setPaymentMethod(method);
                    if (method !== 'CASH') setCashReceived(grandTotal.toString());
                  }}
                  className={`py-3.5 rounded-xl border-2 font-black text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    paymentMethod === method
                      ? 'bg-[#123524] border-[#123524] text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="tracking-wide">{method === 'CASH' ? 'CASH/TUNAI' : method}</span>
                </button>
              ))}
            </div>

            {/* CASH Input Fields */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-3.5 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1.5 uppercase font-black tracking-wider">Uang Diterima dari Customer (Rp) *</label>
                  <input
                    id="cash-received-input"
                    type="number"
                    placeholder="Contoh: 100000"
                    value={cashReceived}
                    onChange={(e) => {
                      setCashReceived(e.target.value);
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-lg font-mono font-black text-slate-800 text-right focus:outline-none focus:border-[#85A947] focus:ring-2 focus:ring-[#85A947]/20 transition shadow-xs"
                  />
                </div>

                {/* Cash Quick Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[grandTotal, 20000, 50000, 100000].map((quick) => {
                    const label = quick === grandTotal 
                      ? 'Uang Pas' 
                      : `Rp ${(quick/1000).toLocaleString('id-ID')}k`;
                    return (
                      <button
                        id={`quick-cash-${quick}`}
                        type="button"
                        key={quick}
                        onClick={() => handleInsertCashValue(quick)}
                        className="py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-250 rounded-lg text-[10px] font-black leading-none transition-all cursor-pointer shadow-xs"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Kembalian calculator */}
                {Number(cashReceived) > 0 && (
                  <div className="flex items-center justify-between text-xs pt-3.5 border-t border-slate-200">
                    <span className="text-slate-400 font-extrabold uppercase tracking-wide text-[10px]">Uang Kembalian :</span>
                    <span className="font-mono text-sm text-[#4D7C0F] font-black">
                      Rp {Math.max(0, Number(cashReceived) - grandTotal).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Non-CASH confirm display */}
            {paymentMethod !== 'CASH' && (
              <div className="bg-emerald-50 border border-emerald-100 p-4 text-center rounded-xl">
                <p className="text-[11px] font-semibold text-emerald-800 leading-relaxed">
                  Harap pastikan transfer masuk atau scan barcode QRIS QR / mesin EDC telah berhasil tercatat sebelum menekan tombol konfirmasi.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3.5 pt-1.5">
              <button
                id="btn-close-payment-modal"
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-2.5 bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-700 rounded-xl text-xs font-black tracking-wide transition cursor-pointer"
              >
                Batalkan
              </button>
              <button
                id="btn-complete-payment-action"
                type="button"
                onClick={handleCompletePayment}
                className="w-full py-2.5 bg-[#85A947] hover:bg-[#92b852] text-[#123524] rounded-xl font-black text-xs tracking-wide transition cursor-pointer shadow-md"
              >
                Konfirmasi Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THERMAL SLIP PREVIEW MODAL */}
      {thermalReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-205 p-6 rounded-2xl max-w-sm w-full text-slate-800 flex flex-col my-8 shadow-2xl">
            <div className="text-center border-b border-slate-200 pb-3 mb-4">
              <span className="text-[10px] font-sans uppercase tracking-widest text-slate-400 font-extrabold flex items-center justify-center gap-1.5">
                <Printer className="h-4 w-4 text-[#4D7C0F]" />
                PRINTER THERMAL SIMULATION
              </span>
            </div>

            {/* Simulated Printed Ticket Frame */}
            <div id="thermal-slip-paper" className="bg-[#FAF9F6] text-[#123524] p-5.5 border border-slate-300/60 shadow-inner rounded-xl space-y-4 font-mono select-none text-xs">
              
              {/* Receipt Header (Depends on Type) */}
              <div className="text-center font-bold">
                {thermalReceipt.type === 'FINAL' && (
                  <>
                    <h4 className="text-sm uppercase tracking-tight font-black">{settings.cafeName}</h4>
                    <p className="text-[9px] font-normal leading-tight mt-1 text-slate-600">{settings.address}</p>
                    <p className="text-[10px] font-normal text-slate-600">Tel: {settings.phone}</p>
                    <div className="border-b border-dashed border-[#123524]/20 my-3.5" />
                  </>
                )}

                {thermalReceipt.type === 'BILL' && (
                  <>
                    <h4 className="text-xs uppercase tracking-wider font-extrabold text-amber-900 bg-amber-50 border border-amber-200/60 py-1 rounded">CUSTOMER BILL SLIP</h4>
                    <span className="inline-block px-2 py-0.5 mt-2 rounded text-[9px] font-black bg-amber-200 text-amber-950 uppercase">BELUM LUNAS</span>
                    <div className="border-b border-dashed border-[#123524]/20 my-3.5" />
                  </>
                )}

                {thermalReceipt.type === 'KITCHEN' && (
                  <>
                    <h4 className="text-xs uppercase tracking-widest bg-red-50 border border-red-200 text-red-900 px-2 py-1 rounded font-black">KITCHEN TICKET</h4>
                    {thermalReceipt.additionsOnly && (
                      <p className="text-[9px] font-bold text-red-655 uppercase mt-1">* PESANAN TAMBAHAN BARU *</p>
                    )}
                    <div className="border-b border-dashed border-[#123524]/20 my-3.5" />
                  </>
                )}
              </div>

              {/* Order Metadata Details */}
              <div className="space-y-1 text-[11px] text-[#123524]">
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span className="font-bold">{thermalReceipt.order.code}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nama Meja:</span>
                  <span className="font-bold">{thermalReceipt.order.tableName || 'Take Away'}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-[#123524]/10 pb-2.5">
                  <span>Customer:</span>
                  <span className="font-black uppercase truncate max-w-[140px]">{thermalReceipt.order.customerName}</span>
                </div>
                <div className="flex justify-between pt-1.5 text-[10px] text-[#123524]/70 font-semibold">
                  <span>Kasir: {thermalReceipt.order.cashierName}</span>
                  <span>{new Date(thermalReceipt.order.updatedAt || new Date()).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Items Table List */}
              <div className="space-y-2.5 py-2.5">
                <div className="grid grid-cols-12 font-black text-[11px] border-b border-[#123524]/20 pb-2">
                  <span className="col-span-8">NAMA ITEM</span>
                  <span className="col-span-1 text-center font-bold">QTY</span>
                  {thermalReceipt.type !== 'KITCHEN' && <span className="col-span-3 text-right">TOTAL</span>}
                </div>

                {thermalReceipt.order.items.map((item, id) => {
                  // If Kitchen Ticket check additions only
                  const printQuantity = thermalReceipt.type === 'KITCHEN' && thermalReceipt.additionsOnly
                    ? Math.max(0, item.quantity - item.printedQty)
                    : item.quantity;

                  if (printQuantity === 0 && thermalReceipt.type === 'KITCHEN') return null;

                  return (
                    <div key={item.id || id} className="grid grid-cols-12 text-[11px] leading-snug items-start">
                      <div className="col-span-8 pr-1">
                        <span className="font-bold text-slate-800">{item.productName}</span>
                        {item.notes && <p className="text-[9px] text-slate-500 italic mt-0.5 leading-normal">({item.notes})</p>}
                      </div>
                      <span className="col-span-1 text-center font-bold">x{printQuantity}</span>
                      {thermalReceipt.type !== 'KITCHEN' && (
                        <span className="col-span-3 text-right font-bold text-slate-800">
                          {(item.price * printQuantity).toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Financial Breakdowns (NOT visible on kitchen tickets) */}
              {thermalReceipt.type !== 'KITCHEN' && (
                <div className="border-t border-dashed border-[#123524]/20 pt-2 space-y-1 text-[11px]/tight">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{thermalReceipt.order.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pajak ({(settings.taxRate * 100)}%):</span>
                    <span>{thermalReceipt.order.tax.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service ({(settings.serviceChargeRate * 100)}%):</span>
                    <span>{thermalReceipt.order.serviceCharge.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-[12px] border-t-2 border-double border-[#123524]/20 pt-2 text-[#123524]">
                    <span>TOTAL TAGIHAN:</span>
                    <span className="font-bold">Rp {thermalReceipt.order.total.toLocaleString('id-ID')}</span>
                  </div>

                  {thermalReceipt.type === 'FINAL' && (
                    <div className="pt-2 border-t border-dashed border-[#123524]/20 space-y-1 text-[#123524]/90 text-[10px]">
                      <div className="flex justify-between">
                        <span>Metode Pembayaran:</span>
                        <span className="font-bold">{thermalReceipt.payment?.method}</span>
                      </div>
                      {thermalReceipt.payment?.method === 'CASH' && (
                        <>
                          <div className="flex justify-between">
                            <span>Uang Tunai Diterima:</span>
                            <span>{(thermalReceipt.payment.cashReceived || 0).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between font-bold text-[11px] bg-slate-200/50 p-1.5 rounded mt-1.5">
                            <span>Uang Kembalian:</span>
                            <span>{(thermalReceipt.payment.change || 0).toLocaleString('id-ID')}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Thermal Footnotes and Notices */}
              <div className="border-t border-dashed border-[#123524]/20 pt-3 text-center text-[10px] leading-normal text-[#123524]/85">
                {thermalReceipt.type === 'FINAL' && (
                  <>
                    <p className="font-black text-[11px] mb-1 tracking-widest text-[#123524]">*** LUNAS ***</p>
                    <p className="italic font-semibold text-slate-600">{settings.footerReceipt}</p>
                  </>
                )}

                {thermalReceipt.type === 'BILL' && (
                  <>
                    <p className="font-black text-[11px] mb-1 tracking-wider text-amber-900 bg-amber-100 rounded py-0.5 uppercase">BILL TEMPORER</p>
                    <p className="italic text-slate-500 mt-1 font-semibold">Harap bawa bill temporer ini ke meja kasir untuk penyelesaian pembayaran.</p>
                  </>
                )}

                {thermalReceipt.type === 'KITCHEN' && (
                  <p className="font-black text-[10px] italic bg-[#123524]/5 py-1 rounded">Harap kerjakan pesanan segera. Fizqo Kitchen.</p>
                )}
              </div>
            </div>

            {/* Simulated Action buttons */}
            <div className="mt-5 space-y-2">
              <button
                id="thermal-action-print"
                type="button"
                onClick={() => {
                  alert("🖨️ Mengirim data cetak ke Printer Thermal POS via Bluetooth/USB ESC-POS...");
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#85A947] hover:bg-[#92b852] font-black text-[#123524] rounded-xl text-xs transition cursor-pointer shadow-xs"
              >
                <Printer className="h-4 w-4" />
                Cetak Cetakan Fisik
              </button>
              
              <button
                id="thermal-action-close"
                type="button"
                onClick={() => setThermalReceipt(null)}
                className="w-full text-center py-2.5 bg-white border-2 border-slate-300 text-slate-705 rounded-xl text-xs font-black hover:bg-slate-50 transition cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Catalog Form inside POS view */}
      {showCatalogModal && (
        <div id="pos-catalog-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form onSubmit={handleSaveMenuSubmit} className="bg-white border border-slate-205 p-6 rounded-2xl max-w-sm w-full text-slate-800 space-y-4 shadow-2xl relative">
            <h3 className="font-sans font-black text-xs uppercase tracking-wider text-green-800 border-b border-slate-205 pb-3">
              {editingId ? 'Edit Detail Menu Jual' : 'Tambah Daftar Menu Jual'}
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[9px] text-slate-400 font-extrabold mb-1 uppercase tracking-wider">Nama Menu Kafe *</label>
                <input
                  id="form-pos-cat-name"
                  type="text"
                  placeholder="Contoh: Es Pandan Latte"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#85A947]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] text-slate-400 font-extrabold mb-1 uppercase tracking-wider">Kategori Produk</label>
                  <select
                    id="form-pos-cat-select"
                    value={formCatId}
                    onChange={(e) => setFormCatId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#85A947]"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-slate-400 font-extrabold mb-1 uppercase tracking-wider">Harga Jual (Rp) *</label>
                  <input
                    id="form-pos-cat-price"
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-right font-mono font-black text-slate-800 focus:outline-none focus:border-[#85A947]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] text-slate-400 font-extrabold mb-1 uppercase tracking-wider">Visual Emoji Icon</label>
                  <select
                    id="form-pos-cat-emoji"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#85A947]"
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
                  <label className="block text-[9px] text-slate-400 font-extrabold mb-1 uppercase tracking-wider">Tersedia Dijual</label>
                  <select
                    id="form-pos-cat-avail"
                    value={formAvailable ? 'yes' : 'no'}
                    onChange={(e) => setFormAvailable(e.target.value === 'yes')}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#85A947]"
                  >
                    <option value="yes">Tersedia (Ready)</option>
                    <option value="no">Habis (Kosong)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-3">
              <button
                type="button"
                id="btn-pos-cat-cancel"
                onClick={() => setShowCatalogModal(false)}
                className="w-full py-2 bg-white hover:bg-slate-50 border-2 border-slate-300 text-xs font-black rounded-xl text-slate-700 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                id="btn-pos-cat-save"
                className="w-full py-2 bg-[#85A947] hover:bg-[#92b852] text-[#123524] font-black text-xs rounded-xl shadow cursor-pointer transition-all"
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
