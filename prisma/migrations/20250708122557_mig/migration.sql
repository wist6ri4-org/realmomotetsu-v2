-- CreateEnum
CREATE TYPE "PointStatus" AS ENUM ('points', 'scored');

-- CreateTable
CREATE TABLE "points" (
    "id" SERIAL NOT NULL,
    "team_code" TEXT NOT NULL,
    "event_code" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "status" "PointStatus" NOT NULL DEFAULT 'points',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "points" ADD CONSTRAINT "points_event_code_fkey" FOREIGN KEY ("event_code") REFERENCES "events"("event_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points" ADD CONSTRAINT "points_team_code_fkey" FOREIGN KEY ("team_code") REFERENCES "teams"("team_code") ON DELETE RESTRICT ON UPDATE CASCADE;
