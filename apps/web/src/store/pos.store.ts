import { create } from "zustand";

export interface CartItem {
  medicineId: string;
  inventoryItemId?: string;
  name: string;
  barcode?: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  batchNo?: string;
  stock: number;
}

interface PosState {
  items: CartItem[];
  discount: number;
  paymentMethod: string;
  addItem: (item: Omit<CartItem, "quantity" | "discount">) => void;
  updateQty: (medicineId: string, qty: number) => void;
  updatePrice: (medicineId: string, price: number) => void;
  updateDiscount: (medicineId: string, discount: number) => void;
  removeItem: (medicineId: string) => void;
  setDiscount: (discount: number) => void;
  setPaymentMethod: (method: string) => void;
  clearCart: () => void;
  subtotal: () => number;
  total: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  items: [],
  discount: 0,
  paymentMethod: "CASH",

  addItem: (item) => {
    set((s) => {
      const existing = s.items.find((i) => i.medicineId === item.medicineId);
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.medicineId === item.medicineId
              ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) }
              : i,
          ),
        };
      }
      return { items: [...s.items, { ...item, quantity: 1, discount: 0 }] };
    });
  },

  updateQty: (medicineId, qty) => {
    set((s) => ({
      items: qty <= 0
        ? s.items.filter((i) => i.medicineId !== medicineId)
        : s.items.map((i) => {
            if (i.medicineId !== medicineId) return i;
            // If stock is unknown (0 from failed lookup), allow up to 999
            const maxQty = i.stock > 0 ? i.stock : 999;
            return { ...i, quantity: Math.min(qty, maxQty) };
          }),
    }));
  },

  updatePrice: (medicineId, price) => {
    set((s) => ({
      items: s.items.map((i) =>
        i.medicineId === medicineId ? { ...i, unitPrice: Math.max(0, price) } : i,
      ),
    }));
  },

  updateDiscount: (medicineId, discount) => {
    set((s) => ({
      items: s.items.map((i) =>
        i.medicineId === medicineId ? { ...i, discount: Math.max(0, discount) } : i,
      ),
    }));
  },

  removeItem: (medicineId) => {
    set((s) => ({ items: s.items.filter((i) => i.medicineId !== medicineId) }));
  },

  setDiscount: (discount) => set({ discount }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  clearCart: () => set({ items: [], discount: 0, paymentMethod: "CASH" }),

  subtotal: () =>
    get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity - i.discount, 0),

  total: () => get().subtotal() - get().discount,
}));
