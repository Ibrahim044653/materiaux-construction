-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'OWNER', 'MANAGER', 'CASHIER', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "TenantPlan" AS ENUM ('STARTER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('CIMENT', 'FER_BETON', 'TOLE', 'PEINTURE', 'CARRELAGE', 'PLOMBERIE', 'ELECTRICITE', 'BOIS', 'AUTRE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'ORANGE_MONEY', 'WAVE', 'MTN_MONEY', 'VIREMENT', 'CREDIT');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('COMPLETED', 'PENDING_CREDIT', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIAL', 'RECEIVED', 'CANCELLED');

-- CreateTable: tenants
CREATE TABLE "tenants" (
    "id"        TEXT         NOT NULL,
    "name"      TEXT         NOT NULL,
    "email"     TEXT         NOT NULL,
    "phone"     TEXT,
    "plan"      "TenantPlan" NOT NULL DEFAULT 'STARTER',
    "status"    "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tenants_email_key" ON "tenants"("email");
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateTable: users
CREATE TABLE "users" (
    "id"           TEXT      NOT NULL,
    "tenantId"     TEXT,
    "storeId"      TEXT,
    "email"        TEXT      NOT NULL,
    "name"         TEXT      NOT NULL,
    "phone"        TEXT,
    "avatar"       TEXT,
    "passwordHash" TEXT      NOT NULL,
    "role"         "Role"    NOT NULL DEFAULT 'CASHIER',
    "isActive"     BOOLEAN   NOT NULL DEFAULT true,
    "lastLoginAt"  TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_tenantId_role_idx" ON "users"("tenantId", "role");
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateTable: refresh_tokens
CREATE TABLE "refresh_tokens" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "tokenHash" TEXT         NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateTable: password_resets
CREATE TABLE "password_resets" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "token"     TEXT         NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateTable: stores
CREATE TABLE "stores" (
    "id"        TEXT      NOT NULL,
    "tenantId"  TEXT      NOT NULL,
    "name"      TEXT      NOT NULL,
    "address"   TEXT,
    "phone"     TEXT,
    "isActive"  BOOLEAN   NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "stores_tenantId_idx" ON "stores"("tenantId");

-- CreateTable: products
CREATE TABLE "products" (
    "id"          TEXT              NOT NULL,
    "tenantId"    TEXT              NOT NULL,
    "reference"   TEXT              NOT NULL,
    "name"        TEXT              NOT NULL,
    "category"    "ProductCategory" NOT NULL,
    "description" TEXT,
    "photo"       TEXT,
    "barcode"     TEXT,
    "qrCode"      TEXT,
    "buyPrice"    DECIMAL(12,2)     NOT NULL,
    "sellPrice"   DECIMAL(12,2)     NOT NULL,
    "tva"         DECIMAL(5,2)      NOT NULL DEFAULT 18,
    "unit"        TEXT              NOT NULL DEFAULT 'unité',
    "isActive"    BOOLEAN           NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)      NOT NULL,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "products_tenantId_reference_key" ON "products"("tenantId", "reference");
CREATE INDEX "products_tenantId_category_idx" ON "products"("tenantId", "category");
CREATE INDEX "products_barcode_idx" ON "products"("barcode");

-- CreateTable: stock_entries
CREATE TABLE "stock_entries" (
    "id"             TEXT          NOT NULL,
    "tenantId"       TEXT          NOT NULL,
    "productId"      TEXT          NOT NULL,
    "storeId"        TEXT          NOT NULL,
    "quantity"       DECIMAL(12,2) NOT NULL DEFAULT 0,
    "alertThreshold" DECIMAL(12,2) NOT NULL DEFAULT 5,
    "updatedAt"      TIMESTAMP(3)  NOT NULL,
    CONSTRAINT "stock_entries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "stock_entries_productId_storeId_key" ON "stock_entries"("productId", "storeId");
CREATE INDEX "stock_entries_tenantId_storeId_idx" ON "stock_entries"("tenantId", "storeId");

-- CreateTable: stock_movements
CREATE TABLE "stock_movements" (
    "id"          TEXT                NOT NULL,
    "tenantId"    TEXT                NOT NULL,
    "productId"   TEXT                NOT NULL,
    "storeId"     TEXT                NOT NULL,
    "type"        "StockMovementType" NOT NULL,
    "quantity"    DECIMAL(12,2)       NOT NULL,
    "reason"      TEXT,
    "referenceId" TEXT,
    "createdById" TEXT                NOT NULL,
    "createdAt"   TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "stock_movements_tenantId_storeId_createdAt_idx" ON "stock_movements"("tenantId", "storeId", "createdAt");
CREATE INDEX "stock_movements_productId_idx" ON "stock_movements"("productId");

-- CreateTable: store_transfers
CREATE TABLE "store_transfers" (
    "id"          TEXT         NOT NULL,
    "tenantId"    TEXT         NOT NULL,
    "fromStoreId" TEXT         NOT NULL,
    "toStoreId"   TEXT         NOT NULL,
    "status"      TEXT         NOT NULL DEFAULT 'PENDING',
    "notes"       TEXT,
    "createdById" TEXT         NOT NULL,
    "validatedAt" TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "store_transfers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "store_transfers_tenantId_idx" ON "store_transfers"("tenantId");

-- CreateTable: store_transfer_items
CREATE TABLE "store_transfer_items" (
    "id"         TEXT          NOT NULL,
    "transferId" TEXT          NOT NULL,
    "productId"  TEXT          NOT NULL,
    "quantity"   DECIMAL(12,2) NOT NULL,
    CONSTRAINT "store_transfer_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: customers
CREATE TABLE "customers" (
    "id"            TEXT          NOT NULL,
    "tenantId"      TEXT          NOT NULL,
    "name"          TEXT          NOT NULL,
    "phone"         TEXT,
    "email"         TEXT,
    "address"       TEXT,
    "creditBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)  NOT NULL,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "customers_tenantId_idx" ON "customers"("tenantId");
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateTable: customer_payments
CREATE TABLE "customer_payments" (
    "id"            TEXT          NOT NULL,
    "tenantId"      TEXT          NOT NULL,
    "customerId"    TEXT          NOT NULL,
    "amount"        DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT          NOT NULL,
    "notes"         TEXT,
    "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_payments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "customer_payments_customerId_idx" ON "customer_payments"("customerId");

-- CreateTable: sales
CREATE TABLE "sales" (
    "id"             TEXT            NOT NULL,
    "tenantId"       TEXT            NOT NULL,
    "storeId"        TEXT            NOT NULL,
    "cashierId"      TEXT            NOT NULL,
    "customerId"     TEXT,
    "receiptNumber"  TEXT            NOT NULL,
    "status"         "SaleStatus"    NOT NULL DEFAULT 'COMPLETED',
    "paymentMethod"  "PaymentMethod" NOT NULL,
    "subtotal"       DECIMAL(12,2)   NOT NULL,
    "globalDiscount" DECIMAL(12,2)   NOT NULL DEFAULT 0,
    "totalAmount"    DECIMAL(12,2)   NOT NULL,
    "amountPaid"     DECIMAL(12,2)   NOT NULL,
    "amountDue"      DECIMAL(12,2)   NOT NULL DEFAULT 0,
    "notes"          TEXT,
    "createdAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)    NOT NULL,
    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sales_tenantId_receiptNumber_key" ON "sales"("tenantId", "receiptNumber");
CREATE INDEX "sales_tenantId_storeId_createdAt_idx" ON "sales"("tenantId", "storeId", "createdAt");
CREATE INDEX "sales_customerId_idx" ON "sales"("customerId");

-- CreateTable: sale_items
CREATE TABLE "sale_items" (
    "id"          TEXT          NOT NULL,
    "saleId"      TEXT          NOT NULL,
    "productId"   TEXT          NOT NULL,
    "productName" TEXT          NOT NULL,
    "quantity"    DECIMAL(12,2) NOT NULL,
    "unitPrice"   DECIMAL(12,2) NOT NULL,
    "discount"    DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total"       DECIMAL(12,2) NOT NULL,
    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");

-- CreateTable: suppliers
CREATE TABLE "suppliers" (
    "id"          TEXT         NOT NULL,
    "tenantId"    TEXT         NOT NULL,
    "name"        TEXT         NOT NULL,
    "phone"       TEXT,
    "email"       TEXT,
    "address"     TEXT,
    "contactName" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "suppliers_tenantId_idx" ON "suppliers"("tenantId");

-- CreateTable: purchase_orders
CREATE TABLE "purchase_orders" (
    "id"          TEXT                  NOT NULL,
    "tenantId"    TEXT                  NOT NULL,
    "storeId"     TEXT                  NOT NULL,
    "supplierId"  TEXT                  NOT NULL,
    "orderNumber" TEXT                  NOT NULL,
    "status"      "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DECIMAL(12,2)         NOT NULL,
    "notes"       TEXT,
    "expectedAt"  TIMESTAMP(3),
    "receivedAt"  TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)          NOT NULL,
    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "purchase_orders_tenantId_orderNumber_key" ON "purchase_orders"("tenantId", "orderNumber");
CREATE INDEX "purchase_orders_tenantId_storeId_idx" ON "purchase_orders"("tenantId", "storeId");

-- CreateTable: purchase_order_items
CREATE TABLE "purchase_order_items" (
    "id"               TEXT          NOT NULL,
    "orderId"          TEXT          NOT NULL,
    "productId"        TEXT          NOT NULL,
    "productName"      TEXT          NOT NULL,
    "quantityOrdered"  DECIMAL(12,2) NOT NULL,
    "quantityReceived" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unitPrice"        DECIMAL(12,2) NOT NULL,
    "total"            DECIMAL(12,2) NOT NULL,
    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "purchase_order_items_orderId_idx" ON "purchase_order_items"("orderId");

-- AddForeignKey
ALTER TABLE "users"               ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL;
ALTER TABLE "users"               ADD CONSTRAINT "users_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL;
ALTER TABLE "refresh_tokens"      ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "password_resets"     ADD CONSTRAINT "password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "stores"              ADD CONSTRAINT "stores_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id");
ALTER TABLE "products"            ADD CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id");
ALTER TABLE "stock_entries"       ADD CONSTRAINT "stock_entries_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id");
ALTER TABLE "stock_entries"       ADD CONSTRAINT "stock_entries_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id");
ALTER TABLE "stock_movements"     ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id");
ALTER TABLE "stock_movements"     ADD CONSTRAINT "stock_movements_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id");
ALTER TABLE "stock_movements"     ADD CONSTRAINT "stock_movements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id");
ALTER TABLE "store_transfers"     ADD CONSTRAINT "store_transfers_fromStoreId_fkey" FOREIGN KEY ("fromStoreId") REFERENCES "stores"("id");
ALTER TABLE "store_transfers"     ADD CONSTRAINT "store_transfers_toStoreId_fkey" FOREIGN KEY ("toStoreId") REFERENCES "stores"("id");
ALTER TABLE "store_transfer_items" ADD CONSTRAINT "store_transfer_items_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "store_transfers"("id");
ALTER TABLE "store_transfer_items" ADD CONSTRAINT "store_transfer_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id");
ALTER TABLE "customers"           ADD CONSTRAINT "customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id");
ALTER TABLE "customer_payments"   ADD CONSTRAINT "customer_payments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id");
ALTER TABLE "sales"               ADD CONSTRAINT "sales_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id");
ALTER TABLE "sales"               ADD CONSTRAINT "sales_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id");
ALTER TABLE "sales"               ADD CONSTRAINT "sales_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id");
ALTER TABLE "sales"               ADD CONSTRAINT "sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id");
ALTER TABLE "sale_items"          ADD CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE;
ALTER TABLE "sale_items"          ADD CONSTRAINT "sale_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id");
ALTER TABLE "suppliers"           ADD CONSTRAINT "suppliers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id");
ALTER TABLE "purchase_orders"     ADD CONSTRAINT "purchase_orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id");
ALTER TABLE "purchase_orders"     ADD CONSTRAINT "purchase_orders_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id");
ALTER TABLE "purchase_orders"     ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id");
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE;
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id");
