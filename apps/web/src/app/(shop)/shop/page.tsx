"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const AVAILABILITY_STYLE: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  available:    { label: "Available",   bg: "#E6FAF4", color: "#007A5E", dot: "#00C897" },
  low_stock:    { label: "Low Stock",   bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
  out_of_stock: { label: "Out of Stock",bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444" },
};

const FORM_LABEL: Record<string, string> = {
  TABLET: "Tablet", CAPSULE: "Capsule", SYRUP: "Syrup", INJECTION: "Injection",
  CREAM: "Cream", DROPS: "Drops", INHALER: "Inhaler", POWDER: "Powder",
  SUPPOSITORY: "Suppository", PATCH: "Patch", OTHER: "Other",
};

const POPULAR = ["Paracetamol", "Amoxicillin", "Ibuprofen", "Metronidazole", "Omeprazole", "Vitamin C"];

export default function ShopPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function search(query: string) {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get(`/v1/marketplace/search?q=${encodeURIComponent(query)}&limit=30`);
      setResults(data.results ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }

  // Debounced search as user types
  useEffect(() => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    const t = setTimeout(() => search(q), 420);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px 48px" }}>

      {/* Hero search */}
      <div style={{ textAlign: "center", padding: "40px 0 32px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#180D62", margin: "0 0 8px" }}>
          Find Medicines in Somalia
        </h1>
        <p style={{ color: "#6B6B9A", fontSize: 14, margin: "0 0 24px" }}>
          Search by medicine name or generic name
        </p>

        <div style={{
          display: "flex", gap: 8, maxWidth: 540, margin: "0 auto",
          background: "#fff", borderRadius: 14, padding: "6px 6px 6px 16px",
          boxShadow: "0 4px 20px rgba(24,13,98,0.12)",
          border: "1.5px solid #E8E4FF",
        }}>
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search(q)}
            placeholder="e.g. Paracetamol, Amoxicillin, Ibuprofen…"
            style={{
              flex: 1, border: "none", outline: "none", fontSize: 15,
              background: "transparent", color: "#180D62",
            }}
            autoFocus
          />
          <button
            onClick={() => search(q)}
            disabled={loading || !q.trim()}
            style={{
              background: "linear-gradient(90deg, #00C897, #009E78)",
              color: "#fff", border: "none", borderRadius: 10,
              padding: "10px 20px", fontWeight: 700, fontSize: 14,
              cursor: "pointer", opacity: loading || !q.trim() ? 0.6 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        {/* Popular searches */}
        {!searched && (
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {POPULAR.map(name => (
              <button
                key={name}
                onClick={() => { setQ(name); search(name); }}
                style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 13,
                  background: "#EDE9FF", color: "#2D1B8E", border: "none", cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {searched && !loading && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: "#6B6B9A", fontSize: 13 }}>
            {total === 0
              ? `No medicines found for "${q}"`
              : `${total} result${total !== 1 ? "s" : ""} for "${q}"`}
          </p>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#9B9BC0" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "3px solid #E8E4FF", borderTopColor: "#00C897",
            animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
          }} />
          <p style={{ fontSize: 14 }}>Finding medicines near you…</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}>
          {results.map((med: any) => {
            const avail = AVAILABILITY_STYLE[med.availability] ?? AVAILABILITY_STYLE.out_of_stock;
            return (
              <Link
                key={med.id}
                href={`/shop/${med.id}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{
                  background: "#fff", borderRadius: 16, overflow: "hidden",
                  border: "1px solid #EDE9FF",
                  boxShadow: "0 2px 8px rgba(24,13,98,0.06)",
                  transition: "box-shadow 0.15s, transform 0.15s",
                  cursor: "pointer",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(24,13,98,0.14)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(24,13,98,0.06)";
                    (e.currentTarget as HTMLElement).style.transform = "none";
                  }}
                >
                  {/* Image area */}
                  <div style={{
                    height: 120, background: "linear-gradient(135deg, #EDE9FF 0%, #F0FDFA 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {med.imageUrl ? (
                      <img src={med.imageUrl} alt={med.name} style={{ maxHeight: 100, maxWidth: "85%", objectFit: "contain" }} />
                    ) : (
                      <span style={{ fontSize: 40 }}>💊</span>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ padding: "14px 16px 16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#180D62", lineHeight: 1.3 }}>
                          {med.name}
                        </p>
                        {med.strength && (
                          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6B6B9A" }}>{med.strength}</p>
                        )}
                      </div>
                      <span style={{
                        background: "#EDE9FF", color: "#2D1B8E",
                        borderRadius: 6, padding: "3px 7px", fontSize: 11, fontWeight: 600,
                        whiteSpace: "nowrap", flexShrink: 0,
                      }}>
                        {FORM_LABEL[med.form] ?? med.form}
                      </span>
                    </div>

                    {med.genericName && (
                      <p style={{ margin: "0 0 8px", fontSize: 12, color: "#9B9BC0" }}>{med.genericName}</p>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: avail.dot, display: "inline-block", flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: avail.color }}>
                          {avail.label}
                        </span>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#180D62" }}>
                        ${med.lowestPrice.toFixed(2)}
                      </span>
                    </div>

                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "#9B9BC0" }}>
                        {med.pharmacyCount} {med.pharmacyCount === 1 ? "pharmacy" : "pharmacies"}
                      </span>
                      {med.requiresPrescription && (
                        <span style={{
                          fontSize: 11, background: "#FEE2E2", color: "#DC2626",
                          borderRadius: 4, padding: "2px 6px", fontWeight: 600,
                        }}>
                          Rx Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 16px", color: "#9B9BC0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ fontWeight: 600, color: "#180D62", fontSize: 16, margin: "0 0 6px" }}>
            No medicines found
          </p>
          <p style={{ fontSize: 14 }}>
            Try a different name or check spelling.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
