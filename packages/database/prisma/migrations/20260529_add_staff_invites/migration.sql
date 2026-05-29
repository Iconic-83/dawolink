-- CreateTable
CREATE TABLE "staff_invites" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "branchId" TEXT,
    "token" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "staff_invites_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "staff_invites_token_key" ON "staff_invites"("token");
CREATE INDEX "staff_invites_token_idx" ON "staff_invites"("token");
ALTER TABLE "staff_invites" ADD CONSTRAINT "staff_invites_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_invites" ADD CONSTRAINT "staff_invites_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
