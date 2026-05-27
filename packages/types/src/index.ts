export type UserRole =
  | "SUPER_ADMIN"
  | "PHARMACY_OWNER"
  | "BRANCH_MANAGER"
  | "PHARMACIST"
  | "CASHIER"
  | "INVENTORY_STAFF"
  | "AUDITOR";

export type PaymentMethod =
  | "CASH"
  | "EVC_PLUS"
  | "ZAAD"
  | "SAHAL"
  | "PREMIER_WALLET"
  | "CREDIT"
  | "MIXED";

export type Plan = "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  pharmacyId: string;
  branchId?: string;
}

export interface DashboardStats {
  today: { revenue: number; transactions: number };
  month: { revenue: number };
  inventory: { totalMedicines: number; lowStockCount: number; expiringCount: number };
}

export interface ExpiryDashboard {
  expired: number;
  critical: number;
  warning: number;
  upcoming: number;
}
