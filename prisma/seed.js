import { PrismaClient } from "../src/generated/prisma/index.js";
import fs from "fs";
import { join } from "path";
import csv from "csv-parser";

const prisma = new PrismaClient();

const csvEventTypesPath = join(process.cwd(), "./prisma/csv/event_types.csv");
const csvStationsPath = join(process.cwd(), "./prisma/csv/stations.csv");
const csvEventsPath = join(process.cwd(), "./prisma/csv/events.csv");
const csvTeamsPath = join(process.cwd(), "./prisma/csv/teams.csv");
const csvPointsPath = join(process.cwd(), "./prisma/csv/points.csv");
const csvNearbyStationsPath = join(process.cwd(), "./prisma/csv/nearby_stations.csv");
const csvGoalStationsPath = join(process.cwd(), "./prisma/csv/goal_stations.csv");
const csvTransitStationsPath = join(process.cwd(), "./prisma/csv/transit_stations.csv");
const csvBombiiHistoriesPath = join(process.cwd(), "./prisma/csv/bombii_histories.csv");
const csvDocumentsPath = join(process.cwd(), "./prisma/csv/documents.csv");
const csvAttendancesPath = join(process.cwd(), "./prisma/csv/attendances.csv");

// CSVを読み込む関数
function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", () => resolve(results))
            .on("error", reject);
    });
}

