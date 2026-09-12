/*
  Warnings:

  - Added the required column `team_code` to the `attendances` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "team_code" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_team_code_fkey" FOREIGN KEY ("team_code") REFERENCES "teams"("team_code") ON DELETE RESTRICT ON UPDATE CASCADE;
