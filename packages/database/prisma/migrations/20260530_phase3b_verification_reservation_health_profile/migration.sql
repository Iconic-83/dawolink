-- Phase 3B: Pharmacy Verification, Medicine Reservation, Customer Health Profile, Support Tickets

-- Pharmacy verification fields
CREATE TYPE "PharmacyVerifStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');

ALTER TABLE "pharmacies"
  ADD COLUMN "licenseUrl"              TEXT,
  ADD COLUMN "registrationCertUrl"     TEXT,
  ADD COLUMN "verificationStatus"      "PharmacyVerifStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "verificationNote"        TEXT,
  ADD COLUMN "verifiedAt"              TIMESTAMP(3);

-- Customer health profile fields
ALTER TABLE "app_users"
  ADD COLUMN "dateOfBirth"       TIMESTAMP(3),
  ADD COLUMN "gender"            TEXT,
  ADD COLUMN "allergies"         TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "chronicConditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "bloodType"         TEXT,
  ADD COLUMN "emergencyContact"  TEXT;

-- Medicine Reservation
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'CONFIRMED', 'EXPIRED', 'CANCELLED');

CREATE TABLE "medicine_reservations" (
    "id"              TEXT NOT NULL,
    "appUserId"       TEXT NOT NULL,
    "pharmacyId"      TEXT NOT NULL,
    "branchId"        TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "medicineName"    TEXT NOT NULL,
    "quantity"        INTEGER NOT NULL DEFAULT 1,
    "status"          "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt"       TIMESTAMP(3) NOT NULL,
    "confirmedAt"     TIMESTAMP(3),
    "cancelledAt"     TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "medicine_reservations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "medicine_reservations_appUserId_idx"   ON "medicine_reservations"("appUserId");
CREATE INDEX "medicine_reservations_pharmacyId_idx"  ON "medicine_reservations"("pharmacyId");
CREATE INDEX "medicine_reservations_expiresAt_idx"   ON "medicine_reservations"("expiresAt");
ALTER TABLE "medicine_reservations" ADD CONSTRAINT "medicine_reservations_appUserId_fkey"  FOREIGN KEY ("appUserId")  REFERENCES "app_users"("id")   ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "medicine_reservations" ADD CONSTRAINT "medicine_reservations_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Support Tickets
CREATE TYPE "TicketCategory" AS ENUM ('GENERAL', 'BILLING', 'TECHNICAL', 'INVENTORY', 'DELIVERY', 'ACCOUNT');
CREATE TYPE "TicketStatus"   AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TABLE "support_tickets" (
    "id"          TEXT NOT NULL,
    "pharmacyId"  TEXT,
    "appUserId"   TEXT,
    "subject"     TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category"    "TicketCategory" NOT NULL DEFAULT 'GENERAL',
    "status"      "TicketStatus"   NOT NULL DEFAULT 'OPEN',
    "priority"    "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "resolvedAt"  TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