async function main() {
    try {
        console.log("🌱 データベースのシードを開始します...");

        // 依存関係を考慮して逆順で削除
        console.log("🗑️ 既存データを削除中...");
        await prisma.attendances.deleteMany({});
        await prisma.documents.deleteMany({});
        await prisma.bombiiHistories.deleteMany({});
        await prisma.transitStations.deleteMany({});
        await prisma.goalStations.deleteMany({});
        await prisma.points.deleteMany({});
        await prisma.nearbyStations.deleteMany({});
        await prisma.teams.deleteMany({});
        await prisma.events.deleteMany({});
        await prisma.stations.deleteMany({});
        await prisma.eventTypes.deleteMany({});

        // autoincrementシーケンスをリセット
        console.log("🔄 IDシーケンスをリセット中...");
        await prisma.$executeRaw`ALTER SEQUENCE event_types_id_seq RESTART WITH 1;`;
        await prisma.$executeRaw`ALTER SEQUENCE stations_id_seq RESTART WITH 1;`;
        await prisma.$executeRaw`ALTER SEQUENCE events_id_seq RESTART WITH 1;`;
        await prisma.$executeRaw`ALTER SEQUENCE teams_id_seq RESTART WITH 1;`;
        await prisma.$executeRaw`ALTER SEQUENCE nearby_stations_id_seq RESTART WITH 1;`;
        await prisma.$executeRaw`ALTER SEQUENCE points_id_seq RESTART WITH 1;`;
        await prisma.$executeRaw`ALTER SEQUENCE goal_stations_id_seq RESTART WITH 1;`;
        await prisma.$executeRaw`ALTER SEQUENCE transit_stations_id_seq RESTART WITH 1;`;
        await prisma.$executeRaw`ALTER SEQUENCE bombii_histories_id_seq RESTART WITH 1;`;
        await prisma.$executeRaw`ALTER SEQUENCE documents_id_seq RESTART WITH 1;`;
        await prisma.$executeRaw`ALTER SEQUENCE attendances_id_seq RESTART WITH 1;`;

        // 1. EventTypesを挿入
        console.log("📊 EventTypesを挿入中...");
        const eventTypesData = await readCSV(csvEventTypesPath);
        for (const row of eventTypesData) {
            const eventTypeCode = row.event_type_code?.trim();
            const description = row.description?.trim();
            const createdAt = new Date(row.created_at?.trim());
            const updatedAt = new Date(row.updated_at?.trim());

            await prisma.eventTypes.create({
                data: { eventTypeCode, description, createdAt, updatedAt },
            });
        }
        console.log(`✅ ${eventTypesData.length}件のEventTypesを挿入しました`);

        // 2. Stationsを挿入
        console.log("🚉 Stationsを挿入中...");
        const stationsData = await readCSV(csvStationsPath);
        for (const row of stationsData) {
            const stationCode = row.station_code?.trim();
            const name = row.name?.trim();
            const isMissionSet = row.is_mission_set?.trim() === "TRUE";
            const kana = row.kana?.trim();
            const latitude = parseFloat(row.latitude?.trim()) || null;
            const longitude = parseFloat(row.longitude?.trim()) || null;
            const eventTypeCode = row.event_type_code?.trim();

            await prisma.stations.create({
                data: {
                    stationCode,
                    name,
                    isMissionSet,
                    kana,
                    latitude,
                    longitude,
                    eventTypeCode,
                },
            });
        }
        console.log(`✅ ${stationsData.length}件のStationsを挿入しました`);

        // 3. Eventsを挿入
        console.log("📅 Eventsを挿入中...");
        const eventsData = await readCSV(csvEventsPath);
        for (const row of eventsData) {
            const eventCode = row.event_code?.trim();
            const eventName = row.event_name?.trim();
            const eventTypeCode = row.event_type_code?.trim();
            const startDate = new Date(row.start_date?.trim());
            const createdAt = new Date(row.created_at?.trim());
            const updatedAt = new Date(row.updated_at?.trim());

            await prisma.events.create({
                data: {
                    eventCode,
                    eventName,
                    eventTypeCode,
                    startDate,
                    createdAt,
                    updatedAt,
                },
            });
        }
        console.log(`✅ ${eventsData.length}件のEventsを挿入しました`);

        // 4. Teamsを挿入
        console.log("👥 Teamsを挿入中...");
        const teamsData = await readCSV(csvTeamsPath);
        for (const row of teamsData) {
            const teamCode = row.team_code?.trim();
            const teamName = row.team_name?.trim();
            const teamColor = row.team_color?.trim() || null;
            const eventCode = row.event_code?.trim();
            const createdAt = new Date(row.created_at?.trim());
            const updatedAt = new Date(row.updated_at?.trim());

            await prisma.teams.create({
                data: {
                    teamCode,
                    teamName,
                    teamColor,
                    eventCode,
                    createdAt,
                    updatedAt,
                },
            });
        }
        console.log(`✅ ${teamsData.length}件のTeamsを挿入しました`);

        // 5. NearbyStationsを挿入
        console.log("🔄 NearbyStationsを挿入中...");
        const nearbyStationsData = await readCSV(csvNearbyStationsPath);
        for (const row of nearbyStationsData) {
            const fromStationCode = row.from_station_code?.trim();
            const toStationCode = row.to_station_code?.trim();
            const timeMinutes = parseInt(row.time_minutes?.trim(), 10) || 0;
            const createdAt = new Date(row.created_at?.trim());
            const updatedAt = new Date(row.updated_at?.trim());
            const eventTypeCode = row.event_type_code?.trim();

            await prisma.nearbyStations.create({
                data: {
                    fromStationCode,
                    toStationCode,
                    timeMinutes,
                    createdAt,
                    updatedAt,
                    eventTypeCode,
                },
            });
        }
        console.log(`✅ ${nearbyStationsData.length}件のNearbyStationsを挿入しました`);

        // 6. Pointsを挿入
        console.log("💰 Pointsを挿入中...");
        const pointsData = await readCSV(csvPointsPath);
        for (const row of pointsData) {
            const teamCode = row.team_code?.trim();
            const eventCode = row.event_code?.trim();
            const points = parseInt(row.points?.trim(), 10) || 0;
            const status = row.status?.trim() || "points";
            const createdAt = new Date(row.created_at?.trim());
            const updatedAt = new Date(row.updated_at?.trim());

            await prisma.points.create({
                data: {
                    teamCode,
                    eventCode,
                    points,
                    status,
                    createdAt,
                    updatedAt,
                },
            });
        }
        console.log(`✅ ${pointsData.length}件のPointsを挿入しました`);

        // 7. GoalStationsを挿入
        console.log("🎯 GoalStationsを挿入中...");
        const goalStationsData = await readCSV(csvGoalStationsPath);
        for (const row of goalStationsData) {
            const stationCode = row.station_code?.trim();
            const eventCode = row.event_code?.trim();
            const createdAt = new Date(row.created_at?.trim());
            const updatedAt = new Date(row.updated_at?.trim());

            await prisma.goalStations.create({
                data: {
                    stationCode,
                    eventCode,
                    createdAt,
                    updatedAt,
                },
            });
        }
        console.log(`✅ ${goalStationsData.length}件のGoalStationsを挿入しました`);

        // 8. TransitStationsを挿入
        console.log("🚏 TransitStationsを挿入中...");
        const transitStationsData = await readCSV(csvTransitStationsPath);
        for (const row of transitStationsData) {
            const teamCode = row.team_code?.trim();
            const stationCode = row.station_code?.trim();
            const eventCode = row.event_code?.trim();
            const createdAt = new Date(row.created_at?.trim());
            const updatedAt = new Date(row.updated_at?.trim());

            await prisma.transitStations.create({
                data: {
                    teamCode,
                    stationCode,
                    eventCode,
                    createdAt,
                    updatedAt,
                },
            });
        }
        console.log(`✅ ${transitStationsData.length}件のTransitStationsを挿入しました`);

        // 9. BombiiHistoriesを挿入
        console.log("💣 BombiiHistoriesを挿入中...");
        const bombiiHistoriesData = await readCSV(csvBombiiHistoriesPath);
        for (const row of bombiiHistoriesData) {
            const teamCode = row.team_code?.trim();
            const eventCode = row.event_code?.trim();
            const createdAt = new Date(row.created_at?.trim());
            const updatedAt = new Date(row.updated_at?.trim());

            await prisma.bombiiHistories.create({
                data: {
                    teamCode,
                    eventCode,
                    createdAt,
                    updatedAt,
                },
            });
        }
        console.log(`✅ ${bombiiHistoriesData.length}件のBombiiHistoriesを挿入しました`);

        // 10. Documentsを挿入
        console.log("📝 Documentsを挿入中...");
        const documentsData = await readCSV(csvDocumentsPath);
        for (const row of documentsData) {
            const name = row.name?.trim();
            const url = row.url?.trim();
            const eventCode = row.event_code?.trim();
            const createdAt = new Date(row.created_at?.trim());
            const updatedAt = new Date(row.updated_at?.trim());

            await prisma.documents.create({
                data: {
                    name,
                    url,
                    eventCode,
                    createdAt,
                    updatedAt,
                },
            });
        }
        console.log(`✅ ${documentsData.length}件のDocumentsを挿入しました`);

        // 11. Attendancesを挿入
        console.log("👥 Attendancesを挿入中...");
        const attendancesData = await readCSV(csvAttendancesPath);
        for (const row of attendancesData) {
            const eventCode = row.event_code?.trim();
            const userId = parseInt(row.user_id?.trim(), 10);
            const role = row.role?.trim() || "user";
            const createdAt = new Date(row.created_at?.trim());
            const updatedAt = new Date(row.updated_at?.trim());

            await prisma.attendances.create({
                data: {
                    eventCode,
                    userId,
                    role,
                    createdAt,
                    updatedAt,
                },
            });
        }
        console.log(`✅ ${attendancesData.length}件のAttendancesを挿入しました`);

        console.log("🎉 すべてのシードデータの挿入が完了しました！");
    } catch (error) {
        console.error("❌ シード処理中にエラーが発生しました:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
