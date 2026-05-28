// Default platform permissions seeded once
export const SYSTEM_PERMISSIONS = [
  // POS
  { key: "create_sales",       label: "Create Sales",          module: "pos" },
  { key: "return_sales",       label: "Process Returns",       module: "pos" },
  { key: "apply_discounts",    label: "Apply Discounts",       module: "pos" },
  { key: "view_receipts",      label: "View Receipts",         module: "pos" },
  // Inventory
  { key: "view_inventory",     label: "View Inventory",        module: "inventory" },
  { key: "add_inventory",      label: "Add Stock",             module: "inventory" },
  { key: "edit_inventory",     label: "Edit Inventory",        module: "inventory" },
  { key: "delete_inventory",   label: "Delete Inventory",      module: "inventory" },
  { key: "adjust_stock",       label: "Adjust Stock Levels",   module: "inventory" },
  { key: "manage_medicines",   label: "Manage Medicines",      module: "inventory" },
  // Suppliers
  { key: "view_suppliers",     label: "View Suppliers",        module: "suppliers" },
  { key: "manage_suppliers",   label: "Manage Suppliers",      module: "suppliers" },
  { key: "create_orders",      label: "Create Purchase Orders",module: "suppliers" },
  // Transfers
  { key: "request_transfers",  label: "Request Stock Transfers",module: "transfers" },
  { key: "approve_transfers",  label: "Approve Transfers",     module: "transfers" },
  // Analytics
  { key: "view_analytics",     label: "View Analytics",        module: "analytics" },
  { key: "export_reports",     label: "Export Reports",        module: "analytics" },
  // Staff
  { key: "view_staff",         label: "View Staff",            module: "staff" },
  { key: "manage_staff",       label: "Manage Staff",          module: "staff" },
  { key: "manage_roles",       label: "Manage Roles & Permissions", module: "staff" },
  // Settings
  { key: "view_settings",      label: "View Settings",         module: "settings" },
  { key: "manage_settings",    label: "Manage Settings",       module: "settings" },
  // Branches
  { key: "view_branches",      label: "View Branches",         module: "branches" },
  { key: "manage_branches",    label: "Manage Branches",       module: "branches" },
  // Customers
  { key: "view_customers",     label: "View Customers",        module: "customers" },
  { key: "manage_customers",   label: "Manage Customers",      module: "customers" },
];

// Default role → permission mappings
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  PHARMACY_OWNER: ["*"],  // all permissions
  BRANCH_MANAGER: [
    "create_sales", "return_sales", "apply_discounts", "view_receipts",
    "view_inventory", "add_inventory", "edit_inventory", "adjust_stock", "manage_medicines",
    "view_suppliers", "manage_suppliers", "create_orders",
    "request_transfers", "approve_transfers",
    "view_analytics", "export_reports",
    "view_staff", "manage_staff",
    "view_settings",
    "view_branches",
    "view_customers", "manage_customers",
  ],
  PHARMACIST: [
    "create_sales", "return_sales", "view_receipts",
    "view_inventory", "add_inventory", "edit_inventory", "manage_medicines",
    "view_suppliers", "request_transfers",
    "view_customers", "manage_customers",
  ],
  CASHIER: [
    "create_sales", "return_sales", "view_receipts",
    "view_inventory",
    "view_customers",
  ],
  INVENTORY_STAFF: [
    "view_inventory", "add_inventory", "edit_inventory", "adjust_stock",
    "view_suppliers", "request_transfers",
  ],
  AUDITOR: [
    "view_inventory", "view_analytics", "export_reports", "view_receipts", "view_staff",
  ],
};
