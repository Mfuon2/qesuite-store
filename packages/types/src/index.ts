// ─────────────────────────────────────────────────────────────
// Tenant & Branding
// ─────────────────────────────────────────────────────────────

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'suspended';

export type Plan = 'trial' | 'starter' | 'growth' | 'pro' | 'enterprise';

export type StoreCategory =
  | 'groceries'
  | 'food'
  | 'fashion'
  | 'electronics'
  | 'pharmacy'
  | 'beauty'
  | 'home'
  | 'sports'
  | 'other';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  primary_color: string;
  accent_color: string;
  font_family: string;
  phone: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  whatsapp_number: string | null;
  store_category: StoreCategory;
  timezone: 'Africa/Nairobi';
  plan: Plan;
  trial_ends_at: string | null;
  subscription_status: SubscriptionStatus;
  is_suspended: boolean;
  disabled_modules: string[];
  created_at: string;
}

// ─────────────────────────────────────────────────────────────
// Users & Auth
// ─────────────────────────────────────────────────────────────

export type UserRole = 'owner' | 'staff' | 'rider' | 'superadmin';

export interface User {
  id: string;
  tenant_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  password_hash?: string;
  role: UserRole;
  is_active: boolean;
  otp_code?: string | null;
  otp_expires_at?: string | null;
  refresh_token?: string | null;
  created_at: string;
}

export interface PublicUser {
  id: string;
  tenant_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface StoreMember {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'owner' | 'staff';
  job_title: string | null;
  is_active: boolean;
  permissions: string[];
  last_login_at: string | null;
  created_at: string;
}

export interface StaffInvitation {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  permissions: string[];
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expires_at: string;
  created_at: string;
}

export interface CurrentAccess {
  role: UserRole;
  permissions: string[];
  is_owner: boolean;
}

export interface JWTPayload {
  sub: string;          // user id
  tenant_id: string | null;
  role: UserRole;
  name: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginRequest {
  phone?: string;
  email?: string;
  password?: string;
  otp?: string;
}

export interface OTPRequest {
  phone: string;
  tenant_slug?: string;
}

// ─────────────────────────────────────────────────────────────
// Store Settings
// ─────────────────────────────────────────────────────────────

export type OrderView = 'kanban' | 'list' | 'table';
export type Language = 'en' | 'sw';
export type Currency = 'KES' | 'USD' | 'EUR' | 'GBP' | 'UGX' | 'TZS';

export interface StoreSettings {
  id: string;
  tenant_id: string;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  delivery_fee: number;
  delivery_radius_km: number;
  estimated_delivery_minutes: number;
  min_order_amount: number;
  currency: Currency;
  language: Language;
  dark_mode_enabled: boolean;
  order_view: OrderView;
  mpesa_payment_type: MpesaPaymentType | null;
  mpesa_payment_number: string | null;
  mpesa_account_ref: string | null;
  owner_notify_sms: boolean;
  owner_notify_email: boolean;
  notification_email: string | null;
  updated_at: string;
}

export type MpesaPaymentType = 'till' | 'paybill' | 'send_money';

export interface StoreSettingsUpdate {
  delivery_enabled?: boolean;
  pickup_enabled?: boolean;
  delivery_fee?: number;
  delivery_radius_km?: number;
  estimated_delivery_minutes?: number;
  min_order_amount?: number;
  currency?: Currency;
  language?: Language;
  dark_mode_enabled?: boolean;
  order_view?: OrderView;
  mpesa_payment_type?: MpesaPaymentType | null;
  mpesa_payment_number?: string | null;
  mpesa_account_ref?: string | null;
  owner_notify_sms?: boolean;
  owner_notify_email?: boolean;
  notification_email?: string | null;
}

// ─────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface CategoryCreate {
  name: string;
  icon?: string;
  sort_order?: number;
}

export interface CategoryUpdate {
  name?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  stock: number;
  image_url: string | null;
  featured: boolean;
  on_sale: boolean;
  is_active: boolean;
  sku: string | null;
  barcode: string | null;
  cost_price: number;
  unit_of_measure: string;
  reorder_level: number;
  expiry_date: string | null;
  supplier_id: string | null;
  created_at: string;
  updated_at: string;
  // joined
  category?: Category;
}

export interface ProductCreate {
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  sale_price?: number;
  stock?: number;
  image_url?: string;
  featured?: boolean;
  on_sale?: boolean;
  sku?: string;
  barcode?: string;
  cost_price?: number;
  unit_of_measure?: string;
  reorder_level?: number;
  expiry_date?: string;
  supplier_id?: string;
}

export interface ProductUpdate {
  category_id?: string | null;
  name?: string;
  description?: string | null;
  price?: number;
  sale_price?: number | null;
  stock?: number;
  image_url?: string | null;
  featured?: boolean;
  on_sale?: boolean;
  is_active?: boolean;
  sku?: string | null;
  barcode?: string | null;
  cost_price?: number;
  unit_of_measure?: string;
  reorder_level?: number;
  expiry_date?: string | null;
  supplier_id?: string | null;
}

// ─────────────────────────────────────────────────────────────
// Suppliers & purchase orders
// ─────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  tenant_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PurchaseOrderStatus =
  | 'draft' | 'pending_approval' | 'approved' | 'rejected'
  | 'sent' | 'partially_received' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  product_name?: string;
  unit_of_measure?: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  line_total: number;
}

