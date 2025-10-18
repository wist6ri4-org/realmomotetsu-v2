-- AlterTable
ALTER TABLE "public"."events" ADD COLUMN     "discord_webhook_url" TEXT,
ADD COLUMN     "is_notification_enabled" BOOLEAN NOT NULL DEFAULT false;
