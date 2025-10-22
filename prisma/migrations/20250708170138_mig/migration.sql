/*
  Warnings:

  - Added the required column `team_code` to the `transit_stations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transit_stations" ADD COLUMN     "team_code" TEXT NOT NULL;