export interface PurchaseOrder {
  id: string;
  tenant_id: string;
  supplier_id: string;
  supplier_name?: string;
  po_number: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  notes: string | null;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  sent_at: string | null;
  received_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  items?: PurchaseOrderItem[];
}

// ─────────────────────────────────────────────────────────────
// Stock ledger & costing
// ─────────────────────────────────────────────────────────────

export type StockMovementType =
  | 'purchase_receipt' | 'sale' | 'order_sale' | 'adjustment' | 'transfer_in' | 'transfer_out'
  | 'damaged' | 'expired' | 'count_correction' | 'initial';

export interface StockMovement {
  id: string;
  tenant_id: string;
  product_id: string;
  product_name?: string;
  type: StockMovementType;
  quantity_delta: number;
  unit_cost: number | null;
  resulting_stock: number;
  resulting_avg_cost: number | null;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface PriceHistoryEntry {
  id: string;
  tenant_id: string;
  product_id: string;
  field: 'cost_price' | 'price' | 'sale_price';
  old_value: number | null;
  new_value: number;
  changed_by: string | null;
  created_at: string;
}

export type StockTakeStatus = 'open' | 'closed' | 'cancelled';

export interface StockTakeLine {
  id: string;
  session_id: string;
  product_id: string;
  product_name?: string;
  unit_of_measure?: string;
  expected_quantity: number;
  counted_quantity: number | null;
  variance: number | null;
  reason: string | null;
  counted_by: string | null;
  counted_at: string | null;
}

export interface StockTakeSession {
  id: string;
  tenant_id: string;
  status: StockTakeStatus;
  opened_by: string;
  closed_by: string | null;
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
  lines?: StockTakeLine[];
}

// ─────────────────────────────────────────────────────────────
// Approvals
// ─────────────────────────────────────────────────────────────

export type ApprovalActionType = 'refund' | 'stock_adjustment' | 'expense_edit' | 'expense_delete' | 'credit_write_off' | 'credit_limit_override';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// ─────────────────────────────────────────────────────────────
// Billing & invoicing
// ─────────────────────────────────────────────────────────────

export type InvoiceType = 'quotation' | 'proforma' | 'invoice' | 'recurring';
export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'void';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  tenant_id: string;
  amount: number;
  method: string;
  reference: string | null;
  note: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_pin: string | null;
  pos_sale_id: string | null;
  type: InvoiceType;
  status: InvoiceStatus;
  subtotal: number;
  discount: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  currency: string;
  payment_terms_days: number;
  due_date: string | null;
  recurring_interval: 'weekly' | 'monthly' | null;
  notes: string | null;
  created_by: string;
  voided_by: string | null;
  voided_at: string | null;
  void_reason: string | null;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
}

export interface Customer {
  id: string;
  tenant_id: string;
  name: string | null;
  phone: string;
  email: string | null;
  credit_limit: number;
  credit_balance: number;
  order_count: number;
  total_spend: number;
  first_order_at: string;
  last_order_at: string;
}

