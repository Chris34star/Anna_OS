import {
  Appointment,
  Connector,
  ContentIdea,
  Customer,
  CustomerTag,
  Goal,
  Product,
  Role,
  Sale,
  Shop,
  Task,
  TeamMember,
} from '../types';

export const INITIAL_SHOP: Shop = {
  id: 'shop-nbo-001',
  name: 'Amani Luxe Boutique & Footwear',
  type: 'boutique',
  owner_id: 'usr_brian_ceo',
  created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  staff_count: 4,
  currency: 'KES',
  custom_fields_needed: ['size', 'color', 'material'],
  suggested_roles: ['CEO', 'Floor Cashier', 'Boutique Stylist', 'Stock Manager'],
  template_title: 'Fashion Boutique & Footwear Lounge',
};

export const INITIAL_ROLES: Role[] = [
  {
    id: 'role-ceo',
    shop_id: 'shop-nbo-001',
    name: 'CEO',
    email: 'brian.ceo@amaniluxe.co.ke',
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
  },
  {
    id: 'role-cashier',
    shop_id: 'shop-nbo-001',
    name: 'Floor Cashier',
    email: 'jane.cashier@amaniluxe.co.ke',
    permissions: {
      can_view_analyzer: false,
      can_edit_inventory: false,
      can_record_sales: true,
      can_send_whatsapp: true,
      can_manage_tasks: true,
      can_view_customers: true,
      can_view_content: false,
      can_view_goals: false,
      can_manage_team: false,
    },
  },
  {
    id: 'role-stylist',
    shop_id: 'shop-nbo-001',
    name: 'Boutique Stylist',
    email: 'mercy.stylist@amaniluxe.co.ke',
    permissions: {
      can_view_analyzer: false,
      can_edit_inventory: false,
      can_record_sales: true,
      can_send_whatsapp: true,
      can_manage_tasks: true,
      can_view_customers: true,
      can_view_content: true,
      can_view_goals: false,
      can_manage_team: false,
    },
  },
  {
    id: 'role-stock',
    shop_id: 'shop-nbo-001',
    name: 'Stock Manager',
    email: 'kevin.stock@amaniluxe.co.ke',
    permissions: {
      can_view_analyzer: true,
      can_edit_inventory: true,
      can_record_sales: false,
      can_send_whatsapp: false,
      can_manage_tasks: true,
      can_view_customers: false,
      can_view_content: false,
      can_view_goals: true,
      can_manage_team: false,
    },
  },
];

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'member-01',
    shop_id: 'shop-nbo-001',
    name: 'Brian Omondi',
    email: 'brian.ceo@amaniluxe.co.ke',
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
    created_at: '2026-01-15',
  },
  {
    id: 'member-02',
    shop_id: 'shop-nbo-001',
    name: 'Jane Atieno',
    email: 'jane.cashier@amaniluxe.co.ke',
    role_name: 'Floor Cashier',
    permissions: {
      can_view_analyzer: false,
      can_edit_inventory: false,
      can_record_sales: true,
      can_send_whatsapp: true,
      can_manage_tasks: true,
      can_view_customers: true,
      can_view_content: false,
      can_view_goals: false,
      can_manage_team: false,
    },
    created_at: '2026-02-01',
  },
  {
    id: 'member-03',
    shop_id: 'shop-nbo-001',
    name: 'Mercy Wanjiru',
    email: 'mercy.stylist@amaniluxe.co.ke',
    role_name: 'Boutique Stylist',
    permissions: {
      can_view_analyzer: false,
      can_edit_inventory: false,
      can_record_sales: true,
      can_send_whatsapp: true,
      can_manage_tasks: true,
      can_view_customers: true,
      can_view_content: true,
      can_view_goals: false,
      can_manage_team: false,
    },
    created_at: '2026-02-10',
  },
  {
    id: 'member-04',
    shop_id: 'shop-nbo-001',
    name: 'Kevin Kiprop',
    email: 'kevin.stock@amaniluxe.co.ke',
    role_name: 'Stock Manager',
    permissions: {
      can_view_analyzer: true,
      can_edit_inventory: true,
      can_record_sales: false,
      can_send_whatsapp: false,
      can_manage_tasks: true,
      can_view_customers: false,
      can_view_content: false,
      can_view_goals: true,
      can_manage_team: false,
    },
    created_at: '2026-02-15',
  },
];

// Helper to create dates relative to now
const daysAgo = (days: number): string => {
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().split('T')[0];
};

