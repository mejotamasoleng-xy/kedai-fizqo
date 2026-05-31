export type UserRole = 'owner' | 'manager' | 'cashier';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  active: boolean;
  password?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  hppManual?: number; // Manual override for HPP
  isAvailable: boolean;
  image?: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: string; // 'gr', 'ml', 'pcs', etc.
  stock: number;
  minStock: number;
  averageCost: number; // HPP contribution of this item
}

export interface RecipeItem {
  rawMaterialId: string;
  quantity: number; // Amount needed for one unit of product
}

export interface Recipe {
  productId: string;
  items: RecipeItem[];
}

export type OrderStatus = 'OPEN' | 'PAID' | 'CLOSED';
export type ServiceType = 'DINE_IN' | 'TAKE_AWAY';

export interface OrderItem {
  id: string; // generated at add time
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  notes?: string;
  printedQty: number; // to track addition printing (only print additions)
}

export interface Order {
  id: string;
  code: string; // e.g. FZQ-20260529-001
  tableName?: string; // e.g. "Meja 05" or "Take Away"
  customerName: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  serviceType: ServiceType;
  createdAt: string;
  updatedAt: string;
  cashierName: string;
}

export type PaymentMethod = 'CASH' | 'DEBIT' | 'OVO' | 'GOPAY' | 'SHOPEEPAY' | 'QRIS';

export interface Payment {
  id: string;
  orderId: string;
  orderCode: string;
  amount: number;
  method: PaymentMethod;
  paymentTime: string;
  cashReceived?: number;
  change?: number;
}

export type MovementType = 'PURCHASE' | 'USAGE' | 'ADJUSTMENT' | 'OPNAME';

export interface InventoryMovement {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  type: MovementType;
  quantity: number; // positive for addition, negative for reduction
  notes: string;
  createdAt: string;
  user: string;
}

export interface StockOpname {
  id: string;
  date: string;
  status: 'DRAFT' | 'COMPLETED';
  items: {
    rawMaterialId: string;
    rawMaterialName: string;
    systemStock: number;
    actualStock: number;
    difference: number;
  }[];
  notes: string;
  completedBy: string;
}

export type ExpenseCategory = 
  | 'Raw Material' 
  | 'Salary' 
  | 'Utilities' 
  | 'Rent' 
  | 'Internet' 
  | 'Operational' 
  | 'Others';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  notes: string;
  date: string;
  recordedBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
}

export interface CafeSettings {
  cafeName: string;
  logoText: string;
  logoSubtext: string;
  address: string;
  phone: string;
  footerReceipt: string;
  taxRate: number; // e.g. 0.10 for 10%
  serviceChargeRate: number; // e.g. 0.05 for 5%
}

export type CashflowType = 'CASH_IN' | 'CASH_OUT';
export type CashflowCategory = 'SALES' | 'EXPENSE' | 'CAPITAL' | 'WITHDRAWAL' | 'ADJUSTMENT' | 'OTHERS';

export interface CashflowEntry {
  id: string;
  type: CashflowType;
  category: CashflowCategory;
  amount: number;
  notes: string;
  date: string; // ISO date or yyyy-mm-dd
  paymentMethod?: string; // e.g. CASH, DEBIT, QRIS, etc.
  recordedBy: string;
}