export interface CustomerDetail extends Customer {
  open_invoices: Array<{
    id: string;
    invoice_number: string;
    total: number;
    amount_paid: number;
    due_date: string | null;
    created_at: string;
  }>;
}

export interface CreditNote {
  id: string;
  tenant_id: string;
  credit_note_number: string;
  invoice_id: string | null;
  customer_id: string | null;
  amount: number;
  reason: string | null;
  status: 'issued' | 'applied' | 'void';
  created_by: string;
  created_at: string;
}

export interface ArAgingRow {
  customer_id: string;
  name: string;
  phone: string;
  credit_balance: number;
  oldest_due_date: string | null;
  days_overdue: number;
  bucket: '0-30' | '31-60' | '61-90' | '90+';
}

export interface ApprovalRequest {
  id: string;
  tenant_id: string;
  action_type: ApprovalActionType;
  target_type: string | null;
  target_id: string | null;
  payload_json: string;
  reason: string | null;
  status: ApprovalStatus;
  requested_by: string;
  requested_by_name?: string;
  decided_by: string | null;
  decision_note: string | null;
  decided_at: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'pay_on_delivery' | 'mpesa' | 'stripe';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
  // computed
  line_total?: number;
}

export interface Order {
  id: string;
  tenant_id: string;
  customer_name: string | null;
  customer_phone: string;
  delivery_address: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  tracking_code: string;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  // joined
  items?: OrderItem[];
  assignment?: DeliveryAssignment;
}

export interface OrderCreate {
  customer_name?: string;
  customer_phone: string;
  delivery_address?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  payment_method: PaymentMethod;
  notes?: string;
  items: {
    product_id: string;
    quantity: number;
  }[];
}

