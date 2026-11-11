-- CreateEnum
CREATE TYPE "PreorderStatus" AS ENUM ('NEW', 'CONFIRMED', 'ARRIVED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "preorderEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "preorderNoteUz" TEXT NOT NULL DEFAULT '',
ADD COLUMN "preorderNoteRu" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "Preorder" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "comment" TEXT,
    "status" "PreorderStatus" NOT NULL DEFAULT 'NEW',
    "total" INTEGER NOT NULL,
    "source" "OrderSource" NOT NULL DEFAULT 'WEB',
    "telegramId" BIGINT,
    "telegramUsername" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'uz',
    "notifiedAt" TIMESTAMP(3),
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preorder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreorderItem" (
    "id" TEXT NOT NULL,
    "preorderId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,
    "colorId" TEXT,
    "size" "Size" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "image" TEXT,

    CONSTRAINT "PreorderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Preorder_number_key" ON "Preorder"("number");

-- CreateIndex
CREATE INDEX "Preorder_status_createdAt_idx" ON "Preorder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PreorderItem_preorderId_idx" ON "PreorderItem"("preorderId");

-- CreateIndex
CREATE INDEX "PreorderItem_productId_idx" ON "PreorderItem"("productId");

-- AddForeignKey
ALTER TABLE "PreorderItem" ADD CONSTRAINT "PreorderItem_preorderId_fkey" FOREIGN KEY ("preorderId") REFERENCES "Preorder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreorderItem" ADD CONSTRAINT "PreorderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
