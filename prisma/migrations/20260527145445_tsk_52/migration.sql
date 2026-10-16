-- CreateEnum
CREATE TYPE "StationGrade" AS ENUM ('none', 'a', 'b', 'c');

-- AlterEnum
ALTER TYPE "PointStatus" ADD VALUE 'property';

-- AlterTable
ALTER TABLE "stations" ADD COLUMN     "station_grade" "StationGrade" DEFAULT 'none';