export const DEMO_PRODUCTS: Product[] = [
  // Dead stock items: 18 Pleated Chiffon Summer Maxi Dresses worth KES 81,000 (sell price KES 4,500 * 18)
  {
    id: 'prod-dead-01',
    shop_id: 'shop-nbo-001',
    name: 'Pleated Chiffon Floral Maxi Dress',
    sku: 'DRS-PLEAT-FLR',
    category: 'Dresses & Gowns',
    buy_price: 2800,
    sell_price: 4500,
    stock_qty: 18,
    custom_fields: { size: 'M / L', color: 'Blush Floral', material: 'Chiffon Blend', supplier: 'Istanbul Direct' },
    created_at: daysAgo(85),
  },
  // Dead stock footwear: 15 Chunky Lug-Sole Chelsea Boots (sell price KES 6,000 * 15 = KES 90,000)
  {
    id: 'prod-dead-02',
    shop_id: 'shop-nbo-001',
    name: 'Chunky Lug-Sole Chelsea Leather Boots',
    sku: 'BOT-LUG-BLK',
    category: 'Footwear & Boots',
    buy_price: 3600,
    sell_price: 6000,
    stock_qty: 15,
    custom_fields: { size: 'EU 38 / 39 / 40', color: 'Midnight Black', material: 'Full Grain Leather', supplier: 'Nairobi Leather Crafters' },
    created_at: daysAgo(75),
  },
  // Fast movers & designer dresses
  {
    id: 'prod-03',
    shop_id: 'shop-nbo-001',
    name: 'Zara Style Tailored Double-Breasted Blazer Dress',
    sku: 'DRS-BLZR-WHT',
    category: 'Dresses & Gowns',
    buy_price: 4200,
    sell_price: 6800,
    stock_qty: 8,
    custom_fields: { size: 'S / M / L', color: 'Ivory White', material: 'Structured Crepe' },
    created_at: daysAgo(60),
  },
  {
    id: 'prod-04',
    shop_id: 'shop-nbo-001',
    name: 'Emerald Green Satin Cowl-Neck Slip Gown',
    sku: 'DRS-SATN-EMR',
    category: 'Dresses & Gowns',
    buy_price: 3500,
    sell_price: 5800,
    stock_qty: 10,
    custom_fields: { size: 'M / L', color: 'Emerald Green', material: 'Mulberry Satin' },
    created_at: daysAgo(50),
  },
  {
    id: 'prod-05',
    shop_id: 'shop-nbo-001',
    name: 'Ribbed Knit Bodycon Midi Party Dress',
    sku: 'DRS-KNT-CAR',
    category: 'Dresses & Gowns',
    buy_price: 2400,
    sell_price: 3900,
    stock_qty: 14,
    custom_fields: { size: 'Free Size', color: 'Carmel Tan', material: 'Stretch Ribbed Cotton' },
    created_at: daysAgo(40),
  },
  {
    id: 'prod-06',
    shop_id: 'shop-nbo-001',
    name: 'Linen Tiered Resort Button-Down Shirt Dress',
    sku: 'DRS-LIN-SAGE',
    category: 'Dresses & Gowns',
    buy_price: 2600,
    sell_price: 4200,
    stock_qty: 9,
    custom_fields: { size: 'S / M / L', color: 'Sage Green', material: '100% Breathable Linen' },
    created_at: daysAgo(35),
  },
  {
    id: 'prod-07',
    shop_id: 'shop-nbo-001',
    name: 'Velvet Midnight Black Wrap Cocktail Dress',
    sku: 'DRS-VEL-BLK',
    category: 'Dresses & Gowns',
    buy_price: 4800,
    sell_price: 7500,
    stock_qty: 6,
    custom_fields: { size: 'M / L / XL', color: 'Midnight Black', material: 'Plush Velvet' },
    created_at: daysAgo(30),
  },
  // Footwear & Shoes
  {
    id: 'prod-08',
    shop_id: 'shop-nbo-001',
    name: 'Strappy Metallic Gold Stiletto Party Heels',
    sku: 'SHS-STIL-GLD',
    category: 'Footwear & Boots',
    buy_price: 3000,
    sell_price: 4800,
    stock_qty: 12,
    custom_fields: { size: 'EU 37 / 38 / 39 / 40', color: 'Champagne Gold', material: 'Metallic Vegan Leather' },
    created_at: daysAgo(45),
  },
  {
    id: 'prod-09',
    shop_id: 'shop-nbo-001',
    name: 'Nike Air Force 1 \'07 Triple White Sneakers',
    sku: 'SHS-AF1-WHT',
    category: 'Footwear & Boots',
    buy_price: 5800,
    sell_price: 8500,
    stock_qty: 11,
    custom_fields: { size: 'EU 38 / 39 / 40 / 41 / 42', color: 'Triple White', material: 'Smooth Leather' },
    created_at: daysAgo(25),
  },
  {
    id: 'prod-10',
    shop_id: 'shop-nbo-001',
    name: 'Suede Block-Heel Mules with Gold Buckle',
    sku: 'SHS-MULE-CAM',
    category: 'Footwear & Boots',
    buy_price: 2700,
    sell_price: 4200,
    stock_qty: 14,
    custom_fields: { size: 'EU 37 / 38 / 39', color: 'Camel Brown', material: 'Vegan Suede' },
    created_at: daysAgo(35),
  },
  {
    id: 'prod-11',
    shop_id: 'shop-nbo-001',
    name: 'Italian Leather Tassel Penny Loafers',
    sku: 'SHS-LOAF-BUR',
    category: 'Footwear & Boots',
    buy_price: 4500,
    sell_price: 6900,
    stock_qty: 7,
    custom_fields: { size: 'EU 39 / 40 / 41 / 42', color: 'Burgundy Oxblood', material: 'Polished Leather' },
    created_at: daysAgo(40),
  },
  {
    id: 'prod-12',
    shop_id: 'shop-nbo-001',
    name: 'Pointed-Toe Patent Leather Kitten Pumps',
    sku: 'SHS-PUMP-NUDE',
    category: 'Footwear & Boots',
    buy_price: 2900,
    sell_price: 4600,
    stock_qty: 10,
    custom_fields: { size: 'EU 38 / 39 / 40', color: 'Soft Nude Blush', material: 'Patent Gloss' },
    created_at: daysAgo(50),
  },
  // Denim & Outerwear
  {
    id: 'prod-13',
    shop_id: 'shop-nbo-001',
    name: 'Turkish High-Waist Wide-Leg Denim Jeans',
    sku: 'DNM-WIDE-IND',
    category: 'Denim & Outerwear',
    buy_price: 2300,
    sell_price: 3800,
    stock_qty: 18,
    custom_fields: { size: 'Waist 26 / 28 / 30 / 32 / 34', color: 'Vintage Indigo', material: '100% Turkish Rigid Denim' },
    created_at: daysAgo(60),
  },
  {
    id: 'prod-14',
    shop_id: 'shop-nbo-001',
    name: 'Classic Double-Breasted Wool Blend Trench Coat',
    sku: 'OUT-TRNCH-CAM',
    category: 'Denim & Outerwear',
    buy_price: 6200,
    sell_price: 9500,
    stock_qty: 6,
    custom_fields: { size: 'S / M / L', color: 'Warm Camel', material: 'Water-Repellent Wool Blend' },
    created_at: daysAgo(70),
  },
  {
    id: 'prod-15',
    shop_id: 'shop-nbo-001',
    name: 'Cropped Distressed Biker Leather Jacket',
    sku: 'OUT-BIKER-BLK',
    category: 'Denim & Outerwear',
    buy_price: 5500,
    sell_price: 8900,
    stock_qty: 5,
    custom_fields: { size: 'S / M / L', color: 'Matte Black', material: 'Washed Lambskin Look' },
    created_at: daysAgo(45),
  },
  {
    id: 'prod-16',
    shop_id: 'shop-nbo-001',
    name: 'Chunky Knit Oversized Button Cardigan',
    sku: 'OUT-KNT-CREAM',
    category: 'Denim & Outerwear',
    buy_price: 2200,
    sell_price: 3500,
    stock_qty: 15,
    custom_fields: { size: 'Free Size', color: 'Oatmeal Cream', material: 'Warm Mohair Blend' },
    created_at: daysAgo(20),
  },
  {
    id: 'prod-17',
    shop_id: 'shop-nbo-001',
    name: 'High-Waist Skinny Sculpt Stretch Jeans',
    sku: 'DNM-SCPT-BLK',
    category: 'Denim & Outerwear',
    buy_price: 2100,
    sell_price: 3400,
    stock_qty: 16,
    custom_fields: { size: 'Waist 26-36', color: 'Jet Black', material: '4-Way Stretch Spandex Denim' },
    created_at: daysAgo(55),
  },
  // Handbags & Totes (High Margin Bundle Products)
  {
    id: 'prod-18',
    shop_id: 'shop-nbo-001',
    name: 'Italian Quilted Leather Crossbody Chain Bag',
    sku: 'BAG-QLT-BLK',
    category: 'Handbags & Totes',
    buy_price: 3200,
    sell_price: 5200,
    stock_qty: 14,
    custom_fields: { color: 'Caviar Black / Gold Hardware', material: 'Quilted Lambskin Style' },
    created_at: daysAgo(40),
  },
  {
    id: 'prod-19',
    shop_id: 'shop-nbo-001',
    name: 'Structured Executive Laptop & Work Tote Bag',
    sku: 'BAG-TOTE-BRN',
    category: 'Handbags & Totes',
    buy_price: 4900,
    sell_price: 7800,
    stock_qty: 8,
    custom_fields: { color: 'Cognac Brown', material: 'Full Grain Saffiano' },
    created_at: daysAgo(35),
  },
  {
    id: 'prod-20',
    shop_id: 'shop-nbo-001',
    name: 'Metallic Hard-Shell Box Evening Clutch',
    sku: 'BAG-CLT-GLD',
    category: 'Handbags & Totes',
    buy_price: 1800,
    sell_price: 3200,
    stock_qty: 15,
    custom_fields: { color: 'Rose Gold & Silver', material: 'Hammered Metal Finish' },
    created_at: daysAgo(20),
  },
  {
    id: 'prod-21',
    shop_id: 'shop-nbo-001',
    name: 'Woven Bohemian Raffia Summer Beach Tote',
    sku: 'BAG-RAFF-NAT',
    category: 'Handbags & Totes',
    buy_price: 1600,
    sell_price: 2800,
    stock_qty: 12,
    custom_fields: { color: 'Natural Tan', material: 'Handwoven Raffia Palm' },
    created_at: daysAgo(30),
  },
  // Accessories & Jewelry (High frequency add-ons)
  {
    id: 'prod-22',
    shop_id: 'shop-nbo-001',
    name: 'Chunky 18K Gold-Plated Layered Chain Necklace',
    sku: 'ACC-CHN-GLD',
    category: 'Accessories & Jewelry',
    buy_price: 850,
    sell_price: 1800,
    stock_qty: 35,
    custom_fields: { material: 'Stainless Steel / 18k PVD Gold', color: 'Yellow Gold' },
    created_at: daysAgo(15),
  },
  {
    id: 'prod-23',
    shop_id: 'shop-nbo-001',
    name: '100% Pure Mulberry Silk Designer Headscarf',
    sku: 'ACC-SRF-SLK',
    category: 'Accessories & Jewelry',
    buy_price: 1100,
    sell_price: 2400,
    stock_qty: 25,
    custom_fields: { size: '90cm x 90cm', material: 'Pure Silk Twill', color: 'Vintage Baroque Motif' },
    created_at: daysAgo(25),
  },
  {
    id: 'prod-24',
    shop_id: 'shop-nbo-001',
    name: 'Oversized Retro Tortoiseshell Sunglasses',
    sku: 'ACC-SUN-TORT',
    category: 'Accessories & Jewelry',
    buy_price: 900,
    sell_price: 1900,
    stock_qty: 28,
    custom_fields: { protection: 'UV400 Polarized', color: 'Amber Tortoise' },
    created_at: daysAgo(10),
  },
  {
    id: 'prod-25',
    shop_id: 'shop-nbo-001',
    name: 'Reversible Italian Leather Gold Buckle Waist Belt',
    sku: 'ACC-BLT-REV',
    category: 'Accessories & Jewelry',
    buy_price: 1200,
    sell_price: 2500,
    stock_qty: 20,
    custom_fields: { size: 'Adjustable 28-38', color: 'Black & Camel Reversible' },
    created_at: daysAgo(18),
  },
  // Additional Apparel items to reach 50 catalog items
  {
    id: 'prod-26',
    shop_id: 'shop-nbo-001',
    name: 'Satin Tie-Front Balloon Sleeve Blouse',
    sku: 'TOP-BLS-IVR',
    category: 'Dresses & Gowns',
    buy_price: 1800,
    sell_price: 3200,
    stock_qty: 12,
    custom_fields: { size: 'S / M / L', color: 'Ivory Cream', material: 'Polyester Satin' },
    created_at: daysAgo(14),
  },
  {
    id: 'prod-27',
    shop_id: 'shop-nbo-001',
    name: 'High-Waist Pleated Formal Palazzo Trousers',
    sku: 'BTM-PLZ-BLK',
    category: 'Denim & Outerwear',
    buy_price: 2200,
    sell_price: 3600,
    stock_qty: 14,
    custom_fields: { size: 'S / M / L / XL', color: 'Jet Black', material: 'Crepe Poly' },
    created_at: daysAgo(22),
  },
  {
    id: 'prod-28',
    shop_id: 'shop-nbo-001',
    name: 'New Balance 550 Retro White/Green Sneakers',
    sku: 'SHS-NB550-GRN',
    category: 'Footwear & Boots',
    buy_price: 6200,
    sell_price: 8900,
    stock_qty: 7,
    custom_fields: { size: 'EU 38-43', color: 'White / Forest Green', material: 'Leather & Mesh' },
    created_at: daysAgo(12),
  },
  {
    id: 'prod-29',
    shop_id: 'shop-nbo-001',
    name: 'Chunky Freshwater Pearl Drop Earrings',
    sku: 'ACC-EAR-PRL',
    category: 'Accessories & Jewelry',
    buy_price: 650,
    sell_price: 1500,
    stock_qty: 30,
    custom_fields: { material: 'Baroque Pearl & 14k Gold Hook' },
    created_at: daysAgo(8),
  },
  {
    id: 'prod-30',
    shop_id: 'shop-nbo-001',
    name: 'Boutique Velvet Scrunchie & Clip Gift Set',
    sku: 'ACC-SET-VLV',
    category: 'Accessories & Jewelry',
    buy_price: 400,
    sell_price: 950,
    stock_qty: 40,
    custom_fields: { items: '3x velvet scrunchies + 2x claw clips' },
    created_at: daysAgo(5),
  },
];

