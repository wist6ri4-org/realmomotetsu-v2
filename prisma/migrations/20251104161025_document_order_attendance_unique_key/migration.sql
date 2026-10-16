/*
  Warnings:

  - A unique constraint covering the columns `[user_id,event_code]` on the table `attendances` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."documents" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "attendances_user_id_event_code_key" ON "public"."attendances"("user_id", "event_code");
