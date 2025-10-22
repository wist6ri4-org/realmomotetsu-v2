/*
  Warnings:

  - Made the column `discord_webhook_url` on table `events` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."events" ALTER COLUMN "discord_webhook_url" SET NOT NULL,
ALTER COLUMN "discord_webhook_url" SET DEFAULT 'https://discord.com/api/webhooks/sample';
