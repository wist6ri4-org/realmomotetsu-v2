-- CreateEnum
CREATE TYPE "public"."VisibilityLevel" AS ENUM ('hidden', 'admin', 'organizer', 'participant');

-- CreateEnum
CREATE TYPE "public"."OperationLevel" AS ENUM ('readonly', 'admin', 'organizer', 'participant');

-- AlterTable
ALTER TABLE "public"."events" ADD COLUMN     "operation_level" "public"."OperationLevel" NOT NULL DEFAULT 'readonly',
ADD COLUMN     "visibility_level" "public"."VisibilityLevel" NOT NULL DEFAULT 'hidden';
