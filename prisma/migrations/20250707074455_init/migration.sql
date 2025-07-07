-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "event_code" TEXT NOT NULL,
    "event_type_code" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_types" (
    "id" SERIAL NOT NULL,
    "event_type_code" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations" (
    "id" SERIAL NOT NULL,
    "station_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kana" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_mission_set" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nearby_stations" (
    "id" SERIAL NOT NULL,
    "from_station_code" TEXT NOT NULL,
    "to_station_code" TEXT NOT NULL,
    "time_minutes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nearby_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" SERIAL NOT NULL,
    "team_code" TEXT NOT NULL,
    "team_name" TEXT NOT NULL,
    "team_color" TEXT,
    "event_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_stations" (
    "id" SERIAL NOT NULL,
    "station_code" TEXT NOT NULL,
    "event_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transit_stations" (
    "id" SERIAL NOT NULL,
    "station_code" TEXT NOT NULL,
    "event_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transit_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bombii_histories" (
    "id" SERIAL NOT NULL,
    "team_code" TEXT NOT NULL,
    "event_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bombii_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_event_code_key" ON "events"("event_code");

-- CreateIndex
CREATE UNIQUE INDEX "event_types_event_type_code_key" ON "event_types"("event_type_code");

-- CreateIndex
CREATE UNIQUE INDEX "stations_station_code_key" ON "stations"("station_code");

-- CreateIndex
CREATE UNIQUE INDEX "teams_team_code_key" ON "teams"("team_code");

-- CreateIndex
CREATE UNIQUE INDEX "teams_team_name_key" ON "teams"("team_name");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_event_type_code_fkey" FOREIGN KEY ("event_type_code") REFERENCES "event_types"("event_type_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nearby_stations" ADD CONSTRAINT "nearby_stations_from_station_code_fkey" FOREIGN KEY ("from_station_code") REFERENCES "stations"("station_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nearby_stations" ADD CONSTRAINT "nearby_stations_to_station_code_fkey" FOREIGN KEY ("to_station_code") REFERENCES "stations"("station_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_event_code_fkey" FOREIGN KEY ("event_code") REFERENCES "events"("event_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_stations" ADD CONSTRAINT "goal_stations_event_code_fkey" FOREIGN KEY ("event_code") REFERENCES "events"("event_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_stations" ADD CONSTRAINT "goal_stations_station_code_fkey" FOREIGN KEY ("station_code") REFERENCES "stations"("station_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transit_stations" ADD CONSTRAINT "transit_stations_event_code_fkey" FOREIGN KEY ("event_code") REFERENCES "events"("event_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transit_stations" ADD CONSTRAINT "transit_stations_station_code_fkey" FOREIGN KEY ("station_code") REFERENCES "stations"("station_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bombii_histories" ADD CONSTRAINT "bombii_histories_event_code_fkey" FOREIGN KEY ("event_code") REFERENCES "events"("event_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bombii_histories" ADD CONSTRAINT "bombii_histories_team_code_fkey" FOREIGN KEY ("team_code") REFERENCES "teams"("team_code") ON DELETE RESTRICT ON UPDATE CASCADE;
