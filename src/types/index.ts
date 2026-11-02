/**
 * Core Prisma-compatible schema and types for Anna OS (Duka OS)
 * Supports dynamic industry templates, connectors, content generation, and adaptive HUD navigation
 */

export type ShopType = 'boutique' | 'electronics' | 'salon_spa' | 'supermarket' | 'hardware';

export interface Shop {
  id: string;
  name: string;
  type: ShopType;
  owner_id: string;
  created_at: string;
  staff_count?: number;
  currency: string;
  custom_fields_needed?: string[];
  suggested_roles?: string[];
  template_title?: string;
}

export interface ProductCustomFields {
  size?: string;             // for boutique / apparel (XS, S, M, L, XL, EU 38, etc.)
  color?: string;            // for boutique / apparel (Emerald, Black, Camel, etc.)
  material?: string;         // for boutique / apparel (Silk, Leather, Denim, Cotton)
  warranty_months?: number;
  serial_no?: string;
  expiry_date?: string;
  duration_minutes?: number; // for salon/spa
  stylist_name?: string;     // for salon/spa
  condition?: 'brand_new' | 'refurbished' | 'repair_service';
  supplier?: string;
  [key: string]: unknown;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  sku: string;
  category: string;
  buy_price: number;
  sell_price: number;
  stock_qty: number;
  custom_fields: ProductCustomFields;
  created_at: string;
}

export type CustomerTag = 'VIP' | 'At-Risk' | 'Regular' | 'New' | 'B2B';

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  phone: string;
  total_spent: number;
  last_purchase_date: string;
  visit_count: number;
  tags: CustomerTag[];
  preferred_services?: string[];
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  qty: number;
  unit_price: number;
  subtotal: number;
  size?: string;
  color?: string;
}

export interface Sale {
  id: string;
  shop_id: string;
  product_id: string;
  customer_id: string;
  qty: number;
  total: number;
  date: string;
  product_name?: string;
  customer_name?: string;
  items?: SaleItem[];
  payment_method?: 'mpesa' | 'cash' | 'card';
  receipt_no?: string;
}

export interface CartItem {
  product: Product;
  qty: number;
  selected_size?: string;
  selected_color?: string;
}

export type TaskStatus = 'pending' | 'approved' | 'done';
export type RoleName = string;

export interface Task {
  id: string;
  shop_id: string;
  assigned_role: string;
  title: string;
  description: string;
  status: TaskStatus;
  ai_suggestion?: {
    insight_type: string;
    source: string;
    potential_impact_kes?: number;
    recommended_date?: string;
  };
  created_at: string;
}

export interface RolePermissions {
  can_view_analyzer: boolean;
  can_edit_inventory: boolean;
  can_record_sales: boolean;
  can_send_whatsapp: boolean;
  can_manage_tasks: boolean;
  can_view_customers?: boolean;
  can_view_content?: boolean;
  can_view_goals?: boolean;
  can_manage_team?: boolean;
}

export interface Role {
  id: string;
  shop_id: string;
  name: string;
  email?: string;
  permissions: RolePermissions;
}

export interface TeamMember {
  id: string;
  shop_id: string;
  name: string;
  email: string;
  role_name: string;
  permissions: RolePermissions;
  avatar?: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'google' | 'facebook' | 'apple' | 'email' | 'demo';
  role_name: string;
}

export type InsightType = 'dead_stock' | 'vip_churn' | 'sales_strategy' | 'appointment_gap';

export interface BusinessInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  affected_products?: { id: string; name: string; qty: number; value_kes: number }[];
  affected_customers?: { id: string; name: string; phone: string; total_spent: number; days_inactive: number }[];
  suggested_action: string;
  suggested_discount?: number;
  estimated_recovery_kes?: number;
  badge_label: string;
  status?: 'active' | 'approved_whatsapp' | 'approved_task' | 'dismissed';
}

export interface WhatsAppPayload {
  recipient_phone: string;
  recipient_name: string;
  template_type: string;
  message_body: string;
  language: 'sheng_english' | 'english' | 'swahili';
  status: 'draft' | 'sending' | 'delivered';
}

export interface ShopContextAnswers {
  last_campaign_feedback?: string;
  social_reach_views?: string;
  foot_traffic_observation?: string;
  updated_at?: string;
}

/**
 * Connectors & Integrations
 */
export type ConnectorId = 'whatsapp' | 'gmail' | 'website';

export interface Connector {
  id: ConnectorId;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'configuring';
  config: {
    phone_number_id?: string;
    webhook_url?: string;
    api_token?: string;
    gmail_address?: string;
    auto_email_receipts?: boolean;
    storefront_url?: string;
    storefront_platform?: 'shopify' | 'woocommerce' | 'custom_api';
    secret_key?: string;
  };
  last_sync?: string;
  sync_count?: number;
}

/**
 * Content Wall & Marketing Ideas
 */
export type ContentPlatform = 'tiktok_reels' | 'whatsapp_status' | 'instagram_carousel' | 'sms_drop';

export interface ContentIdea {
  id: string;
  platform: ContentPlatform;
  title: string;
  hook: string;
  script_body: string;
  call_to_action: string;
  target_audience: string;
  suggested_audio_trend?: string;
  target_product_name?: string;
  status: 'draft' | 'approved' | 'posted';
  curation_state?: 'new_daily' | 'selected' | 'discarded';
  projected_views: string;
  created_at: string;
}

/**
 * Service/Salon Appointments (Adaptive Nav)
 */
export interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  stylist_name: string;
  appointment_time: string;
  duration_minutes: number;
  price_kes: number;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
}

/**
 * Business Goals & Targets Tracking
 */
export type GoalCategory = 'revenue' | 'clearance' | 'vip_retention' | 'units_sold';

export interface Goal {
  id: string;
  shop_id: string;
  title: string;
  category: GoalCategory;
  target_value: number;
  current_value: number;
  unit: 'KES' | 'units' | 'customers';
  deadline?: string;
  status: 'active' | 'achieved' | 'expired';
  achieved_at?: string;
  ai_note?: string;
  created_at: string;
}

