import { PrismaClient } from "../src/generated/prisma/index.js";
import fs from "fs";
import { join } from "path";
import csv from "csv-parser";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

// Supabaseクライアント（サービスロールキー使用）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
const csvAuthenticationPath = join(process.cwd(), "./prisma/csv/authentication.csv");
const usersPath = join(process.cwd(), "./prisma/csv/users.csv");
const viewsSqlPath = join(process.cwd(), "./supabase/sql/views.sql");

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

// SQLファイルを読み込んで実行する関数
async function executeSQLFile(filePath) {
    try {
        console.log(`📄 SQLファイルを実行中: ${filePath}`);
        const sqlContent = fs.readFileSync(filePath, "utf8");

        // SQLファイルの内容を適切に分割して、各SQL文を実行
        // コメントを除去してから処理
        const cleanedContent = sqlContent
            .split("\n")
            .filter((line) => !line.trim().startsWith("--") && line.trim().length > 0)
            .join("\n");

        const sqlStatements = cleanedContent
            .split(";")
            .map((statement) => statement.trim())
            .filter((statement) => statement.length > 0);

        for (const statement of sqlStatements) {
            if (statement.trim()) {
                console.log(`  実行中: ${statement.substring(0, 50)}...`);
                try {
                    // 既存のビューを削除してから作成（CREATE OR REPLACE VIEWの代替）
                    if (statement.toUpperCase().includes("CREATE VIEW")) {
                        const viewNameMatch = statement.match(/CREATE\s+VIEW\s+(\w+)/i);
                        if (viewNameMatch) {
                            const viewName = viewNameMatch[1];
                            try {
                                await prisma.$executeRawUnsafe(`DROP VIEW IF EXISTS ${viewName}`);
                                console.log(`  🗑️ 既存のビュー ${viewName} を削除しました`);
                            } catch {
                                // ビューが存在しない場合のエラーは無視
                                console.log(`  ℹ️ ビュー ${viewName} は存在しませんでした`);
                            }
                        }
                    }

                    await prisma.$executeRawUnsafe(statement);
                    console.log(`  ✅ SQL文を実行しました`);
                } catch (sqlError) {
                    console.error(`  ❌ SQL実行エラー: ${statement}`, sqlError.message);
                    // エラーがあってもシードを続行
                }
            }
        }
        console.log(`✅ SQLファイルの実行が完了しました: ${filePath}`);
    } catch (error) {
        console.error(`❌ SQLファイルの実行中にエラーが発生しました: ${filePath}`, error);
        // エラーがあってもシードを続行
    }
}

