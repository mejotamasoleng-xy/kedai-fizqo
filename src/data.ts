import { 
  User, Category, Product, RawMaterial, Recipe, 
  Order, Payment, Expense, AuditLog, CafeSettings, InventoryMovement 
} from './types';

// Initial registered database users
export const INITIAL_USERS: User[] = [
  {
    id: 'usr_owner',
    username: 'admin',
    name: 'Admin Owner',
    role: 'owner',
    active: true,
    password: 'amin123'
  },
  {
    id: 'usr_kasir',
    username: 'kasir_fizqo',
    name: 'Ahmad Kasir',
    role: 'cashier',
    active: true,
    password: '123'
  }
];

export const CURRENT_USER: User = INITIAL_USERS[1];

export const OWNER_USER: User = INITIAL_USERS[0];

// Initial Categories
export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Signature Coffee' },
  { id: 'cat_2', name: 'Classic Coffee' },
  { id: 'cat_3', name: 'Non-Coffee Latte' },
  { id: 'cat_4', name: 'Pastry & Bakery' },
  { id: 'cat_5', name: 'Main Course' }
];

// Initial Raw Materials
export const INITIAL_RAW_MATERIALS: RawMaterial[] = [
  { id: 'raw_1', name: 'Premium Espresso Coffee Beans', unit: 'gr', stock: 15000, minStock: 1000, averageCost: 280 }, // 15kg coffee beans
  { id: 'raw_2', name: 'Fresh Full Cream Milk', unit: 'ml', stock: 20000, minStock: 2000, averageCost: 22 },   // 20L liquid milk
  { id: 'raw_3', name: 'Special Aren Liquid Sugar', unit: 'ml', stock: 5000, minStock: 500, averageCost: 15 },    
  { id: 'raw_4', name: 'Sweet Caramel Syrup', unit: 'ml', stock: 2000, minStock: 300, averageCost: 80 },        
  { id: 'raw_5', name: 'Ceremonial Uji Matcha Powder', unit: 'gr', stock: 1000, minStock: 150, averageCost: 650 },   
  { id: 'raw_6', name: 'Pre-baked Butter Croissant', unit: 'pcs', stock: 50, minStock: 10, averageCost: 14000 },    
  { id: 'raw_7', name: 'White Rice portion', unit: 'portion', stock: 100, minStock: 15, averageCost: 2500 },       
  { id: 'raw_8', name: 'Fresh Chicken Egg', unit: 'pcs', stock: 120, minStock: 20, averageCost: 1800 },           
  { id: 'raw_9', name: 'Diced Chicken Breast', unit: 'gr', stock: 5000, minStock: 1000, averageCost: 65 }         
];

// Initial Products
export const INITIAL_PRODUCTS: Product[] = [
  { id: 'prod_1', name: 'Espresso Double Shot', categoryId: 'cat_2', price: 20000, isAvailable: true, image: '☕' },
  { id: 'prod_2', name: 'Hot Americano', categoryId: 'cat_2', price: 24000, isAvailable: true, image: '☕' },
  { id: 'prod_3', name: 'Iced Cafe Latte', categoryId: 'cat_2', price: 30000, isAvailable: true, image: '🥛' },
  { id: 'prod_4', name: 'Signature Es Kopi Susu Fizqo', categoryId: 'cat_1', price: 28000, isAvailable: true, image: '🇸' },
  { id: 'prod_5', name: 'Iced Caramel Macchiato', categoryId: 'cat_1', price: 35000, isAvailable: true, image: '🍯' },
  { id: 'prod_6', name: 'Premium Hot Matcha Latte', categoryId: 'cat_3', price: 32000, isAvailable: true, image: '🍵' },
  { id: 'prod_7', name: 'Golden Croissant Butter', categoryId: 'cat_4', price: 25000, isAvailable: true, image: '🥐' },
  { id: 'prod_8', name: 'Nasi Goreng Spesial Fizqo', categoryId: 'cat_5', price: 38000, isAvailable: true, image: '🍛' }
];

// Initial Recipes (BOM)
export const INITIAL_RECIPES: Recipe[] = [
  {
    productId: 'prod_1',
    items: [
      { rawMaterialId: 'raw_1', quantity: 18 }
    ]
  },
  {
    productId: 'prod_2',
    items: [
      { rawMaterialId: 'raw_1', quantity: 18 }
    ]
  },
  {
    productId: 'prod_3',
    items: [
      { rawMaterialId: 'raw_1', quantity: 18 },
      { rawMaterialId: 'raw_2', quantity: 150 }
    ]
  },
  {
    productId: 'prod_4',
    items: [
      { rawMaterialId: 'raw_1', quantity: 18 },
      { rawMaterialId: 'raw_2', quantity: 120 },
      { rawMaterialId: 'raw_3', quantity: 20 }
    ]
  },
  {
    productId: 'prod_5',
    items: [
      { rawMaterialId: 'raw_1', quantity: 18 },
      { rawMaterialId: 'raw_2', quantity: 150 },
      { rawMaterialId: 'raw_4', quantity: 15 }
    ]
  },
  {
    productId: 'prod_6',
    items: [
      { rawMaterialId: 'raw_5', quantity: 10 },
      { rawMaterialId: 'raw_2', quantity: 150 }
    ]
  },
  {
    productId: 'prod_7',
    items: [
      { rawMaterialId: 'raw_6', quantity: 1 }
    ]
  },
  {
    productId: 'prod_8',
    items: [
      { rawMaterialId: 'raw_7', quantity: 1 },
      { rawMaterialId: 'raw_8', quantity: 1 },
      { rawMaterialId: 'raw_9', quantity: 60 }
    ]
  }
];

// Default Cafe Settings
export const DEFAULT_SETTINGS: CafeSettings = {
  cafeName: 'Kedai Fizqo Cafe & Eatery',
  logoText: 'FIZQO',
  logoSubtext: 'FINEST BREW & KITCHEN',
  address: 'Jl. Rungkut Madya No. 99, Surabaya, Jawa Timur 60293',
  phone: '0812-3456-7890',
  footerReceipt: 'Terima Kasih Atas Kunjungan Anda! Sampaikan kritik dan saran di IG @kedaifizqo',
  taxRate: 0.10,
  serviceChargeRate: 0.05
};

// Calculate HPP based on recipe and averageCosts
export function calculateProductHpp(productId: string, recipes: Recipe[], rawMaterials: RawMaterial[], products: Product[]): number {
  const product = products.find(p => p.id === productId);
  if (product && product.hppManual !== undefined) {
    return product.hppManual;
  }
  
  const recipe = recipes.find(r => r.productId === productId);
  if (!recipe) return 0;

  return recipe.items.reduce((sum, item) => {
    const raw = rawMaterials.find(rm => rm.id === item.rawMaterialId);
    if (!raw) return sum;
    return sum + (item.quantity * raw.averageCost);
  }, 0);
}

// Generate seeded dummy data for realistic reports and dashboards - cleaned for real startup
export const seedMockData = () => {
  return {
    orders: [],
    payments: [],
    expenses: [],
    auditLogs: [
      {
        id: 'log_init',
        timestamp: new Date().toISOString(),
        user: 'System Process',
        action: 'Database Initialized',
        module: 'System Settings',
        details: 'Fizqo Cafe Database clean installation initialized successfully with Owner admin'
      }
    ],
    rawMaterials: INITIAL_RAW_MATERIALS.map(item => ({ ...item })),
    movements: []
  };
};
