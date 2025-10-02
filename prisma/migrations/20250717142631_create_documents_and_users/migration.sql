-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateTable
CREATE TABLE
    "documents" (
        "id" SERIAL NOT NULL,
        "name" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "event_code" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
    );

-- CreateTable
CREATE TABLE
    "users" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "nickname" TEXT,
        "icon_url" TEXT,
        "role" "Role" NOT NULL DEFAULT 'user',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
    );

-- CreateTable
CREATE TABLE
    "attendances" (
        "id" SERIAL NOT NULL,
        "user_id" TEXT NOT NULL,
        "event_code" TEXT NOT NULL,
        "role" "Role" NOT NULL DEFAULT 'user',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
    );

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_event_code_fkey" FOREIGN KEY ("event_code") REFERENCES "events" ("event_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_event_code_fkey" FOREIGN KEY ("event_code") REFERENCES "events" ("event_code") ON DELETE RESTRICT ON UPDATE CASCADE;