async function main() {
    try {
        console.log("🌱 データベースのシードを開始します...");

        // 認証ユーザーUUIDを格納するマップ
        const authUserMap = new Map();

        // 0-1. 既存のAuthenticationユーザーを全削除
        console.log("🗑️ 既存のAuthenticationユーザーを削除中...");
        try {
            const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

            if (listError) {
                console.error("❌ ユーザー一覧取得に失敗:", listError.message);
            } else if (existingUsers && existingUsers.users.length > 0) {
                console.log(`🔍 ${existingUsers.users.length}件のユーザーが見つかりました`);

                for (const user of existingUsers.users) {
                    try {
                        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
                        if (deleteError) {
                            console.error(`❌ ユーザー ${user.email} の削除に失敗:`, deleteError.message);
                        } else {
                            console.log(`✅ ユーザー ${user.email} を削除しました`);
                        }
                    } catch (error) {
                        console.error(`❌ ユーザー ${user.email} の削除中にエラー:`, error.message);
                    }
                }
            } else {
                console.log("ℹ️ 削除対象のユーザーはありませんでした");
            }
        } catch (error) {
            console.error("❌ 認証ユーザー削除処理中にエラー:", error.message);
        }

        // 0-2. Authenticationユーザーを作成
        console.log("🔐 Authenticationユーザーを作成中...");
        const authenticationData = await readCSV(csvAuthenticationPath);
        for (const row of authenticationData) {
            const email = row.mail?.trim();
            const password = row.pass?.trim();
            const userId = row.id?.trim();

            if (email && password) {
                try {
                    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                        email,
                        password,
                        user_metadata: {
                            custom_id: userId,
                        },
                        email_confirm: true, // 自動でメール確認済みにする
                    });

                    if (authError) {
                        console.error(`❌ ユーザー ${email} の作成に失敗:`, authError.message);
                    } else {
                        // custom_id → Supabase UUIDのマッピングを保存
                        authUserMap.set(userId, authData.user.id);
                        console.log(`✅ ユーザー ${email} を作成しました（ID: ${authData.user.id}）`);
                        console.log(`   🏷️  Custom ID: ${userId} → Supabase UUID: ${authData.user.id}`);
                    }
                } catch (error) {
                    console.error(`❌ ユーザー ${email} の作成中にエラー:`, error.message);
                }
            }
        }
        console.log(`✅ ${authenticationData.length}件のAuthenticationユーザーを処理しました`);

        // 依存関係を考慮して逆順で削除
        console.log("🗑️ 既存のPrismaデータを削除中...");
        console.log("  📋 attendancesテーブルを削除中...");
        await prisma.attendances.deleteMany({});
        console.log("  📄 documentsテーブルを削除中...");
        await prisma.documents.deleteMany({});
        console.log("  💣 bombiiHistoriesテーブルを削除中...");
        await prisma.bombiiHistories.deleteMany({});
        console.log("  🚏 transitStationsテーブルを削除中...");
        await prisma.transitStations.deleteMany({});
        console.log("  🎯 goalStationsテーブルを削除中...");
        await prisma.goalStations.deleteMany({});
        console.log("  💰 pointsテーブルを削除中...");
        await prisma.points.deleteMany({});
        console.log("  🔄 nearbyStationsテーブルを削除中...");
        await prisma.nearbyStations.deleteMany({});
        console.log("  👥 teamsテーブルを削除中...");
        await prisma.teams.deleteMany({});
        console.log("  📅 eventsテーブルを削除中...");
        await prisma.events.deleteMany({});
        console.log("  🚉 stationsテーブルを削除中...");
        await prisma.stations.deleteMany({});
        console.log("  📊 eventTypesテーブルを削除中...");
        await prisma.eventTypes.deleteMany({});
        console.log("  👤 usersテーブルを削除中...");
        await prisma.users.deleteMany({});
        console.log("✅ 全てのPrismaデータを削除しました");

        // autoincrementシーケンスをリセット
        console.log("🔄 IDシーケンスをリセット中...");
        await prisma.$executeRaw`ALTER SEQUENCE users_id_seq RESTART WITH 1;`;
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
        console.log("✅ 全てのIDシーケンスをリセットしました");

        // 0. usersを挿入
        console.log("👤 Usersを挿入中...");
        const usersData = await readCSV(usersPath);
        for (const row of usersData) {
            const originalUuid = row.uuid?.trim();
            const nickname = row.nickname?.trim();
            const email = row.email?.trim();
            const masterRole = row.master_role?.trim() || "user";
            const createdAtStr = row.created_at?.trim();
            const createdAt = createdAtStr && createdAtStr !== "" ? new Date(createdAtStr) : new Date();
            const updatedAtStr = row.updated_at?.trim();
            const updatedAt = updatedAtStr && updatedAtStr !== "" ? new Date(updatedAtStr) : new Date();

            // authUserMapから対応するSupabase UUIDを取得
            const dynamicUuid = authUserMap.get(originalUuid);
            const finalUuid = dynamicUuid || originalUuid;

            await prisma.users.create({
                data: { uuid: finalUuid, nickname, email, masterRole, createdAt, updatedAt },
            });

            if (dynamicUuid) {
                console.log(`   🔄 User ID ${nickname}: ${originalUuid} → ${dynamicUuid}`);
            } else {
                console.log(`   ℹ️  User ID ${nickname}: UUID ${originalUuid} (変換なし)`);
            }
        }
        console.log(`✅ ${usersData.length}件のUsersを挿入しました`);

        // 1. EventTypesを挿入
        console.log("📊 EventTypesを挿入中...");
        const eventTypesData = await readCSV(csvEventTypesPath);
        for (const row of eventTypesData) {
            const eventTypeCode = row.event_type_code?.trim();
            const description = row.description?.trim();
            const routemapConfigFile = row.routemap_config?.trim() || null;
            const createdAt = new Date(row.created_at?.trim());
            const updatedAt = new Date(row.updated_at?.trim());

            await prisma.eventTypes.create({
                data: { eventTypeCode, description, routemapConfigFile, createdAt, updatedAt },
            });
        }
        console.log(`✅ ${eventTypesData.length}件のEventTypesを挿入しました`);

        // 2. Stationsを挿入
        console.log("🚉 Stationsを挿入中...");
        const stationsData = await readCSV(csvStationsPath);
        for (const row of stationsData) {
            const stationCode = row.station_code?.trim();
            const name = row.name?.trim();
            const isMissionSet = ["true", "TRUE"].includes(row.is_mission_set?.trim());
            const kana = row.kana?.trim();
            const englishName = row.english_name?.trim();
            const latitude = parseFloat(row.latitude?.trim()) || null;
            const longitude = parseFloat(row.longitude?.trim()) || null;
            const eventTypeCode = row.event_type_code?.trim();

            await prisma.stations.create({
                data: {
                    stationCode,
                    name,
                    isMissionSet,
                    kana,
                    englishName,
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
            const startDateStr = row.start_date?.trim();
            const startDate = startDateStr && startDateStr !== "" ? new Date(startDateStr) : null;
            const visibilityLevel = row.visibility_level?.trim() || "admin";
            const operationLevel = row.operation_level?.trim() || "admin";
            const discordWebhookUrl = row.discord_webhook_url?.trim() || null;
            const isNotificationEnabled = ["true", "TRUE"].includes(row.isNotificationEnabled?.trim());
            const createdAt = new Date(row.created_at?.trim());
            const updatedAt = new Date(row.updated_at?.trim());

            await prisma.events.create({
                data: {
                    eventCode,
                    eventName,
                    eventTypeCode,
                    startDate,
                    visibilityLevel,
                    operationLevel,
                    discordWebhookUrl,
                    isNotificationEnabled,
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
            const eventRole = row.event_role?.trim() || "user";
            const teamCode = row.team_code?.trim();
            const createdAt = new Date(row.created_at?.trim());
            const updatedAt = new Date(row.updated_at?.trim());

            await prisma.attendances.create({
                data: {
                    eventCode,
                    userId,
                    eventRole,
                    teamCode,
                    createdAt,
                    updatedAt,
                },
            });
        }
        console.log(`✅ ${attendancesData.length}件のAttendancesを挿入しました`);

        // 12. ビューを作成
        console.log("🔧 データベースビューを作成中...");
        await executeSQLFile(viewsSqlPath);

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
