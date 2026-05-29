-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('NONE', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "medicine_orders" ADD COLUMN "prescriptionRejectReason" TEXT,
ADD COLUMN "prescriptionStatus" "PrescriptionStatus" NOT NULL DEFAULT 'NONE';