export const VIP_AT_RISK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-vip-01',
    shop_id: 'shop-nbo-001',
    name: 'Brian Kipchoge',
    phone: '+254 712 458 921',
    total_spent: 86500,
    last_purchase_date: daysAgo(36),
    visit_count: 6,
    tags: ['VIP', 'At-Risk'],
    preferred_services: ['Designer Sneakers', 'Trench Coats'],
  },
  {
    id: 'cust-vip-02',
    shop_id: 'shop-nbo-001',
    name: 'Faith Mwangi',
    phone: '+254 722 931 044',
    total_spent: 94000,
    last_purchase_date: daysAgo(33),
    visit_count: 7,
    tags: ['VIP', 'At-Risk'],
    preferred_services: ['Evening Gowns', 'Stiletto Heels'],
  },
  {
    id: 'cust-vip-03',
    shop_id: 'shop-nbo-001',
    name: 'Kevin Omondi',
    phone: '+254 733 112 879',
    total_spent: 67000,
    last_purchase_date: daysAgo(41),
    visit_count: 5,
    tags: ['VIP', 'At-Risk'],
    preferred_services: ['Italian Loafers', 'Leather Jackets'],
  },
  {
    id: 'cust-vip-04',
    shop_id: 'shop-nbo-001',
    name: 'Wanjiku Kamau',
    phone: '+254 721 665 432',
    total_spent: 112000,
    last_purchase_date: daysAgo(38),
    visit_count: 9,
    tags: ['VIP', 'At-Risk'],
    preferred_services: ['Mulberry Silk Gowns', 'Quilted Crossbody'],
  },
  {
    id: 'cust-vip-05',
    shop_id: 'shop-nbo-001',
    name: 'Sharon Achieng',
    phone: '+254 718 290 143',
    total_spent: 58000,
    last_purchase_date: daysAgo(34),
    visit_count: 4,
    tags: ['VIP', 'At-Risk'],
    preferred_services: ['Turkish Denim', 'Chelsea Boots'],
  },
  {
    id: 'cust-vip-06',
    shop_id: 'shop-nbo-001',
    name: 'Dennis Mutua',
    phone: '+254 728 774 901',
    total_spent: 76000,
    last_purchase_date: daysAgo(32),
    visit_count: 6,
    tags: ['VIP', 'At-Risk'],
    preferred_services: ['Wool Blazers', 'Penny Loafers'],
  },
  {
    id: 'cust-vip-07',
    shop_id: 'shop-nbo-001',
    name: 'Amina Abdi',
    phone: '+254 710 338 521',
    total_spent: 89000,
    last_purchase_date: daysAgo(39),
    visit_count: 7,
    tags: ['VIP', 'At-Risk'],
    preferred_services: ['Silk Headscarves', 'Evening Clutches'],
  },
  {
    id: 'cust-vip-08',
    shop_id: 'shop-nbo-001',
    name: 'Grace Cherono',
    phone: '+254 701 543 890',
    total_spent: 63000,
    last_purchase_date: daysAgo(35),
    visit_count: 5,
    tags: ['VIP', 'At-Risk'],
    preferred_services: ['Party Dresses', 'Air Force 1'],
  },
];