export interface OrderStatusUpdate {
  status: OrderStatus;
  cancellation_reason?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  search?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

// ─────────────────────────────────────────────────────────────
// Restaurant POS (Sales Terminal) — store_category === 'food' only
// ─────────────────────────────────────────────────────────────

export type PosPaymentMethod = 'cash' | 'mpesa' | 'card' | 'split' | 'credit';
export type PosSplitLegMethod = 'cash' | 'mpesa' | 'card';
export type PosSaleStatus = 'completed' | 'voided';

export interface PosSalePayment {
  id: string;
  sale_id: string;
  tenant_id: string;
  method: PosSplitLegMethod;
  amount: number;
  reference: string | null;
  created_at: string;
}
export type PosCashMovementType =
  | 'opening_float'
  | 'cash_sale'
  | 'cash_void'
  | 'paid_in'
  | 'paid_out'
  | 'correction';

export interface PosCashMovement {
  id: string;
  till_session_id: string;
  movement_type: PosCashMovementType;
  amount: number;
  reason: string;
  reference_id: string;
  recorded_by: string;
  created_at: string;
}

export interface PosTillSession {
  id: string;
  tenant_id: string;
  business_date: string;
  opening_float: number;
  status: 'open' | 'closed';
  opened_by: string;
  opened_at: string;
  closed_by: string | null;
  closed_at: string | null;
  counted_cash: number | null;
  expected_cash: number | null;
  variance: number | null;
  running_float: number;
  cash_sales: number;
  paid_in: number;
  paid_out: number;
  corrections: number;
  movement_count: number;
  recent_movements?: PosCashMovement[];
  credit_sales?: Array<{ id: string; receipt_code: string; total: number; created_at: string; customer_id: string; customer_name: string }>;
  credit_sales_total?: number;
}

export interface PosSaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface PosSale {
  id: string;
  tenant_id: string;
  receipt_code: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: PosPaymentMethod;
  amount_tendered: number | null;
  change_due: number | null;
  mpesa_reference: string | null;
  status: PosSaleStatus;
  void_reason: string | null;
  table_label: string | null;
  note: string | null;
  served_by: string;
  created_at: string;
  voided_at: string | null;
  till_session_id: string | null;
  customer_id: string | null;
  // joined
  items?: PosSaleItem[];
  items_summary?: string;
  payments?: PosSalePayment[];
}

export interface PosSaleCreate {
  items: { product_id: string; quantity: number }[];
  payment_method: PosPaymentMethod;
  amount_tendered?: number;
  mpesa_reference?: string;
  payments?: { method: PosSplitLegMethod; amount: number; reference?: string }[];
  discount?: number;
  table_label?: string;
  note?: string;
  customer_id?: string;
}

export type ExpenseCategory =
  | 'supplies'
  | 'rent'
  | 'utilities'
  | 'staff_wages'
  | 'maintenance'
  | 'other';

export interface Expense {
  id: string;
  tenant_id: string;
  category: ExpenseCategory;
  description: string | null;
  amount: number;
  expense_date: string;
  recorded_by: string;
  created_at: string;
  cash_movement_id: string | null;
}

export interface ExpenseCreate {
  category: ExpenseCategory;
  description?: string;
  amount: number;
  expense_date: string;
}

// ─────────────────────────────────────────────────────────────
// Delivery
// ─────────────────────────────────────────────────────────────

export type VehicleType = 'bicycle' | 'motorcycle' | 'car' | 'on_foot';

export interface DeliveryStaff {
  id: string;
  tenant_id: string;
  user_id: string | null;
  name: string;
  phone: string;
  vehicle_type: VehicleType | null;
  is_active: boolean;
  current_lat: number | null;
  current_lng: number | null;
  location_updated_at: string | null;
  magic_link_token?: string | null;
  magic_link_expires_at?: string | null;
  created_at: string;
}

export interface DeliveryStaffCreate {
  name: string;
  phone: string;
  vehicle_type?: VehicleType;
}

export interface DeliveryStaffUpdate {
  name?: string;
  phone?: string;
  vehicle_type?: VehicleType;
  is_active?: boolean;
}

export interface LocationUpdate {
  lat: number;
  lng: number;
}

export type DeliveryAssignmentStatus =
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'FAILED';

export interface DeliveryAssignment {
  id: string;
  order_id: string;
  staff_id: string;
  tenant_id: string;
  status: DeliveryAssignmentStatus;
  failure_reason: string | null;
  assigned_at: string;
  picked_up_at: string | null;
  delivered_at: string | null;
  // joined
  staff?: DeliveryStaff;
  order?: Order;
}

export interface AssignDeliveryRequest {
  order_id: string;
  staff_id: string;
}

// ─────────────────────────────────────────────────────────────
// Cart
// ─────────────────────────────────────────────────────────────

export interface CartItem {
  product_id: string;
  product_name: string;
  price: number;
  sale_price: number | null;
  image_url: string | null;
  quantity: number;
  stock: number;
}

export interface Cart {
  tenant_id: string;
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  item_count: number;
}

// ─────────────────────────────────────────────────────────────
// Subscriptions & Billing
// ─────────────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  tenant_id: string;
  plan: Plan;
  amount: number;
  currency: Currency;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  payment_method: PaymentMethod | null;
  stripe_subscription_id: string | null;
  mpesa_phone: string | null;
  created_at: string;
}

