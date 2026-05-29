-- CreateTable
CREATE TABLE "app_push_subscriptions" (
    "id" TEXT NOT NULL,
    "appUserId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_push_subscriptions_endpoint_key" ON "app_push_subscriptions"("endpoint");

-- AddForeignKey
ALTER TABLE "app_push_subscriptions" ADD CONSTRAINT "app_push_subscriptions_appUserId_fkey" FOREIGN KEY ("appUserId") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
