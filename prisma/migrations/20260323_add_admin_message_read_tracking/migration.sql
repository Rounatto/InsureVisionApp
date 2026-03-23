-- CreateTable AdminMessageRead
CREATE TABLE "AdminMessageRead" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminMessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminMessageRead_messageId_adminEmail_key" ON "AdminMessageRead"("messageId", "adminEmail");

-- CreateIndex
CREATE INDEX "AdminMessageRead_messageId_idx" ON "AdminMessageRead"("messageId");

-- CreateIndex
CREATE INDEX "AdminMessageRead_adminEmail_idx" ON "AdminMessageRead"("adminEmail");

-- AddForeignKey
ALTER TABLE "AdminMessageRead" ADD CONSTRAINT "AdminMessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