export interface BillingHistory {
  id: string;
  tenant_id: string;
  amount: number;
  currency: Currency;
  status: string;
  payment_method: PaymentMethod;
  reference: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface PlanDetails {
  id: Plan;
  name: string;
  price_kes: number;
  price_usd: number;
  max_products: number;
  max_staff: number;
  features: string[];
}

// ─────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────

export type NotificationChannel = 'sms' | 'whatsapp' | 'push';

export interface NotificationLog {
  id: string;
  tenant_id: string;
  order_id: string | null;
  channel: NotificationChannel;
  recipient: string;
  message: string;
  status: 'sent' | 'failed' | 'queued';
  sent_at: string;
}

// ─────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────

export interface AnalyticsDaily {
  id: string;
  tenant_id: string;
  date: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  cancelled_orders: number;
  snapshot_at: string;
}

export interface AnalyticsSummary {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  cancelled_orders: number;
  completion_rate: number;
  online_orders?: number;
  pos_sales?: number;
  period_days: number;
}

export interface EmployeePerformance {
  user_id: string;
  name: string;
  job_title: string | null;
  is_active: boolean;
  total_sales: number;
  online_orders: number;
  pos_sales: number;
  revenue: number;
  avg_sale: number;
  completed_sales: number;
  cancelled_or_voided: number;
  completion_rate: number;
  last_sale_at: string | null;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface StatusBreakdown {
  status: OrderStatus;
  count: number;
  percentage: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface DashboardStats {
  today: AnalyticsSummary;
  week: AnalyticsSummary;
  month: AnalyticsSummary;
  recent_orders: Order[];
  revenue_chart: RevenueDataPoint[];
  status_breakdown: StatusBreakdown[];
  top_products: TopProduct[];
}

// ─────────────────────────────────────────────────────────────
// Audit Log
// ─────────────────────────────────────────────────────────────

export type AuditAction =
  | 'login'
  | 'logout'
  | 'order.created'
  | 'order.status_changed'
  | 'order.cancelled'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'staff.invited'
  | 'staff.removed'
  | 'settings.updated'
  | 'subscription.changed';

export interface AuditLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  action: AuditAction;
  resource_type: string | null;
  resource_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────
// Pagination & API Responses
// ─────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

// ─────────────────────────────────────────────────────────────
// Cloudflare Worker Env
// (D1Database / R2Bucket / Queue come from @cloudflare/workers-types
//  in the worker-api app; fall back to unknown for other consumers)
// ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type _D1Database = typeof globalThis extends { D1Database: infer T } ? T : any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type _R2Bucket = typeof globalThis extends { R2Bucket: infer T } ? T : any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type _Queue = typeof globalThis extends { Queue: infer T } ? T : any;

export interface Env {
  DB: _D1Database;
  IMAGES: _R2Bucket;
  NOTIFICATION_QUEUE: _Queue;
  JWT_SECRET: string;
  MPESA_CONSUMER_KEY: string;
  MPESA_CONSUMER_SECRET: string;
  MPESA_SHORTCODE: string;
  MPESA_PASSKEY: string;
  MPESA_CALLBACK_URL: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PUBLISHABLE_KEY: string;
  AT_API_KEY: string;
  AT_USERNAME: string;
  AT_SENDER_ID: string;
  WHATSAPP_TOKEN: string;
  WHATSAPP_PHONE_ID: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  MAPBOX_ACCESS_TOKEN: string;
  APP_BASE_URL: string;
  ADMIN_BASE_URL: string;
}

// ─────────────────────────────────────────────────────────────
// M-Pesa
// ─────────────────────────────────────────────────────────────

export interface MpesaSTKPushRequest {
  phone: string;
  amount: number;
  order_id: string;
  account_reference: string;
  transaction_desc?: string;
}

export interface MpesaSTKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface MpesaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: { Name: string; Value: string | number }[];
      };
    };
  };
}

// ─────────────────────────────────────────────────────────────
// Storefront (public-facing)
// ─────────────────────────────────────────────────────────────

export interface StorefrontConfig {
  tenant: Pick<Tenant, 'id' | 'name' | 'slug' | 'logo_url' | 'banner_url' | 'primary_color' | 'accent_color' | 'font_family' | 'whatsapp_number' | 'phone' | 'address' | 'lat' | 'lng' | 'is_suspended' | 'subscription_status' | 'trial_ends_at'>;
  settings: Pick<StoreSettings, 'delivery_enabled' | 'pickup_enabled' | 'delivery_fee' | 'estimated_delivery_minutes' | 'min_order_amount' | 'currency' | 'language' | 'mpesa_payment_type' | 'mpesa_payment_number' | 'mpesa_account_ref'>;
}

export interface TrackOrderResponse {
  order: Pick<Order, 'id' | 'tracking_code' | 'status' | 'payment_status' | 'customer_name' | 'customer_phone' | 'delivery_address' | 'delivery_lat' | 'delivery_lng' | 'total' | 'created_at' | 'updated_at'>;
  items: OrderItem[];
  rider_location?: { lat: number; lng: number; name: string; phone: string } | null;
  assignment?: Pick<DeliveryAssignment, 'status' | 'assigned_at' | 'picked_up_at' | 'delivered_at'> & {
    rider_name?: string;
    rider_phone?: string;
    current_lat?: number | null;
    current_lng?: number | null;
  };
}
