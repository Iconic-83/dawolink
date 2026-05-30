"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { db } from "@/lib/db";
import { usePosStore } from "@/store/pos.store";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Search, Barcode, Loader2, Package, WifiOff, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props { branchId: string; }

export function MedicineSearch({ branchId }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addItem = usePosStore((s) => s.addItem);
  const { isOnline } = useOnlineStatus();

  const { data: results = [], isFetching } = useQuery<any[]>({
    queryKey: ["medicine-search", query, branchId, isOnline],
    queryFn: async () => {
      if (!isOnline) {
        const q = query.toLowerCase();
        const local = await db.medicines
          .where("branchId").equals(branchId)
          .filter(m => m.name.toLowerCase().includes(q) || (m.barcode ?? "").includes(q))
          .toArray();
        return local.map(m => ({
          id: m.medicineId,
          name: m.name,
          barcode: m.barcode,
          strength: null,
          form: null,
          category: null,
          _local: true,
          _unitPrice: m.unitPrice,
          _stock: m.stock,
          _batchNo: m.batchNo,
        }));
      }
      return api.get(`/v1/medicines?search=${encodeURIComponent(query)}`).then(r => r.data);
    },
    enabled: query.length >= 2,
    staleTime: 10000,
  });

  useEffect(() => {
    setOpen(query.length >= 2 && results.length > 0);
  }, [query, results]);

  async function addToCart(med: any) {
    if (adding) return;
    setAdding(med.id);
    try {
      // Offline path — use cached data directly
      if (!isOnline || med._local) {
        addItem({
          medicineId: med.id,
          name: med.name,
          barcode: med.barcode,
          unitPrice: med._unitPrice ?? 0,
          stock: med._stock ?? 99,
          batchNo: med._batchNo,
        });
        setQuery("");
        setOpen(false);
        inputRef.current?.focus();
        return;
      }

      // Online path — fetch branch-specific price & stock in one call
      const { data: stockItem } = await api.get(
        `/v1/inventory/branches/${branchId}/pos-stock/${med.id}`
      );

      addItem({
        medicineId: med.id,
        name: med.name,
        barcode: med.barcode ?? stockItem?.medicine?.barcode ?? undefined,
        unitPrice: stockItem ? Number(stockItem.sellingPrice) : 0,
        stock: stockItem ? Number(stockItem.quantity) : 0,
        batchNo: stockItem?.batchNo ?? undefined,
        inventoryItemId: stockItem?.id,
      });
    } catch {
      // Still add with zero price so cashier can enter manually
      addItem({
        medicineId: med.id,
        name: med.name,
        barcode: med.barcode,
        unitPrice: 0,
        stock: 0,
      });
    } finally {
      setAdding(null);
      setQuery("");
      setOpen(false);
      inputRef.current?.focus();
    }
  }

  // Barcode scan — Enter key with numeric string
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !query.trim()) return;
    const isBarcode = /^\d{4,}$/.test(query.trim());
    if (!isBarcode) return;

    if (!isOnline) {
      const localMed = await db.medicines
        .where("branchId").equals(branchId)
        .and(m => m.barcode === query.trim())
        .first();
      if (localMed) {
        addItem({
          medicineId: localMed.medicineId,
          name: localMed.name,
          barcode: localMed.barcode,
          unitPrice: localMed.unitPrice,
          stock: localMed.stock,
          batchNo: localMed.batchNo,
        });
        setQuery("");
      }
      return;
    }

    try {
      const { data: med } = await api.get(`/v1/medicines/barcode/${query.trim()}`);
      const stock = med.inventory?.[0];
      addItem({
        medicineId: med.id,
        name: med.name,
        barcode: med.barcode,
        unitPrice: stock ? Number(stock.sellingPrice) : 0,
        stock: stock ? Number(stock.quantity) : 0,
        batchNo: stock?.batchNo,
        inventoryItemId: stock?.id,
      });
      setQuery("");
    } catch {
      // barcode not found
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={
            !branchId
              ? "Select a branch first…"
              : isOnline
              ? "Search medicine name or scan barcode…"
              : "Offline — searching local cache…"
          }
          disabled={!branchId}
          className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400"
          autoFocus
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isFetching || adding
            ? <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            : !isOnline
            ? <WifiOff className="h-4 w-4 text-orange-400" />
            : <Barcode className="h-4 w-4 text-gray-300" />}
        </div>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
          {results.map((med: any) => (
            <button
              key={med.id}
              onMouseDown={() => addToCart(med)}
              disabled={!!adding}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-indigo-50 transition text-left disabled:opacity-60"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{med.name}</p>
                <p className="text-xs text-gray-400">
                  {med._local
                    ? `Cached · $${(med._unitPrice ?? 0).toFixed(2)} · ${med._stock ?? 0} in stock`
                    : [med.category, med.form, med.strength].filter(Boolean).join(" · ")}
                </p>
              </div>
              {med.barcode && (
                <span className="text-xs text-gray-300 font-mono">{med.barcode}</span>
              )}
              {adding === med.id && (
                <Loader2 className="h-3.5 w-3.5 text-indigo-400 animate-spin flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
