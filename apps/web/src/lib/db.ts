import Dexie, { type Table } from "dexie";

export interface LocalMedicine {
  id: string;
  name: string;
  barcode?: string;
  unitPrice: number;
  stock: number;
  batchNo?: string;
  branchId: string;
  pharmacyId: string;
  syncedAt: number;
}

export interface SyncQueueItem {
  id?: number;
  endpoint: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  body: any;
  createdAt: number;
  retries: number;
  status: "pending" | "failed";
  errorMsg?: string;
  localId?: string;
}

export interface OfflineTransaction {
  id: string;
  branchId: string;
  items: any[];
  paymentMethod: string;
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  createdAt: number;
  synced: boolean;
  syncedAt?: number;
}

class DawoLinkDB extends Dexie {
  medicines!: Table<LocalMedicine>;
  syncQueue!: Table<SyncQueueItem>;
  offlineTransactions!: Table<OfflineTransaction>;

  constructor() {
    super("dawolink_offline");
    this.version(1).stores({
      medicines: "id, branchId, pharmacyId, barcode, syncedAt",
      syncQueue: "++id, status, createdAt",
      offlineTransactions: "id, branchId, synced, createdAt",
    });
  }
}

export const db = new DawoLinkDB();
