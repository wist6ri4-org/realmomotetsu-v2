/*
  Warnings:

  - Added the required column `event_type_code` to the `nearby_stations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "nearby_stations" ADD COLUMN     "event_type_code" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "nearby_stations" ADD CONSTRAINT "nearby_stations_event_type_code_fkey" FOREIGN KEY ("event_type_code") REFERENCES "event_types"("event_type_code") ON DELETE RESTRICT ON UPDATE CASCADE;
