/*
  Warnings:

  - Made the column `english_name` on table `stations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "stations" ALTER COLUMN "english_name" SET NOT NULL;