export const ACTIVE_VIPS: Customer[] = [
  {
    id: 'cust-vip-09',
    shop_id: 'shop-nbo-001',
    name: 'Mercy Waweru',
    phone: '+254 723 881 229',
    total_spent: 98000,
    last_purchase_date: daysAgo(4),
    visit_count: 8,
    tags: ['VIP'],
  },
  {
    id: 'cust-vip-10',
    shop_id: 'shop-nbo-001',
    name: 'Lillian Nyambura',
    phone: '+254 715 440 918',
    total_spent: 72000,
    last_purchase_date: daysAgo(8),
    visit_count: 5,
    tags: ['VIP'],
  },
];

// Kenyan name generator
const FIRST_NAMES = ['David', 'Mercy', 'Peter', 'Esther', 'John', 'Alice', 'Moses', 'Mary', 'Joseph', 'Joy', 'Patrick', 'Rose', 'Victor', 'Beatrice', 'Daniel', 'Jane', 'Paul', 'Christine', 'Eric', 'Agnes', 'Stephen', 'Dorothy', 'Collins', 'Caroline', 'Antony', 'Irene', 'Kennedy', 'Stella', 'George', 'Nancy'];
const LAST_NAMES = ['Otieno', 'Waweru', 'Kariuki', 'Njoroge', 'Ochieng', 'Kimani', 'Maina', 'Muriuki', 'Chebet', 'Koech', 'Mugabe', 'Wambui', 'Kamande', 'Barasa', 'Karanja', 'Ouma', 'Gitonga', 'Omwamba', 'Githinji', 'Mutiso', 'Kilonzo', 'Wamalwa', 'Nyambura', 'Kiplagat', 'Muthoni'];

