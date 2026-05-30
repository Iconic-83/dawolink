-- Phase 3: National Intelligence, AI, Doctor Portal, Insurance, Counterfeit Detection

-- MedicineRecall
CREATE TYPE "RecallSeverity" AS ENUM ('LOW', 'HIGH', 'CRITICAL');

CREATE TABLE "medicine_recalls" (
    "id"           TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "batchNumber"  TEXT,
    "manufacturer" TEXT,
    "reason"       TEXT NOT NULL,
    "severity"     "RecallSeverity" NOT NULL DEFAULT 'LOW',
    "issuedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt"   TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "medicine_recalls_pkey" PRIMARY KEY ("id")
);

-- Doctor
CREATE TABLE "doctors" (
    "id"            TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "specialty"     TEXT,
    "phone"         TEXT NOT NULL,
    "email"         TEXT,
    "password"      TEXT NOT NULL,
    "clinicName"    TEXT,
    "clinicCity"    TEXT,
    "isActive"      BOOLEAN NOT NULL DEFAULT true,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "doctors_licenseNumber_key" ON "doctors"("licenseNumber");
CREATE UNIQUE INDEX "doctors_phone_key" ON "doctors"("phone");
CREATE UNIQUE INDEX "doctors_email_key" ON "doctors"("email");

-- ElectronicPrescription
CREATE TYPE "EPrescriptionStatus" AS ENUM ('ISSUED', 'DISPENSED', 'EXPIRED', 'CANCELLED');

CREATE TABLE "electronic_prescriptions" (
    "id"           TEXT NOT NULL,
    "doctorId"     TEXT NOT NULL,
    "patientName"  TEXT NOT NULL,
    "patientPhone" TEXT NOT NULL,
    "patientAge"   INTEGER,
    "diagnosis"    TEXT,
    "medicines"    JSONB NOT NULL,
    "notes"        TEXT,
    "status"       "EPrescriptionStatus" NOT NULL DEFAULT 'ISSUED',
    "issuedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"    TIMESTAMP(3) NOT NULL,
    "dispensedAt"  TIMESTAMP(3),
    "dispensedBy"  TEXT,
    CONSTRAINT "electronic_prescriptions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "electronic_prescriptions_patientPhone_idx" ON "electronic_prescriptions"("patientPhone");
ALTER TABLE "electronic_prescriptions" ADD CONSTRAINT "electronic_prescriptions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- InsuranceCompany
CREATE TABLE "insurance_companies" (
    "id"           TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "code"         TEXT NOT NULL,
    "contactEmail" TEXT,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "insurance_companies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "insurance_companies_code_key" ON "insurance_companies"("code");

-- InsuranceClaim
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING');

CREATE TABLE "insurance_claims" (
    "id"                 TEXT NOT NULL,
    "appUserId"          TEXT NOT NULL,
    "orderId"            TEXT NOT NULL,
    "insuranceCompanyId" TEXT NOT NULL,
    "memberId"           TEXT NOT NULL,
    "status"             "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAmount"    DECIMAL(10,2) NOT NULL,
    "approvedAmount"     DECIMAL(10,2),
    "rejectionReason"    TEXT,
    "submittedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt"        TIMESTAMP(3),
    CONSTRAINT "insurance_claims_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_appUserId_fkey" FOREIGN KEY ("appUserId") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "medicine_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_insuranceCompanyId_fkey" FOREIGN KEY ("insuranceCompanyId") REFERENCES "insurance_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CounterfeitScan
CREATE TYPE "ScannerType" AS ENUM ('STAFF', 'CUSTOMER', 'SYSTEM');
CREATE TYPE "ScanResult"  AS ENUM ('VERIFIED', 'SUSPICIOUS', 'COUNTERFEIT', 'UNVERIFIED');

CREATE TABLE "counterfeit_scans" (
    "id"           TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "batchNumber"  TEXT,
    "barcode"      TEXT,
    "scannedBy"    TEXT,
    "scannerType"  "ScannerType" NOT NULL DEFAULT 'STAFF',
    "result"       "ScanResult"  NOT NULL DEFAULT 'UNVERIFIED',
    "notes"        TEXT,
    "scannedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "counterfeit_scans_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "counterfeit_scans_batchNumber_idx" ON "counterfeit_scans"("batchNumber");
CREATE INDEX "counterfeit_scans_barcode_idx"      ON "counterfeit_scans"("barcode");
