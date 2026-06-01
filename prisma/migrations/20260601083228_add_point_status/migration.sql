-- AlterEnum
ALTER TYPE "PointStatus" ADD VALUE 'revenue';

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "discord_url" TEXT;