export function generateAllCustomers(): Customer[] {
  const customers: Customer[] = [...VIP_AT_RISK_CUSTOMERS, ...ACTIVE_VIPS];
  let idCounter = 11;

  for (let i = 0; i < 90; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[(i * 3 + 2) % LAST_NAMES.length];
    const daysSince = Math.floor(Math.random() * 80) + 1;
    const spent = Math.floor(Math.random() * 38000) + 1500;
    const visits = Math.max(1, Math.floor(spent / 6500) + 1);
    const prefix = ['71', '72', '70', '79', '74', '76'][i % 6];
    const randDigits = Math.floor(100000 + Math.random() * 900000);
    const phone = `+254 ${prefix}${randDigits.toString().slice(0, 1)} ${randDigits.toString().slice(1, 4)} ${randDigits.toString().slice(4, 7)}`;

    const tags: CustomerTag[] = [];
    if (spent > 50000) tags.push('VIP');
    if (daysSince > 30) tags.push('At-Risk');
    if (tags.length === 0) {
      tags.push(visits === 1 ? 'New' : 'Regular');
    }

    customers.push({
      id: `cust-${idCounter.toString().padStart(3, '0')}`,
      shop_id: 'shop-nbo-001',
      name: `${fn} ${ln}`,
      phone,
      total_spent: spent,
      last_purchase_date: daysAgo(daysSince),
      visit_count: visits,
      tags,
    });
    idCounter++;
  }

  return customers;
}

