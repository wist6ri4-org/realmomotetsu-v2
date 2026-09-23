/*
  Warnings:

  - You are about to drop the column `role` on the `attendances` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "role",
ADD COLUMN     "event_role" "Role" NOT NULL DEFAULT 'user';
