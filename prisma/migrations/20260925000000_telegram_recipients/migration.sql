-- CreateTable
CREATE TABLE "TelegramRecipient" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "chatId" BIGINT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramRecipient_username_key" ON "TelegramRecipient"("username");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramRecipient_chatId_key" ON "TelegramRecipient"("chatId");