export function generateAllSales(customers: Customer[], products: Product[]): Sale[] {
  const sales: Sale[] = [];
  const prodMap = new Map(products.map((p) => [p.id, p]));

  // Ensure NO sales for dead stock in last 45 days
  sales.push({
    id: 'sale-old-01',
    shop_id: 'shop-nbo-001',
    product_id: 'prod-dead-01',
    customer_id: 'cust-vip-03',
    qty: 1,
    total: 4500,
    date: daysAgo(68),
    product_name: 'Pleated Chiffon Floral Maxi Dress',
    customer_name: 'Kevin Omondi',
    payment_method: 'mpesa',
    receipt_no: 'REC-901244',
  });
  sales.push({
    id: 'sale-old-02',
    shop_id: 'shop-nbo-001',
    product_id: 'prod-dead-01',
    customer_id: 'cust-vip-04',
    qty: 1,
    total: 4500,
    date: daysAgo(52),
    product_name: 'Pleated Chiffon Floral Maxi Dress',
    customer_name: 'Wanjiku Kamau',
    payment_method: 'cash',
    receipt_no: 'REC-901289',
  });

  // Generate sales where Handbags & Stilettos bundle frequently
  const dressIds = ['prod-03', 'prod-04', 'prod-05', 'prod-07', 'prod-13'];
  const bagId = 'prod-18'; // Quilted Crossbody Bag
  const shoeId = 'prod-08'; // Stiletto Heels

  let saleCounter = 3;

  for (let day = 45; day >= 1; day -= 2) {
    const cust = customers[(day * 4) % customers.length];
    const dress = prodMap.get(dressIds[day % dressIds.length]) || products[2];
    const bag = prodMap.get(bagId) || products[10];
    const shoes = prodMap.get(shoeId) || products[7];

    // Single sale item
    sales.push({
      id: `sale-${saleCounter++}`,
      shop_id: 'shop-nbo-001',
      product_id: dress.id,
      customer_id: cust.id,
      qty: 1,
      total: dress.sell_price,
      date: daysAgo(day),
      product_name: dress.name,
      customer_name: cust.name,
      payment_method: day % 2 === 0 ? 'mpesa' : 'cash',
      receipt_no: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
    });

    // Bundle sale: Dress + Crossbody Bag
    if (day % 3 === 0) {
      sales.push({
        id: `sale-${saleCounter++}`,
        shop_id: 'shop-nbo-001',
        product_id: bag.id,
        customer_id: cust.id,
        qty: 1,
        total: bag.sell_price,
        date: daysAgo(day),
        product_name: `${bag.name} (Bundled with Dress)`,
        customer_name: cust.name,
        payment_method: 'mpesa',
        receipt_no: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      });
    }

    // Weekend Party Bundle: Shoes + Clutch
    if (day % 4 === 0) {
      sales.push({
        id: `sale-${saleCounter++}`,
        shop_id: 'shop-nbo-001',
        product_id: shoes.id,
        customer_id: cust.id,
        qty: 1,
        total: shoes.sell_price,
        date: daysAgo(day),
        product_name: `${shoes.name} + Metallic Clutch Combo`,
        customer_name: cust.name,
        payment_method: 'mpesa',
        receipt_no: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      });
    }
  }

  return sales;
}

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-01',
    shop_id: 'shop-nbo-001',
    assigned_role: 'Floor Cashier',
    title: 'Broadcast KES 2,500 VIP Win-Back Voucher to 8 Inactive Fashionistas',
    description: 'Reach out via WhatsApp Cloud API to Brian Kipchoge, Faith Mwangi, Wanjiku Kamau, and 5 others who have not visited in 30+ days.',
    status: 'pending',
    ai_suggestion: {
      insight_type: 'vip_churn',
      source: 'Anna OS Intelligence Brief',
      potential_impact_kes: 580000,
    },
    created_at: daysAgo(2),
  },
  {
    id: 'task-02',
    shop_id: 'shop-nbo-001',
    assigned_role: 'Stock Manager',
    title: 'Discount & Relocate 18 Pleated Chiffon Dresses to Front Mannequins',
    description: 'Apply 15% flash sale discount tag (KES 3,825) and style all 18 units of floral maxi dresses on the main boutique window display.',
    status: 'pending',
    ai_suggestion: {
      insight_type: 'dead_stock',
      source: 'Anna OS Intelligence Brief',
      potential_impact_kes: 81000,
    },
    created_at: daysAgo(2),
  },
  {
    id: 'task-03',
    shop_id: 'shop-nbo-001',
    assigned_role: 'Boutique Stylist',
    title: 'Style 30 Stiletto Heels + Crossbody Bag Combos at Checkout Lounge',
    description: 'Pre-package 30 heel & bag accessory combos beside the checkout desk to capture 4x weekend impulse cross-sells.',
    status: 'approved',
    ai_suggestion: {
      insight_type: 'sales_strategy',
      source: 'Anna OS Intelligence Brief',
      potential_impact_kes: 95000,
    },
    created_at: daysAgo(4),
  },
];

