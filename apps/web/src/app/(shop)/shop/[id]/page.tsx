"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const FORM_LABEL: Record<string, string> = {
  TABLET: "Tablet", CAPSULE: "Capsule", SYRUP: "Syrup", INJECTION: "Injection",
  CREAM: "Cream", DROPS: "Drops", INHALER: "Inhaler", POWDER: "Powder",
  SUPPOSITORY: "Suppository", PATCH: "Patch", OTHER: "Other",
};

const AVAIL: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  available:    { label: "Available",    color: "#007A5E", bg: "#E6FAF4", dot: "#00C897" },
  low_stock:    { label: "Low Stock",    color: "#92400E", bg: "#FEF3C7", dot: "#F59E0B" },
  out_of_stock: { label: "Out of Stock", color: "#991B1B", bg: "#FEE2E2", dot: "#EF4444" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#180D62", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #EDE9FF" }}>
      {children}
    </div>
  );
}

function WarningCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#FFF9EC", border: "1px solid #FDE68A", borderRadius: 12,
      padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start",
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
      <span style={{ fontSize: 14, color: "#78350F", lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

export default function MedicineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [med, setMed] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/v1/marketplace/medicines/${id}`)
      .then(r => setMed(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 16px", color: "#9B9BC0" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%", border: "3px solid #EDE9FF",
          borderTopColor: "#00C897", animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !med) {
    return (
      <div style={{ textAlign: "center", padding: "80px 16px" }}>
        <p style={{ fontSize: 48 }}>💊</p>
        <p style={{ fontWeight: 700, color: "#180D62", fontSize: 18 }}>Medicine not found</p>
        <Link href="/shop" style={{ color: "#00C897", fontSize: 14 }}>← Back to search</Link>
      </div>
    );
  }

  const availablePharmacies = med.pharmacies?.filter((p: any) => p.availability !== "out_of_stock") ?? [];
  const overallAvailability = availablePharmacies.length > 0
    ? (availablePharmacies.some((p: any) => p.availability === "available") ? "available" : "low_stock")
    : "out_of_stock";
  const lowestPrice = med.pharmacies?.length
    ? Math.min(...med.pharmacies.map((p: any) => p.price))
    : null;

  const availStyle = AVAIL[overallAvailability];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 64px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Back link */}
      <div style={{ padding: "16px 0 8px" }}>
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", color: "#6B6B9A", fontSize: 14, cursor: "pointer", padding: 0 }}
        >
          ← Back
        </button>
      </div>

      {/* ── TOP SECTION ───────────────────────────────── */}
      <div style={{
        background: "#fff", borderRadius: 20, overflow: "hidden",
        border: "1px solid #EDE9FF", marginBottom: 20,
        boxShadow: "0 4px 16px rgba(24,13,98,0.07)",
      }}>
        {/* Image */}
        <div style={{
          background: "linear-gradient(135deg, #EDE9FF 0%, #F0FDFA 100%)",
          height: 200, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {med.imageUrl ? (
            <img src={med.imageUrl} alt={med.name} style={{ maxHeight: 170, maxWidth: "80%", objectFit: "contain" }} />
          ) : (
            <span style={{ fontSize: 72 }}>💊</span>
          )}
        </div>

        <div style={{ padding: "20px 20px 24px" }}>
          {/* Name + form */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#180D62", lineHeight: 1.2 }}>
                {med.name}
              </h1>
              {med.strength && (
                <p style={{ margin: 0, fontSize: 15, color: "#6B6B9A", fontWeight: 500 }}>{med.strength}</p>
              )}
              {med.genericName && (
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9B9BC0" }}>Generic: {med.genericName}</p>
              )}
            </div>
            <span style={{
              background: "#EDE9FF", color: "#2D1B8E", borderRadius: 8,
              padding: "5px 10px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
            }}>
              {FORM_LABEL[med.form] ?? med.form}
            </span>
          </div>

          {/* Price + availability row */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: 18, flexWrap: "wrap", gap: 12,
          }}>
            <div>
              {lowestPrice !== null ? (
                <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#180D62" }}>
                  ${lowestPrice.toFixed(2)}
                  {med.pharmacies?.length > 1 && (
                    <span style={{ fontSize: 13, fontWeight: 400, color: "#9B9BC0", marginLeft: 4 }}>starting from</span>
                  )}
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: 16, color: "#9B9BC0" }}>Price not available</p>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <span style={{
                background: availStyle.bg, color: availStyle.color,
                borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: availStyle.dot, display: "inline-block" }} />
                {availStyle.label}
              </span>

              {med.requiresPrescription && (
                <span style={{
                  background: "#FEE2E2", color: "#DC2626", borderRadius: 6,
                  padding: "4px 10px", fontSize: 12, fontWeight: 700,
                }}>
                  Prescription Required
                </span>
              )}
              {!med.requiresPrescription && (
                <span style={{
                  background: "#E6FAF4", color: "#007A5E", borderRadius: 6,
                  padding: "4px 10px", fontSize: 12, fontWeight: 600,
                }}>
                  Over-the-Counter
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MIDDLE SECTION ────────────────────────────── */}

      {med.description && (
        <Section title="About this medicine">
          <InfoCard>
            <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{med.description}</p>
          </InfoCard>
        </Section>
      )}

      {/* Usage */}
      <Section title="How to use">
        <InfoCard>
          <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
            Take as directed by your pharmacist or doctor.
            {med.form === "TABLET" && " Swallow with a full glass of water."}
            {med.form === "SYRUP" && " Shake well before use. Use the measuring cup provided."}
            {med.form === "INJECTION" && " Administered by a healthcare professional only."}
            {med.form === "CREAM" && " Apply a thin layer to the affected area."}
          </p>
        </InfoCard>
      </Section>

      {/* Warnings */}
      {med.contraindications && (
        <Section title="Warnings">
          <WarningCard>{med.contraindications}</WarningCard>
        </Section>
      )}
      {!med.contraindications && (
        <Section title="Warnings">
          <WarningCard>
            Do not use without consulting a pharmacist or doctor if you are pregnant, breastfeeding, or taking other medications.
          </WarningCard>
        </Section>
      )}

      {med.sideEffects && (
        <Section title="Possible side effects">
          <InfoCard>
            <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{med.sideEffects}</p>
          </InfoCard>
        </Section>
      )}

      {med.storageConditions && (
        <Section title="Storage">
          <InfoCard>
            <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{med.storageConditions}</p>
          </InfoCard>
        </Section>
      )}

      {/* Safety disclaimer */}
      <div style={{
        background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 12,
        padding: "14px 16px", marginBottom: 28, display: "flex", gap: 10,
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
        <p style={{ margin: 0, fontSize: 13, color: "#0369A1", lineHeight: 1.6 }}>
          <strong>Important:</strong> Always consult a licensed pharmacist or doctor before using any medicine.
          This information is for general guidance only and is not a substitute for professional medical advice.
        </p>
      </div>

      {/* ── BOTTOM SECTION ────────────────────────────── */}

      {/* Nearby pharmacies */}
      <Section title={`Available at ${med.pharmacies?.length ?? 0} ${med.pharmacies?.length === 1 ? "pharmacy" : "pharmacies"}`}>
        {!med.pharmacies?.length ? (
          <InfoCard>
            <p style={{ margin: 0, color: "#9B9BC0", fontSize: 14 }}>
              Currently not available at any nearby pharmacy.
            </p>
          </InfoCard>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {med.pharmacies.map((p: any) => {
              const a = AVAIL[p.availability] ?? AVAIL.out_of_stock;
              return (
                <div key={p.id} style={{
                  background: "#fff", borderRadius: 14, padding: "14px 16px",
                  border: "1px solid #EDE9FF", display: "flex",
                  alignItems: "center", justifyContent: "space-between", gap: 12,
                  opacity: p.availability === "out_of_stock" ? 0.55 : 1,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, color: "#180D62" }}>
                      {p.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "#9B9BC0" }}>
                      {p.branchName} · {p.city}
                    </p>
                    {p.branchAddress && (
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9B9BC0" }}>{p.branchAddress}</p>
                    )}
                    {p.phone && (
                      <p style={{ margin: "4px 0 0", fontSize: 12 }}>
                        <a href={`tel:${p.phone}`} style={{ color: "#00C897", textDecoration: "none" }}>
                          📞 {p.phone}
                        </a>
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "#180D62" }}>
                      ${p.price.toFixed(2)}
                    </p>
                    <span style={{
                      background: a.bg, color: a.color,
                      borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700,
                      display: "flex", alignItems: "center", gap: 4, justifyContent: "center",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.dot, display: "inline-block" }} />
                      {a.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Alternatives placeholder */}
      <Section title="Generic Alternatives">
        <InfoCard>
          <p style={{ margin: 0, fontSize: 14, color: "#6B6B9A" }}>
            Ask your pharmacist about lower-cost generic alternatives that contain the same active ingredient.
          </p>
        </InfoCard>
      </Section>

    </div>
  );
}
