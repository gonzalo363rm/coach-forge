-- Billing catalog and transactions

CREATE TYPE "CatalogStatus" AS ENUM ('active', 'inactive');
CREATE TYPE "PlanType" AS ENUM ('individual', 'club');
CREATE TYPE "DurationUnit" AS ENUM ('month', 'year');
CREATE TYPE "PermissionValueKind" AS ENUM ('flag', 'limit');
CREATE TYPE "DiscountType" AS ENUM ('percentage', 'fixed');
CREATE TYPE "SubscriptionStatus" AS ENUM ('pending', 'active', 'expired', 'cancelled');
CREATE TYPE "PaymentProvider" AS ENUM ('mercado_pago');
CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'debit_card', 'account_money', 'ticket', 'bank_transfer', 'other');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'cancelled');

CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "valueKind" "PermissionValueKind" NOT NULL,
    "appliesToPlanType" "PlanType",
    "status" "CatalogStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");
CREATE INDEX "Permission_status_idx" ON "Permission"("status");

CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "PlanType" NOT NULL,
    "status" "CatalogStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Plan_type_idx" ON "Plan"("type");
CREATE INDEX "Plan_status_idx" ON "Plan"("status");

CREATE TABLE "PlanPermission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "planId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "value" INTEGER,

    CONSTRAINT "PlanPermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlanPermission_planId_permissionId_key" ON "PlanPermission"("planId", "permissionId");
CREATE INDEX "PlanPermission_planId_idx" ON "PlanPermission"("planId");
CREATE INDEX "PlanPermission_permissionId_idx" ON "PlanPermission"("permissionId");

CREATE TABLE "PlanOffer" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationValue" INTEGER NOT NULL,
    "durationUnit" "DurationUnit" NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "status" "CatalogStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "PlanOffer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlanOffer_planId_idx" ON "PlanOffer"("planId");
CREATE INDEX "PlanOffer_status_idx" ON "PlanOffer"("status");

CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "code" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "maxUses" INTEGER,
    "status" "CatalogStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Discount_code_key" ON "Discount"("code");
CREATE INDEX "Discount_status_idx" ON "Discount"("status");

CREATE TABLE "PlanOfferDiscount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "planOfferId" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,

    CONSTRAINT "PlanOfferDiscount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlanOfferDiscount_planOfferId_discountId_key" ON "PlanOfferDiscount"("planOfferId", "discountId");
CREATE INDEX "PlanOfferDiscount_planOfferId_idx" ON "PlanOfferDiscount"("planOfferId");
CREATE INDEX "PlanOfferDiscount_discountId_idx" ON "PlanOfferDiscount"("discountId");

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "planOfferId" TEXT,
    "discountId" TEXT,
    "planName" TEXT NOT NULL,
    "offerName" TEXT,
    "durationValue" INTEGER NOT NULL,
    "durationUnit" "DurationUnit" NOT NULL,
    "originalPrice" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "finalPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "permissionsSnapshot" JSONB NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
CREATE INDEX "Subscription_planOfferId_idx" ON "Subscription"("planOfferId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_endDate_idx" ON "Subscription"("endDate");

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "provider" "PaymentProvider" NOT NULL DEFAULT 'mercado_pago',
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "paymentMethod" "PaymentMethod",
    "preferenceId" TEXT,
    "externalId" TEXT,
    "merchantOrderId" TEXT,
    "providerStatus" TEXT,
    "providerPayload" JSONB,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_preferenceId_key" ON "Payment"("preferenceId");
CREATE UNIQUE INDEX "Payment_externalId_key" ON "Payment"("externalId");
CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

ALTER TABLE "PlanPermission" ADD CONSTRAINT "PlanPermission_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanPermission" ADD CONSTRAINT "PlanPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PlanOffer" ADD CONSTRAINT "PlanOffer_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PlanOfferDiscount" ADD CONSTRAINT "PlanOfferDiscount_planOfferId_fkey" FOREIGN KEY ("planOfferId") REFERENCES "PlanOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanOfferDiscount" ADD CONSTRAINT "PlanOfferDiscount_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planOfferId_fkey" FOREIGN KEY ("planOfferId") REFERENCES "PlanOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
