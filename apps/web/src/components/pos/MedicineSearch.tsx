"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { db } from "@/lib/db";
import { usePosStore } from "@/store/pos.store";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Search, Barcode, Loader2, Package, WifiOff } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  branchId: string;
}

export function MedicineSearch({ branchId }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addItem = usePosStore((s) => s.addItem);
  const { isOnline } = useOnlineStatus();

  const { data: results = [], isFetching } = useQuery<any[]>({
    queryKey: ["medicine-search", query, isOnline],
    queryFn: async () => {
      if (!isOnline) {
        const q = query.toLowerCase();
        const local = await db.medicines
          .where("branchId").equals(branchId)
          .filter(m => m.name.toLowerCase().includes(q) || (m.barcode ?? "").includes(q))
          .toArray();
        return local.map(m => ({ id: m.medicineId, name: m.name, barcode: m.barcode, _local: true }));
      }
      return api.get(`/v1/medicines?search=${encodeURIComponent(query)}`).then(r => r.data);
    },
    enabled: query.length >= 2,
    staleTime: 10000,
  });

  // Barcode scan — auto-submit on Enter with numeric-only input
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      const isBarcode = /^\d+$/.test(query.trim());
      if (isBarcode) {
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
          const res = await api.get(`/v1/medicines/barcode/${query.trim()}`);
          const med = res.data;
          const stock = med.inventory?.[0];
          if (stock) {
            addItem({
              medicineId: med.id,
              name: med.name,
              barcode: med.barcode,
              unitPrice: Number(stock.sellingPrice),
              stock: stock.quantity,
              batchNo: stock.batchNo,
            });
            setQuery("");
          }
        } catch {
          // not found
        }
      }
    }
  };

  useEffect(() => {
    setOpen(query.length >= 2 && results.length > 0);
  }, [query, results]);

  const handleSelect = async (med: any) => {
    if (!isOnline || med._local) {
      const localMed = await db.medicines
        .where("branchId").equals(branchId)
        .and(m => m.medicineId === med.id)
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
      }
      setQuery("");
      setOpen(false);
      inputRef.current?.focus();
      return;
    }

    try {
      const stockRes = await api.get(`/v1/inventory/branches/${branchId}/items?medicineId=${med.id}`);
      const stock = stockRes.data?.[0];
      addItem({
        medicineId: med.id,
        name: med.name,
        barcode: med.barcode,
        unitPrice: stock ? Number(stock.sellingPrice) : 0,
        stock: stock ? stock.quantity : 0,
        batchNo: stock?.batchNo,
      });
    } catch {
      addItem({
        medicineId: med.id,
        name: med.name,
        barcode: med.barcode,
        unitPrice: 0,
        stock: 99,
      });
    }
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={isOnline ? "Search medicine name or scan barcode…" : "Search local cache or scan barcode…"}
          className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          autoFocus
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isFetching
            ? <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            : !isOnline
            ? <WifiOff className="h-4 w-4 text-orange-400" />
            : <Barcode className="h-4 w-4 text-gray-300" />
          }
        </div>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto">
          {results.map((med: any) => (
            <button
              key={med.id}
              onMouseDown={() => handleSelect(med)}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-blue-50 transition text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{med.name}</p>
                <p className="text-xs text-gray-500">
                  {med._local ? "Cached locally" : `${med.category ?? ""} · ${med.form ?? ""}${med.strength ? ` · ${med.strength}` : ""}`}
                </p>
              </div>
              {med.barcode && (
                <span className="text-xs text-gray-400 font-mono">{med.barcode}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
