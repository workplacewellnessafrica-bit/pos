// ─────────────────────────────────────────────────────────────────────────────
// DukaPOS — Shared Types
// ─────────────────────────────────────────────────────────────────────────────

export type Role = 'OWNER' | 'MANAGER' | 'CASHIER' | 'STOCK_CLERK' | 'VIEWER';
export type PlanTier = 'FREE' | 'STARTER' | 'GROWTH' | 'PRO';
export type OrderStatus = 'OPEN' | 'COMPLETED' | 'VOIDED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'MPESA' | 'CARD' | 'OTHER';
export type AdjustmentReason = 'DAMAGE' | 'RECOUNT' | 'THEFT' | 'OPENING_BALANCE' | 'SALE' | 'RECEIVE_STOCK' | 'REFUND' | 'OTHER';

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  businessId: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  currency?: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number; // seconds
}

export interface JwtPayload {
  sub: string;       // userId
  bid: string;       // businessId
  role: Role;
  iat: number;
  exp: number;
}

// ── Business ──────────────────────────────────────────────────────────────────

export interface BusinessSummary {
  id: string;
  name: string;
  slug: string;
  email: string;
  country: string;
  currency: string;
  planTier: PlanTier;
  logoUrl: string | null;
}

// ── Products ──────────────────────────────────────────────────────────────────

export interface ProductSummary {
  id: string;
  name: string;
  basePrice: string;
  images: string[];
  categoryId: string | null;
  hasVariants: boolean;
  isActive: boolean;
  variantCount?: number;
  totalStock?: number;
}

export interface VariantWithOptions {
  id: string;
  sku: string | null;
  price: string;
  stockQuantity: number;
  alertThreshold: number;
  images: string[];
  barcode: string | null;
  isActive: boolean;
  options: Array<{
    groupId: string;
    groupName: string;
    valueId: string;
    value: string;
  }>;
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
  barcode: string | null;
  variantGroups: Array<{
    id: string;
    name: string;
    displayOrder: number;
    optionValues: Array<{
      id: string;
      value: string;
      displayOrder: number;
    }>;
  }>;
  variants: VariantWithOptions[];
}

// ── Orders ────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId?: string;
  variantId?: string;
  productName: string;
  variantLabel?: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  imageUrl?: string;
}

export interface CartTotals {
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  total: number;
}

export interface OrderSummary {
  id: string;
  receiptNo: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  total: string;
  cashierName: string;
  itemCount: number;
  createdAt: string;
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export interface StockLevel {
  variantId: string;
  productName: string;
  variantLabel: string;
  sku: string | null;
  stockQuantity: number;
  alertThreshold: number;
  isLow: boolean;
}

// ── API Response envelope ─────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field?: string; message: string }>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    cursor?: string;
    hasMore: boolean;
    total?: number;
  };
}

// ── Socket.io events ──────────────────────────────────────────────────────────

export interface StockAlertEvent {
  variantId: string;
  productName: string;
  variantLabel: string;
  stockQuantity: number;
  alertThreshold: number;
}

export interface SaleNewEvent {
  orderId: string;
  receiptNo: string | null;
  total: string;
  cashierName: string;
  paymentMethod: PaymentMethod;
}

export interface SyncAckEvent {
  processedIds: string[];
  failedIds: Array<{ clientUuid: string; error: string }>;
}

// ── Permission helpers ────────────────────────────────────────────────────────

export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 5,
  MANAGER: 4,
  CASHIER: 3,
  STOCK_CLERK: 2,
  VIEWER: 1,
};

export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

export const CAN_ACCESS_ADMIN: Role[] = ['OWNER', 'MANAGER', 'VIEWER'];
export const CAN_MANAGE_PRODUCTS: Role[] = ['OWNER', 'MANAGER'];
export const CAN_PROCESS_SALE: Role[] = ['OWNER', 'MANAGER', 'CASHIER'];
export const CAN_MANAGE_INVENTORY: Role[] = ['OWNER', 'MANAGER', 'STOCK_CLERK'];
export const CAN_VIEW_REPORTS: Role[] = ['OWNER', 'MANAGER', 'VIEWER'];
export const CAN_MANAGE_TEAM: Role[] = ['OWNER'];
export const CAN_MANAGE_SETTINGS: Role[] = ['OWNER'];
export const CAN_EXPORT: Role[] = ['OWNER', 'MANAGER', 'VIEWER'];
