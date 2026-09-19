-- CreateEnum
CREATE TYPE "StationType" AS ENUM ('mission', 'plus', 'minus', 'treasure', 'card');

-- AlterTable
ALTER TABLE "event_types" ADD COLUMN     "version" INTEGER DEFAULT 100;

-- AlterTable
ALTER TABLE "stations" ADD COLUMN     "station_type" "StationType";

-- CreateTable
CREATE TABLE "property_purchases" (
    "id" SERIAL NOT NULL,
    "event_code" TEXT NOT NULL,
    "team_code" TEXT NOT NULL,
    "station_code" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_purchases_event_code_station_code_key" ON "property_purchases"("event_code", "station_code");

-- AddForeignKey
ALTER TABLE "property_purchases" ADD CONSTRAINT "property_purchases_event_code_fkey" FOREIGN KEY ("event_code") REFERENCES "events"("event_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_purchases" ADD CONSTRAINT "property_purchases_team_code_fkey" FOREIGN KEY ("team_code") REFERENCES "teams"("team_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_purchases" ADD CONSTRAINT "property_purchases_station_code_fkey" FOREIGN KEY ("station_code") REFERENCES "stations"("station_code") ON DELETE RESTRICT ON UPDATE CASCADE;