export const INITIAL_CONNECTORS: Connector[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Cloud API',
    description: 'Autonomous customer win-backs, Sheng offer broadcasts, and digital M-Pesa receipts via Meta Cloud API.',
    icon: 'MessageSquare',
    status: 'connected',
    config: {
      phone_number_id: '254700000123',
      webhook_url: 'https://graph.facebook.com/v20.0/messages',
      api_token: 'meta_wa_prod_token_live_preview',
    },
    last_sync: 'Active · 12 min ago',
    sync_count: 48,
  },
  {
    id: 'gmail',
    name: 'Gmail & Google Workspace',
    description: 'Automated digital PDF receipts, supplier restock purchase orders, and daily financial executive summaries.',
    icon: 'Mail',
    status: 'connected',
    config: {
      gmail_address: 'orders@amaniluxe.co.ke',
      auto_email_receipts: true,
    },
    last_sync: 'Active · Just now',
    sync_count: 114,
  },
  {
    id: 'website',
    name: 'Online Storefront Connector',
    description: 'Bi-directional inventory sync with Shopify, WooCommerce, or custom boutique website.',
    icon: 'Globe',
    status: 'connected',
    config: {
      storefront_url: 'https://amaniluxe.co.ke/shop',
      storefront_platform: 'shopify',
      secret_key: 'shpat_live_89201948',
    },
    last_sync: 'Syncing · 2 min ago',
    sync_count: 320,
  },
];

export const INITIAL_CONTENT_IDEAS: ContentIdea[] = [];

export function generateDailyContentBatch(products: Product[]): ContentIdea[] {
  const dress = products.find((p) => p.id === 'prod-dead-01') || products[0];
  const boots = products.find((p) => p.id === 'prod-dead-02') || products[1];
  const heels = products.find((p) => p.name.includes('Heels')) || products[7];

  return [
    {
      id: `daily-idea-1-${Date.now()}`,
      platform: 'tiktok_reels',
      title: '3 Nairobi Weekend Outfits under KES 8,000 (OOTD)',
      hook: 'Nairobi babes, stop overpaying for church and brunch fits! 👗 Here are 3 complete luxury looks for under 8k!',
      script_body: `Beat 1 (0-3s): Rapid switch between 3 models wearing our Chiffon Maxi, Blazer Dress, and Wide-Leg Denim.\nBeat 2 (4-12s): Show styling with our chunky gold layered necklace and crossbody bag.\nBeat 3 (13-20s): Flash our exclusive Amani Luxe deal: 15% off when you buy 2 items today!\nBeat 4 (21-25s): Camera pans over full boutique mirror with M-Pesa till payment.`,
      call_to_action: 'Comment "DRIP" or click the WhatsApp link in bio to reserve your size before stock sells out!',
      target_audience: 'Nairobi fashionistas, young corporate women & brunch lovers',
      target_product_name: dress.name,
      suggested_audio_trend: 'Viral Kenyan Amapiano / Afro-House Remix',
      projected_views: '24k - 48k views',
      status: 'draft',
      curation_state: 'new_daily',
      created_at: new Date().toISOString().split('T')[0],
    },
    {
      id: `daily-idea-2-${Date.now()}`,
      platform: 'whatsapp_status',
      title: 'Flash WhatsApp VIP Drop: Rainproof Chelsea Boots + Trench',
      hook: 'Nairobi rain is here! ☔ Stay warm & stylish without ruining your sneakers!',
      script_body: `Photo 1: High-res flatlay of our Full-Grain Leather Lug-Sole Chelsea Boots beside the Camel Trench Coat.\nPhoto 2: Video showing waterproof water droplet test rolling off the leather boots.\nText Overlay: VIP Special: First 10 orders get a free silk scarf worth KES 2,400!`,
      call_to_action: 'Reply "BOOTS" with your shoe size (EU 37-41) to secure yours for immediate Nairobi courier drop.',
      target_audience: 'Existing boutique contacts & WhatsApp status viewers',
      target_product_name: boots.name,
      suggested_audio_trend: 'Acoustic Soul Chill',
      projected_views: '800 - 1,400 status views',
      status: 'draft',
      curation_state: 'new_daily',
      created_at: new Date().toISOString().split('T')[0],
    },
    {
      id: `daily-idea-3-${Date.now()}`,
      platform: 'instagram_carousel',
      title: 'Styling Guide: Stiletto Heels vs Chunky Boots with Wide-Leg Denim',
      hook: 'Are you wearing your wide-leg jeans correctly? 👠 Swipe to see how changing your shoes changes the whole vibe!',
      script_body: `Slide 1: Split cover photo showing jeans with Stilettos (Glam) vs Chelsea Boots (Street Edge).\nSlide 2: Day look breakdown: Denim + Ribbed Knit + Chelsea Boots.\nSlide 3: Night look breakdown: Denim + Satin Top + Metallic Stiletto Heels.\nSlide 4: Both shoe styles in stock in sizes EU 37 to 42 at Amani Luxe!`,
      call_to_action: 'Save this post for your Friday night fit planning. Tap view shop to order.',
      target_audience: 'Gen Z and millennial women exploring wardrobe staples',
      target_product_name: heels.name,
      suggested_audio_trend: 'Lofi Kenyan R&B Instrumental',
      projected_views: '12k - 20k reach',
      status: 'draft',
      curation_state: 'new_daily',
      created_at: new Date().toISOString().split('T')[0],
    },
  ];
}

