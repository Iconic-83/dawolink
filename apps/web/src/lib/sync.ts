import { db } from "./db";
import { api } from "./api";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

let syncListeners: ((status: SyncStatus, count?: number) => void)[] = [];

export function onSyncStatusChange(cb: (status: SyncStatus, count?: number) => void) {
  syncListeners.push(cb);
  return () => { syncListeners = syncListeners.filter(l => l !== cb); };
}

function emit(status: SyncStatus, count?: number) {
  syncListeners.forEach(l => l(status, count));
}

export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  const pending = await db.syncQueue.where("status").equals("pending").toArray();
  if (!pending.length) return { synced: 0, failed: 0 };

  emit("syncing", pending.length);
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      await api.request({ method: item.method, url: item.endpoint, data: item.body });
      await db.syncQueue.delete(item.id!);
      synced++;
    } catch (err: any) {
      const retries = item.retries + 1;
      const status = retries >= 3 ? "failed" : "pending";
      const errorMsg = err?.response?.data?.message ?? err?.message ?? "Unknown error";
      await db.syncQueue.update(item.id!, { retries, status, errorMsg });
      failed++;
    }
  }

  // Sync offline POS transactions
  const unsyncedTx = await db.offlineTransactions.where("synced").equals(0).toArray();
  for (const tx of unsyncedTx) {
    try {
      await api.post(`/v1/pos/branches/${tx.branchId}/transactions`, {
        type: "SALE",
        paymentMethod: tx.paymentMethod,
        items: tx.items,
        discount: tx.discount,
        amountPaid: tx.amountPaid,
        offlineId: tx.id,
      });
      await db.offlineTransactions.update(tx.id, { synced: true, syncedAt: Date.now() });
      synced++;
    } catch (err: any) {
      failed++;
    }
  }

  emit(failed === 0 ? "success" : "error", synced);
  return { synced, failed };
}

export async function queueMutation(
  endpoint: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body: any,
  localId?: string,
) {
  await db.syncQueue.add({
    endpoint,
    method,
    body,
    createdAt: Date.now(),
    retries: 0,
    status: "pending",
    localId,
  });
}

export async function getPendingCount(): Promise<number> {
  const queueCount = await db.syncQueue.where("status").equals("pending").count();
  const txCount = await db.offlineTransactions.where("synced").equals(0).count();
  return queueCount + txCount;
}

export async function cacheMedicines(medicines: any[], branchId: string, pharmacyId: string) {
  const records = medicines.map(m => ({
    id: m.id,
    name: m.medicine?.name ?? m.name,
    barcode: m.medicine?.barcode ?? m.barcode,
    unitPrice: Number(m.sellingPrice ?? m.unitPrice ?? 0),
    stock: Number(m.quantity ?? m.stock ?? 0),
    batchNo: m.batchNo,
    branchId,
    pharmacyId,
    syncedAt: Date.now(),
  }));
  await db.medicines.bulkPut(records);
}
