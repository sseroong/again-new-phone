-- CreateTable: tenants (먼저 생성해야 FK 참조 가능)
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable: user_tenants
CREATE TABLE "user_tenants" (
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tenants_pkey" PRIMARY KEY ("user_id","tenant_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");
CREATE INDEX "user_tenants_tenant_id_idx" ON "user_tenants"("tenant_id");

-- Insert default tenant
INSERT INTO "tenants" ("id", "name", "slug", "updated_at")
VALUES ('default-tenant', '폰가비', 'phonegabi', CURRENT_TIMESTAMP);

-- Step 1: Add tenant_id columns as NULLABLE first
ALTER TABLE "Product" ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "Order" ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "Payment" ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "SellRequest" ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "SellQuote" ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "Review" ADD COLUMN "tenant_id" TEXT;

-- Step 2: Backfill existing data with default tenant
UPDATE "Product" SET "tenant_id" = 'default-tenant' WHERE "tenant_id" IS NULL;
UPDATE "Order" SET "tenant_id" = 'default-tenant' WHERE "tenant_id" IS NULL;
UPDATE "OrderItem" SET "tenant_id" = 'default-tenant' WHERE "tenant_id" IS NULL;
UPDATE "Payment" SET "tenant_id" = 'default-tenant' WHERE "tenant_id" IS NULL;
UPDATE "SellRequest" SET "tenant_id" = 'default-tenant' WHERE "tenant_id" IS NULL;
UPDATE "SellQuote" SET "tenant_id" = 'default-tenant' WHERE "tenant_id" IS NULL;
UPDATE "Review" SET "tenant_id" = 'default-tenant' WHERE "tenant_id" IS NULL;

-- Step 3: Set columns to NOT NULL
ALTER TABLE "Product" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "SellRequest" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "SellQuote" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "Review" ALTER COLUMN "tenant_id" SET NOT NULL;

-- Step 4: Assign existing users to default tenant
INSERT INTO "user_tenants" ("user_id", "tenant_id", "role")
SELECT "id", 'default-tenant', "role" FROM "User";

-- CreateIndex for tenant_id columns
CREATE INDEX "Order_tenant_id_idx" ON "Order"("tenant_id");
CREATE INDEX "OrderItem_tenant_id_idx" ON "OrderItem"("tenant_id");
CREATE INDEX "Payment_tenant_id_idx" ON "Payment"("tenant_id");
CREATE INDEX "Product_tenant_id_idx" ON "Product"("tenant_id");
CREATE INDEX "Review_tenant_id_idx" ON "Review"("tenant_id");
CREATE INDEX "SellQuote_tenant_id_idx" ON "SellQuote"("tenant_id");
CREATE INDEX "SellRequest_tenant_id_idx" ON "SellRequest"("tenant_id");

-- AddForeignKey
ALTER TABLE "user_tenants" ADD CONSTRAINT "user_tenants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_tenants" ADD CONSTRAINT "user_tenants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SellRequest" ADD CONSTRAINT "SellRequest_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SellQuote" ADD CONSTRAINT "SellQuote_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
