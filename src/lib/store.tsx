import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import {
  DEMO_PRODUCTS,
  INITIAL_APPOINTMENTS,
  INITIAL_CONNECTORS,
  INITIAL_CONTENT_IDEAS,
  INITIAL_GOALS,
  INITIAL_ROLES,
  INITIAL_SHOP,
  INITIAL_TASKS,
  INITIAL_TEAM_MEMBERS,
  generateAllCustomers,
  generateAllSales,
  generateDailyContentBatch,
} from '../data/demoData';
import { runLlamaBusinessAnalysis } from './llama';
import {
  Appointment,
  AuthUser,
  BusinessInsight,
  CartItem,
  Connector,
  ConnectorId,
  ContentIdea,
  Customer,
  Goal,
  GoalCategory,
  Product,
  Role,
  RolePermissions,
  Sale,
  Shop,
  ShopContextAnswers,
  ShopType,
  Task,
  TaskStatus,
  TeamMember,
} from '../types';

export type NavigationTab =
  | 'analyzer'
  | 'dashboard'
  | 'ai-chat'
  | 'messaging'
  | 'pos'
  | 'inventory'
  | 'customers'
  | 'tasks'
  | 'goals'
  | 'content'
  | 'team'
  | 'appointments'
  | 'chat'
  | 'import'
  | 'landing'
  | 'onboarding';

interface StoreContextType {
  shop: Shop;
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  tasks: Task[];
  roles: Role[];
  insights: BusinessInsight[];
  shopContext: ShopContextAnswers;
  connectors: Connector[];
  contentIdeas: ContentIdea[];
  appointments: Appointment[];
  goals: Goal[];
  teamMembers: TeamMember[];
  currentUser: TeamMember;
  setCurrentUser: (member: TeamMember) => void;
  addTeamMember: (member: Omit<TeamMember, 'id' | 'shop_id' | 'created_at'>) => TeamMember;
  updateTeamMemberPermissions: (id: string, permissions: RolePermissions) => void;
  removeTeamMember: (id: string) => void;
  authUser: AuthUser | null;
  signInWithSocial: (provider: 'google' | 'facebook' | 'apple' | 'email', email?: string, name?: string) => void;
  signOut: () => void;
  isLandingPage: boolean;
  setIsLandingPage: (val: boolean) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  unreadAssistantCount: number;
  clearUnreadAssistantCount: () => void;
  isAnalyzing: boolean;
  isSeeding: boolean;
  chatInitialPrompt?: string;
  setChatInitialPrompt: (prompt?: string) => void;
  seedDemoData: () => Promise<void>;
  runAnalysis: (overrideContext?: ShopContextAnswers) => Promise<BusinessInsight[]>;
  checkoutCart: (
    items: CartItem[],
    customerId: string,
    paymentMethod?: 'mpesa' | 'cash' | 'card'
  ) => { success: boolean; sale?: Sale; error?: string };
  addSale: (productId: string, customerId: string, qty: number) => { success: boolean; saleId?: string; error?: string };
  addProduct: (product: Omit<Product, 'id' | 'shop_id' | 'created_at'>) => void;
  updateProductStock: (productId: string, newStock: number) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'shop_id' | 'total_spent' | 'visit_count' | 'last_purchase_date' | 'tags'>) => Customer;
  addTask: (task: Omit<Task, 'id' | 'shop_id' | 'created_at'>) => Task;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateInsightStatus: (insightId: string, status: BusinessInsight['status']) => void;
  setShop: (shop: Shop) => void;
  changeStoreTemplate: (type: ShopType) => void;
  saveShopContext: (answers: ShopContextAnswers) => void;
  updateConnectorConfig: (connectorId: ConnectorId, config: Partial<Connector['config']>) => void;
  testConnectorHandshake: (connectorId: ConnectorId) => Promise<boolean>;
  addContentIdea: (idea: Omit<ContentIdea, 'id' | 'created_at'>) => void;
  updateContentIdeaStatus: (id: string, status: ContentIdea['status']) => void;
  generateDailyContent: () => void;
  curateContentIdea: (id: string, action: 'select' | 'discard') => void;
  addGoal: (goal: Omit<Goal, 'id' | 'shop_id' | 'created_at'>) => Goal;
  updateGoalProgress: (id: string, delta: number) => void;
  markGoalAchieved: (id: string, note?: string) => void;
  deleteGoal: (id: string) => void;
  addAppointment: (apt: Omit<Appointment, 'id'>) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  importExcelData: (products: Partial<Product>[], sales: Partial<Sale>[]) => void;
  resetToInitial: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Purge legacy v1-v3 keys if found to prevent stale electronics cache