export const INITIAL_GOALS: Goal[] = [
  {
    id: 'goal-01',
    shop_id: 'shop-nbo-001',
    title: 'Clear 18 Pleated Chiffon Maxi Dresses',
    category: 'clearance',
    target_value: 18,
    current_value: 0,
    unit: 'units',
    deadline: 'This Friday',
    status: 'active',
    ai_note: 'Unlocks KES 81,000 working capital. 15% flash WhatsApp broadcast discount recommended.',
    created_at: daysAgo(2),
  },
  {
    id: 'goal-02',
    shop_id: 'shop-nbo-001',
    title: 'Win Back 8 Inactive VIP Fashionistas',
    category: 'vip_retention',
    target_value: 8,
    current_value: 2,
    unit: 'customers',
    deadline: 'End of Week',
    status: 'active',
    ai_note: 'Brian Kipchoge & Faith Mwangi re-engaged via KES 2,500 boutique voucher. 6 VIPs remaining.',
    created_at: daysAgo(3),
  },
  {
    id: 'goal-03',
    shop_id: 'shop-nbo-001',
    title: 'Reach KES 450,000 Weekly Boutique POS Sales',
    category: 'revenue',
    target_value: 450000,
    current_value: 312500,
    unit: 'KES',
    deadline: 'In 3 Days',
    status: 'active',
    ai_note: '69% progress. Need ~KES 137,500 in additional sales to achieve milestone.',
    created_at: daysAgo(4),
  },
  {
    id: 'goal-04',
    shop_id: 'shop-nbo-001',
    title: 'Style 30 Stiletto Heels + Crossbody Handbag Combos',
    category: 'units_sold',
    target_value: 30,
    current_value: 30,
    unit: 'units',
    status: 'achieved',
    achieved_at: 'Yesterday',
    ai_note: 'Completed by Boutique Stylist! Counter bundle conversion up 84%.',
    created_at: daysAgo(6),
  },
  {
    id: 'goal-05',
    shop_id: 'shop-nbo-001',
    title: 'M-Pesa Float & Boutique Register Reconciliation',
    category: 'revenue',
    target_value: 100000,
    current_value: 100000,
    unit: 'KES',
    status: 'achieved',
    achieved_at: '3 days ago',
    ai_note: 'Reconciled with 0% cash variance across 38 boutique shift transactions.',
    created_at: daysAgo(7),
  },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-01',
    customer_name: 'Wanjiku Kamau',
    customer_phone: '+254 721 665 432',
    service_name: 'VIP Personal Styling Session + Fitting',
    stylist_name: 'Mercy Wanjiru',
    appointment_time: 'Today 14:00',
    duration_minutes: 60,
    price_kes: 3500,
    status: 'confirmed',
  },
  {
    id: 'apt-02',
    customer_name: 'Faith Mwangi',
    customer_phone: '+254 722 931 044',
    service_name: 'Bridal Party Wardrobe Consultation',
    stylist_name: 'Mercy Wanjiru',
    appointment_time: 'Today 15:30',
    duration_minutes: 90,
    price_kes: 5000,
    status: 'confirmed',
  },
  {
    id: 'apt-03',
    customer_name: 'Brian Kipchoge',
    customer_phone: '+254 712 458 921',
    service_name: 'Custom Tailored Suit & Shoe Fitting',
    stylist_name: 'Kevin Kiprop',
    appointment_time: 'Today 16:45',
    duration_minutes: 45,
    price_kes: 2500,
    status: 'in_progress',
  },
];