if (typeof window !== 'undefined') {
  try {
    const legacyKeys = ['duka_os_shop_v3', 'anna_shop_v3', 'duka_os_products_v3', 'anna_products_v3', 'duka_os_tasks_v3'];
    for (const k of legacyKeys) {
      if (localStorage.getItem(k)) localStorage.removeItem(k);
    }
  } catch {}
}

const STORAGE_KEYS = {
  SHOP: 'anna_boutique_v4_shop',
  PRODUCTS: 'anna_boutique_v4_products',
  CUSTOMERS: 'anna_boutique_v4_customers',
  SALES: 'anna_boutique_v4_sales',
  TASKS: 'anna_boutique_v4_tasks',
  INSIGHTS: 'anna_boutique_v4_insights',
  ROLES: 'anna_boutique_v4_roles',
  TEAM: 'anna_boutique_v4_team',
  CURRENT_USER: 'anna_boutique_v4_current_user',
  AUTH_USER: 'anna_boutique_v4_auth_user',
  IS_LANDING: 'anna_boutique_v4_is_landing',
  CONTEXT: 'anna_boutique_v4_context',
  CONNECTORS: 'anna_boutique_v4_connectors',
  CONTENT: 'anna_boutique_v4_content',
  GOALS: 'anna_boutique_v4_goals',
  APPOINTMENTS: 'anna_boutique_v4_appointments',
  UNREAD_ASSISTANT: 'anna_boutique_v4_unread_asst',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shop, setShopState] = useState<Shop>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOP);
    return saved ? JSON.parse(saved) : INITIAL_SHOP;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : DEMO_PRODUCTS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : generateAllCustomers();
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    if (saved) return JSON.parse(saved);
    const initialCusts = generateAllCustomers();
    return generateAllSales(initialCusts, DEMO_PRODUCTS);
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [roles] = useState<Role[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLES);
    return saved ? JSON.parse(saved) : INITIAL_ROLES;
  });

  const [insights, setInsights] = useState<BusinessInsight[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INSIGHTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [shopContext, setShopContext] = useState<ShopContextAnswers>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONTEXT);
    return saved ? JSON.parse(saved) : {};
  });

  const [connectors, setConnectors] = useState<Connector[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONNECTORS);
    return saved ? JSON.parse(saved) : INITIAL_CONNECTORS;
  });

  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONTENT);
    return saved ? JSON.parse(saved) : INITIAL_CONTENT_IDEAS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
    return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEAM);
    return saved ? JSON.parse(saved) : INITIAL_TEAM_MEMBERS;
  });

  const [currentUser, setCurrentUserState] = useState<TeamMember>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return saved ? JSON.parse(saved) : INITIAL_TEAM_MEMBERS[0];
  });

  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [isLandingPage, setIsLandingPageState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IS_LANDING);
    return saved ? JSON.parse(saved) : false;
  });

  // User requested: "Anna assistant should show 1 like a red new thing incase ai has some questions for improvement"
  const [unreadAssistantCount, setUnreadAssistantCount] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.UNREAD_ASSISTANT);
    return saved ? JSON.parse(saved) : 1;
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>('analyzer');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>();
  const [, startTransition] = useTransition();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHOP, JSON.stringify(shop));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      localStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(insights));
      localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles));
      localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(teamMembers));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(authUser));
      localStorage.setItem(STORAGE_KEYS.IS_LANDING, JSON.stringify(isLandingPage));
      localStorage.setItem(STORAGE_KEYS.CONTEXT, JSON.stringify(shopContext));
      localStorage.setItem(STORAGE_KEYS.CONNECTORS, JSON.stringify(connectors));
      localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(contentIdeas));
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
      localStorage.setItem(STORAGE_KEYS.UNREAD_ASSISTANT, JSON.stringify(unreadAssistantCount));
    } catch {
      // Ignore quota errors
    }
  }, [
    shop,
    products,
    customers,
    sales,
    tasks,
    insights,
    roles,
    teamMembers,
    currentUser,
    authUser,
    isLandingPage,
    shopContext,
    connectors,
    contentIdeas,
    appointments,
    goals,
    unreadAssistantCount,
  ]);

  const clearUnreadAssistantCount = () => {
    setUnreadAssistantCount(0);
  };

  const seedDemoData = async () => {
    setIsSeeding(true);
    await new Promise((r) => setTimeout(r, 400));
    const freshCusts = generateAllCustomers();
    const freshProds = [...DEMO_PRODUCTS];
    const freshSales = generateAllSales(freshCusts, freshProds);

    startTransition(() => {
      setShopState(INITIAL_SHOP);
      setProducts(freshProds);
      setCustomers(freshCusts);
      setSales(freshSales);
      setTasks(INITIAL_TASKS);
      setInsights([]);
      setShopContext({});
      setConnectors(INITIAL_CONNECTORS);
      setContentIdeas(INITIAL_CONTENT_IDEAS);
      setAppointments(INITIAL_APPOINTMENTS);
      setGoals(INITIAL_GOALS);
      setTeamMembers(INITIAL_TEAM_MEMBERS);
      setCurrentUserState(INITIAL_TEAM_MEMBERS[0]);
      setIsLandingPageState(false);
      setUnreadAssistantCount(1);
      setIsSeeding(false);
    });
  };

  // Change Store Template (Dynamic Industry Architecture)
  const changeStoreTemplate = (type: ShopType) => {
    let name = 'Amani Luxe Fashion & Footwear';
    let suggestedRoles = ['CEO', 'Floor Cashier', 'Boutique Stylist', 'Stock Manager'];
    let customFields = ['size', 'color', 'material'];

    if (type === 'salon_spa') {
      name = 'Glow & Glam Lounge & Aesthetics';
      suggestedRoles = ['CEO', 'Lead Stylist', 'Receptionist', 'Esthetician'];
      customFields = ['duration_minutes', 'stylist_name'];
      setActiveTab('appointments');
    } else if (type === 'supermarket') {
      name = 'Naivas Express Supermarket';
      suggestedRoles = ['CEO', 'Cashier', 'Inventory Clerk', 'Floor Manager'];
      customFields = ['expiry_date', 'batch_no'];
      setActiveTab('pos');
    } else if (type === 'hardware') {
      name = 'Apex Hardware & Building Supplies';
      suggestedRoles = ['CEO', 'Cashier', 'Yard Supervisor', 'Delivery Driver'];
      customFields = ['unit_weight', 'supplier_code'];
      setActiveTab('inventory');
    } else if (type === 'boutique') {
      name = 'Amani Luxe Fashion & Footwear';
      suggestedRoles = ['CEO', 'Floor Cashier', 'Boutique Stylist', 'Stock Manager'];
      customFields = ['size', 'color', 'material'];
      setActiveTab('pos');
    }

    setShopState((prev) => ({
      ...prev,
      type,
      name,
      suggested_roles: suggestedRoles,
      custom_fields_needed: customFields,
    }));
  };

  // Run AI Analysis and auto-generate Action Wall tasks
  const runAnalysis = async (overrideContext?: ShopContextAnswers) => {
    setIsAnalyzing(true);
    const activeCtx = overrideContext || shopContext;
    try {
      const generatedInsights = await runLlamaBusinessAnalysis({
        products,
        customers,
        sales,
        shop_type: shop.type,
        currency: shop.currency,
        shop_context: activeCtx,
      });

      setInsights(generatedInsights);

      const autoTasks: Task[] = [
        {
          id: `task-auto-stock-${Date.now()}`,
          shop_id: shop.id,
          assigned_role: 'Stock Manager',
          title: 'Discount & Relocate 18 Pleated Chiffon Dresses to Front Mannequins',
          description: 'Apply 15% flash sale discount tag (KES 3,825) and style all 18 units of floral maxi dresses on the main boutique window display.',
          status: 'pending',
          ai_suggestion: {
            insight_type: 'dead_stock',
            source: 'Anna OS Intelligence Brief',
            potential_impact_kes: 81000,
          },
          created_at: new Date().toISOString().split('T')[0],
        },
        {
          id: `task-auto-cashier-${Date.now()}`,
          shop_id: shop.id,
          assigned_role: 'Floor Cashier',
          title: 'Broadcast KES 2,500 Win-Back Voucher to 8 At-Risk VIPs',
          description: 'Follow up with Brian Kipchoge, Faith Mwangi, Wanjiku Kamau, and 5 others via WhatsApp Cloud API.',
          status: 'pending',
          ai_suggestion: {
            insight_type: 'vip_churn',
            source: 'Anna OS Intelligence Brief',
            potential_impact_kes: 580000,
          },
          created_at: new Date().toISOString().split('T')[0],
        },
        {
          id: `task-auto-stylist-${Date.now()}`,
          shop_id: shop.id,
          assigned_role: 'Boutique Stylist',
          title: 'Bundle 30 Stiletto Heels + Crossbody Handbags at Checkout Lounge',
          description: 'Pre-package 30 heel & bag accessory combos beside the checkout desk to capture 4x weekend impulse cross-sells.',
          status: 'pending',
          ai_suggestion: {
            insight_type: 'sales_strategy',
            source: 'Anna OS Intelligence Brief',
            potential_impact_kes: 95000,
          },
          created_at: new Date().toISOString().split('T')[0],
        },
      ];

      setTasks((prev) => {
        const existingTitles = new Set(prev.map((t) => t.title));
        const filteredNew = autoTasks.filter((t) => !existingTitles.has(t.title));
        return [...filteredNew, ...prev];
      });

      return generatedInsights;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Multi-item cart checkout
  const checkoutCart = (
    items: CartItem[],
    customerId: string,
    paymentMethod: 'mpesa' | 'cash' | 'card' = 'mpesa'
  ) => {
    if (items.length === 0) return { success: false, error: 'Cart is empty' };
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return { success: false, error: 'Please select a customer' };

    for (const item of items) {
      const prod = products.find((p) => p.id === item.product.id);
      if (!prod || prod.stock_qty < item.qty) {
        return {
          success: false,
          error: `Insufficient stock for "${item.product.name}" (In stock: ${prod?.stock_qty || 0})`,
        };
      }
    }

    const saleDate = new Date().toISOString();
    const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
    const saleItems = items.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      qty: item.qty,
      unit_price: item.product.sell_price,
      subtotal: item.product.sell_price * item.qty,
    }));

    const totalAmount = saleItems.reduce((acc, it) => acc + it.subtotal, 0);
    const totalQty = items.reduce((acc, it) => acc + it.qty, 0);

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      shop_id: shop.id,
      product_id: items[0].product.id,
      customer_id: customer.id,
      qty: totalQty,
      total: totalAmount,
      date: saleDate,
      product_name: items.length === 1 ? items[0].product.name : `${items[0].product.name} + ${items.length - 1} more`,
      customer_name: customer.name,
      items: saleItems,
      payment_method: paymentMethod,
      receipt_no: receiptNo,
    };

    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = items.find((it) => it.product.id === p.id);
        if (!cartItem) return p;
        return {
          ...p,
          stock_qty: Math.max(0, p.stock_qty - cartItem.qty),
        };
      })
    );

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const newTotal = c.total_spent + totalAmount;
        const newVisits = c.visit_count + 1;
        const tags = [...c.tags.filter((t) => t !== 'New')];
        if (newTotal >= 50000 && !tags.includes('VIP')) {
          tags.push('VIP');
        }
        const cleanTags = tags.filter((t) => t !== 'At-Risk');
        if (cleanTags.length === 0) cleanTags.push('Regular');

        return {
          ...c,
          total_spent: newTotal,
          visit_count: newVisits,
          last_purchase_date: saleDate.split('T')[0],
          tags: cleanTags,
        };
      })
    );

    setSales((prev) => [newSale, ...prev]);

    // Auto-sync active goals with sales events
    setGoals((prev) =>
      prev.map((g) => {
        if (g.status !== 'active') return g;
        let delta = 0;
        if (g.category === 'revenue') {
          delta = totalAmount;
        } else if (g.category === 'clearance') {
          const matches = items.some(
            (it) =>
              it.product.name.toLowerCase().includes('dress') ||
              it.product.name.toLowerCase().includes('chiffon') ||
              it.product.name.toLowerCase().includes('boots') ||
              g.title.toLowerCase().includes(it.product.name.toLowerCase())
          );
          if (matches) delta = totalQty;
        } else if (g.category === 'units_sold') {
          delta = totalQty;
        } else if (g.category === 'vip_retention' && customer.tags.includes('VIP')) {
          delta = 1;
        }

        if (delta === 0) return g;
        const newCur = g.current_value + delta;
        const isAchieved = newCur >= g.target_value;
        return {
          ...g,
          current_value: newCur,
          status: isAchieved ? 'achieved' : 'active',
          achieved_at: isAchieved ? 'Just now' : g.achieved_at,
          ai_note: isAchieved
            ? `🎯 Goal Achieved! Automatically verified via POS checkout (${receiptNo}).`
            : g.ai_note,
        };
      })
    );

    return { success: true, sale: newSale };
  };

  const addSale = (productId: string, customerId: string, qty: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return { success: false, error: 'Product not found' };
    const res = checkoutCart([{ product: prod, qty }], customerId, 'mpesa');
    return { success: res.success, saleId: res.sale?.id, error: res.error };
  };

  const addProduct = (data: Omit<Product, 'id' | 'shop_id' | 'created_at'>) => {
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}`,
      shop_id: shop.id,
      created_at: new Date().toISOString().split('T')[0],
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProductStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock_qty: Math.max(0, newStock) } : p))
    );
  };

  const addCustomer = (
    data: Omit<Customer, 'id' | 'shop_id' | 'total_spent' | 'visit_count' | 'last_purchase_date' | 'tags'>
  ): Customer => {
    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      shop_id: shop.id,
      total_spent: 0,
      visit_count: 1,
      last_purchase_date: new Date().toISOString().split('T')[0],
      tags: ['New'],
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  const addTask = (data: Omit<Task, 'id' | 'shop_id' | 'created_at'>): Task => {
    const newTask: Task = {
      ...data,
      id: `task-${Date.now()}`,
      shop_id: shop.id,
      created_at: new Date().toISOString().split('T')[0],
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  };

  const updateInsightStatus = (insightId: string, status: BusinessInsight['status']) => {
    setInsights((prev) => prev.map((ins) => (ins.id === insightId ? { ...ins, status } : ins)));
  };

  const setShop = (newShop: Shop) => {
    setShopState(newShop);
  };

  const saveShopContext = (answers: ShopContextAnswers) => {
    setShopContext((prev) => ({
      ...prev,
      ...answers,
      updated_at: new Date().toISOString(),
    }));
  };

  // Connectors methods
  const updateConnectorConfig = (connectorId: ConnectorId, config: Partial<Connector['config']>) => {
    setConnectors((prev) =>
      prev.map((c) =>
        c.id === connectorId
          ? {
              ...c,
              config: { ...c.config, ...config },
              status: 'connected',
              last_sync: 'Just now',
            }
          : c
      )
    );
  };

  const testConnectorHandshake = async (connectorId: ConnectorId): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 800));
    setConnectors((prev) =>
      prev.map((c) =>
        c.id === connectorId
          ? {
              ...c,
              status: 'connected',
              last_sync: 'Verified just now',
              sync_count: (c.sync_count || 0) + 1,
            }
          : c
      )
    );
    return true;
  };

  // Content Ideas methods
  const addContentIdea = (idea: Omit<ContentIdea, 'id' | 'created_at'>) => {
    const newIdea: ContentIdea = {
      ...idea,
      id: `idea-${Date.now()}`,
      created_at: new Date().toISOString().split('T')[0],
      curation_state: idea.curation_state || 'selected',
    };
    setContentIdeas((prev) => [newIdea, ...prev]);
  };

  const updateContentIdeaStatus = (id: string, status: ContentIdea['status']) => {
    setContentIdeas((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  // User requested: "content area it shoukd be empty then I just click a generate content and it gives me daily options iI elect some , I discard others"
  const generateDailyContent = () => {
    const dailyBatch = generateDailyContentBatch(products);
    // Append or replace new daily batch
    setContentIdeas((prev) => {
      // Keep previously selected or active ideas
      const preserved = prev.filter((p) => p.curation_state === 'selected' || p.status === 'posted');
      return [...dailyBatch, ...preserved];
    });
  };

  const curateContentIdea = (id: string, action: 'select' | 'discard') => {
    setContentIdeas((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (action === 'select') {
          return {
            ...c,
            curation_state: 'selected',
            status: 'approved',
          };
        } else {
          return {
            ...c,
            curation_state: 'discarded',
          };
        }
      })
    );
  };

  // Goals methods
  const addGoal = (goalData: Omit<Goal, 'id' | 'shop_id' | 'created_at'>): Goal => {
    const newGoal: Goal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      shop_id: shop.id,
      created_at: new Date().toISOString().split('T')[0],
      status: goalData.status || 'active',
    };
    setGoals((prev) => [newGoal, ...prev]);
    return newGoal;
  };

  const updateGoalProgress = (id: string, delta: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const newCur = Math.max(0, g.current_value + delta);
        const isAchieved = newCur >= g.target_value;
        return {
          ...g,
          current_value: newCur,
          status: isAchieved ? 'achieved' : g.status,
          achieved_at: isAchieved ? (g.achieved_at || 'Just now') : undefined,
          ai_note: isAchieved
            ? (g.ai_note || '🎯 Target achieved! Working capital successfully unlocked.')
            : g.ai_note,
        };
      })
    );
  };

  const markGoalAchieved = (id: string, note?: string) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              current_value: g.target_value,
              status: 'achieved',
              achieved_at: 'Just now',
              ai_note: note || g.ai_note || '🎉 Target accomplished! Anna OS verified and logged milestone.',
            }
          : g
      )
    );
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  // Appointments methods
  const addAppointment = (apt: Omit<Appointment, 'id'>) => {
    const newApt: Appointment = {
      ...apt,
      id: `apt-${Date.now()}`,
    };
    setAppointments((prev) => [newApt, ...prev]);
  };

  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const importExcelData = (parsedProducts: Partial<Product>[], parsedSales: Partial<Sale>[]) => {
    if (parsedProducts.length > 0) {
      const formatted: Product[] = parsedProducts.map((p, idx) => ({
        id: p.id || `prod-imp-${Date.now()}-${idx}`,
        shop_id: shop.id,
        name: p.name || `Imported Boutique Item ${idx + 1}`,
        sku: p.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        category: p.category || 'Dresses & Gowns',
        buy_price: Number(p.buy_price) || 2500,
        sell_price: Number(p.sell_price) || 4500,
        stock_qty: Number(p.stock_qty) || 10,
        custom_fields: p.custom_fields || { size: 'M', color: 'Midnight Black', material: 'Chiffon' },
        created_at: new Date().toISOString().split('T')[0],
      }));
      setProducts((prev) => [...formatted, ...prev]);
    }

    if (parsedSales.length > 0) {
      const formattedSales: Sale[] = parsedSales.map((s, idx) => ({
        id: s.id || `sale-imp-${Date.now()}-${idx}`,
        shop_id: shop.id,
        product_id: s.product_id || products[0]?.id || 'prod-01',
        customer_id: s.customer_id || customers[0]?.id || 'cust-01',
        qty: Number(s.qty) || 1,
        total: Number(s.total) || 5000,
        date: s.date || new Date().toISOString().split('T')[0],
        product_name: s.product_name || 'Boutique Sale',
        customer_name: s.customer_name || 'Walk-in Client',
        receipt_no: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        payment_method: 'mpesa',
      }));
      setSales((prev) => [...formattedSales, ...prev]);
    }
  };

  const setCurrentUser = (member: TeamMember) => {
    setCurrentUserState(member);
  };

  const addTeamMember = (data: Omit<TeamMember, 'id' | 'shop_id' | 'created_at'>): TeamMember => {
    const newMember: TeamMember = {
      ...data,
      id: `member-${Date.now()}`,
      shop_id: shop.id,
      created_at: new Date().toISOString().split('T')[0],
    };
    setTeamMembers((prev) => [...prev, newMember]);
    return newMember;
  };

  const updateTeamMemberPermissions = (id: string, permissions: RolePermissions) => {
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, permissions };
        if (currentUser.id === id) {
          setCurrentUserState(updated);
        }
        return updated;
      })
    );
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    if (currentUser.id === id) {
      setCurrentUserState(INITIAL_TEAM_MEMBERS[0]);
    }
  };

  const signInWithSocial = (
    provider: 'google' | 'facebook' | 'apple' | 'email',
    customEmail?: string,
    customName?: string
  ) => {
    const defaultName =
      provider === 'google'
        ? 'Chrisandus Odhiambo'
        : provider === 'apple'
        ? 'Chrisandus (Apple ID)'
        : provider === 'facebook'
        ? 'Chrisandus Facebook'
        : 'Store Owner';
    const defaultEmail =
      provider === 'google'
        ? 'chrisandusodhiambo80@gmail.com'
        : `${provider.toLowerCase()}.user@amaniluxe.co.ke`;

    const user: AuthUser = {
      id: `auth-${Date.now()}`,
      name: customName || defaultName,
      email: customEmail || defaultEmail,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
      provider,
      role_name: 'CEO',
    };

    setAuthUser(user);
    setShopState((prev) => ({
      ...prev,
      type: 'boutique',
      name: `${user.name.split(' ')[0]}'s Luxe Boutique & Footwear`,
      owner_id: user.id,
      suggested_roles: ['CEO', 'Floor Cashier', 'Boutique Stylist', 'Stock Manager'],
      custom_fields_needed: ['size', 'color', 'material'],
    }));

    const ceoMember: TeamMember = {
      id: `member-owner-${Date.now()}`,
      shop_id: shop.id,
      name: user.name,
      email: user.email,
      role_name: 'CEO',
      permissions: {
        can_view_analyzer: true,
        can_edit_inventory: true,
        can_record_sales: true,
        can_send_whatsapp: true,
        can_manage_tasks: true,
        can_view_customers: true,
        can_view_content: true,
        can_view_goals: true,
        can_manage_team: true,
      },
      created_at: new Date().toISOString().split('T')[0],
    };

    setTeamMembers((prev) => [ceoMember, ...prev.filter((m) => m.role_name !== 'CEO')]);
    setCurrentUserState(ceoMember);
    setIsLandingPageState(false);
    setActiveTab('onboarding');
  };

  const signOut = () => {
    setAuthUser(null);
    setCurrentUserState(INITIAL_TEAM_MEMBERS[0]);
    setIsLandingPageState(true);
  };

  const setIsLandingPage = (val: boolean) => {
    setIsLandingPageState(val);
  };

  const resetToInitial = () => {
    localStorage.clear();
    setShopState(INITIAL_SHOP);
    setProducts(DEMO_PRODUCTS);
    setCustomers(generateAllCustomers());
    setSales(generateAllSales(generateAllCustomers(), DEMO_PRODUCTS));
    setTasks(INITIAL_TASKS);
    setInsights([]);
    setShopContext({});
    setConnectors(INITIAL_CONNECTORS);
    setContentIdeas(INITIAL_CONTENT_IDEAS);
    setAppointments(INITIAL_APPOINTMENTS);
    setGoals(INITIAL_GOALS);
    setTeamMembers(INITIAL_TEAM_MEMBERS);
    setCurrentUserState(INITIAL_TEAM_MEMBERS[0]);
    setAuthUser(null);
    setIsLandingPageState(false);
    setUnreadAssistantCount(1);
  };

  return (
    <StoreContext.Provider
      value={{
        shop,
        products,
        customers,
        sales,
        tasks,
        roles,
        insights,
        shopContext,
        connectors,
        contentIdeas,
        appointments,
        goals,
        teamMembers,
        currentUser,
        setCurrentUser,
        addTeamMember,
        updateTeamMemberPermissions,
        removeTeamMember,
        authUser,
        signInWithSocial,
        signOut,
        isLandingPage,
        setIsLandingPage,
        activeTab,
        setActiveTab,
        unreadAssistantCount,
        clearUnreadAssistantCount,
        isAnalyzing,
        isSeeding,
        chatInitialPrompt,
        setChatInitialPrompt,
        seedDemoData,
        runAnalysis,
        checkoutCart,
        addSale,
        addProduct,
        updateProductStock,
        addCustomer,
        addTask,
        updateTaskStatus,
        updateInsightStatus,
        setShop,
        changeStoreTemplate,
        saveShopContext,
        updateConnectorConfig,
        testConnectorHandshake,
        addContentIdea,
        updateContentIdeaStatus,
        generateDailyContent,
        curateContentIdea,
        addGoal,
        updateGoalProgress,
        markGoalAchieved,
        deleteGoal,
        addAppointment,
        updateAppointmentStatus,
        importExcelData,
        resetToInitial,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
