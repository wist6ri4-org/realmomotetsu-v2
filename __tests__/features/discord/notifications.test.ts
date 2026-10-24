/** @jest-environment node */

jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("next/server", () => ({ after: jest.fn() }));
jest.mock("@/features/discord/notify/service", () => ({
    DiscordNotifyServiceImpl: { postDiscordNotify: jest.fn() },
}));
jest.mock("@/lib/realtimeNotifier", () => ({ notifyEventDataChanged: jest.fn() }));

import { after } from "next/server";
import { DiscordNotificationTemplates as Templates } from "@/constants/discordNotificationTemplates";
import { GameConstants } from "@/constants/gameConstants";
import { BombiiHistoriesServiceImpl } from "@/features/bombii-histories/service";
import { CurrentLocationServiceImpl } from "@/features/current-location/service";
import { CurrentLocationV3ServiceImpl } from "@/features/current-location-v3/service";
import { GoalStationsServiceImpl } from "@/features/goal-stations/service";
import { GoalStationsServiceV3Impl } from "@/features/goal-stations-v3/service";
import { DiscordNotifyServiceImpl } from "@/features/discord/notify/service";
import { scheduleCurrentLocationNotifications } from "@/features/discord/notifications";
import { StationGrade, StationType } from "@/generated/prisma";
import { notifyEventDataChanged } from "@/lib/realtimeNotifier";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { Converter } from "@/utils/converter";
import {
    TEST_EVENT_CODE, buildBombiiHistory, buildEvent, buildGoalStation, buildPoints,
    buildPropertyPurchaseWithRelations, buildStation, buildTeam, buildTransitStation,
} from "../../helpers/factories";
import { mockRepositories, mockWithTransaction } from "../../helpers/repositoryMocks";

const request = { eventCode: TEST_EVENT_CODE, teamCode: "TEAM_A", stationCode: "STATION_A" };
const eventUrl = "https://discord.com/api/webhooks/event";
const ownerUrl = "https://discord.com/api/webhooks/owner";
const send = jest.mocked(DiscordNotifyServiceImpl.postDiscordNotify);
const schedule = jest.mocked(after);
const realtime = jest.mocked(notifyEventDataChanged);

describe("登録完了後のDiscord通知", () => {
    let callbacks: Array<() => Promise<void>>;
    let event: ReturnType<typeof buildEvent>;
    let latestGoal: jest.Mock;
    let property: jest.Mock;
    let eventLookup: jest.Mock;
    let stationLookup: jest.Mock;
    let goalCreate: jest.Mock;
    let goalCreateV3: jest.Mock;
    let bombiiCreate: jest.Mock;
    let currentCreate: jest.Mock;
    let pointCreate: jest.Mock;

    const runBackground = async () => {
        for (const callback of callbacks) await callback();
    };

    beforeEach(() => {
        jest.clearAllMocks();
        callbacks = [];
        schedule.mockImplementation((task) => {
            if (typeof task === "function") callbacks.push(async () => { await task(); });
        });
        send.mockResolvedValue({ success: true });
        realtime.mockResolvedValue(undefined);
        jest.spyOn(console, "error").mockImplementation(() => {});
        event = buildEvent({ isNotificationEnabled: true, discordWebhookUrl: eventUrl });
        eventLookup = jest.fn().mockImplementation(async () => event);
        stationLookup = jest.fn().mockResolvedValue(buildStation({ name: "東京", stationType: StationType.mission }));
        latestGoal = jest.fn().mockResolvedValue(buildGoalStation({}, { name: "東京" }));
        property = jest.fn().mockResolvedValue(null);
        goalCreate = jest.fn().mockResolvedValue(buildGoalStation());
        goalCreateV3 = jest.fn().mockResolvedValue(buildGoalStation());
        bombiiCreate = jest.fn().mockResolvedValue(buildBombiiHistory());
        currentCreate = jest.fn().mockResolvedValue({ transitStation: buildTransitStation(), point: buildPoints() });
        pointCreate = jest.fn().mockImplementation(async (eventCode, teamCode, points, status) =>
            buildPoints({ eventCode, teamCode, points, status }));
        mockRepositories({
            events: { findByEventCode: eventLookup },
            stations: { findByStationCode: stationLookup },
            teams: { findByTeamCode: jest.fn().mockResolvedValue(buildTeam({ teamName: "チームA" })) },
            goalStations: { findLatestGoalStation: latestGoal, create: goalCreate, createV3: goalCreateV3 },
            bombiiHistories: { create: bombiiCreate },
            transitStations: { createWithPoints: currentCreate, create: jest.fn().mockResolvedValue(buildTransitStation()) },
            points: { create: pointCreate },
            propertyPurchases: { findByEventCodeAndStationCode: property },
        });
        mockWithTransaction();
    });

    afterEach(() => jest.restoreAllMocks());

    const operations = [
        { name: "目的駅v02", run: () => GoalStationsServiceImpl.postGoalStations(request), template: Templates.REGISTER_GOAL_STATION, variables: { stationName: "東京" } },
        { name: "目的駅v03", run: () => GoalStationsServiceV3Impl.postGoalStationsV3(request), template: Templates.REGISTER_GOAL_STATION, variables: { stationName: "東京" } },
        { name: "ボンビー", run: () => BombiiHistoriesServiceImpl.postBombiiHistories(request), template: Templates.REGISTER_BOMBII, variables: { teamName: "チームA" } },
        { name: "現在地v02", run: () => CurrentLocationServiceImpl.postCurrentLocation({ ...request, points: 10 }), template: Templates.ARRIVAL_GOAL_STATION, variables: { stationName: "東京", teamName: "チームA" } },
        { name: "現在地v03", run: () => CurrentLocationV3ServiceImpl.postCurrentLocationV3(request), template: Templates.ARRIVAL_GOAL_STATION, variables: { stationName: "東京", teamName: "チームA" } },
    ];

    it.each(operations)("$name: 登録後に1回予約し、応答を待つ送信は行わない", async ({ run, template, variables }) => {
        await run();
        expect(schedule).toHaveBeenCalledTimes(1);
        expect(send).not.toHaveBeenCalled();
        // クライアントからの追加リクエストなしに送信する。
        await runBackground();
        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith({ discordWebhookUrl: eventUrl, templateName: template, variables });
    });

    it.each(operations)("$name: DB登録に失敗した場合は予約しない", async ({ run }) => {
        const failure = new Error("write failed");
        goalCreate.mockRejectedValue(failure);
        goalCreateV3.mockRejectedValue(failure);
        bombiiCreate.mockRejectedValue(failure);
        currentCreate.mockRejectedValue(failure);
        jest.spyOn(RepositoryFactory, "withTransaction").mockRejectedValue(failure);
        await expect(run()).rejects.toThrow();
        expect(schedule).not.toHaveBeenCalled();
        expect(send).not.toHaveBeenCalled();
    });

    it.each(operations)("$name: 通知無効の場合は送信しない", async ({ run }) => {
        event.isNotificationEnabled = false;
        await run();
        expect(schedule).not.toHaveBeenCalled();
    });

    it.each(operations)("$name: イベントWebhook未設定の場合は送信しない", async ({ run }) => {
        event.discordWebhookUrl = "";
        await run();
        expect(schedule).not.toHaveBeenCalled();
    });

    it("v02のトランザクション完了までは通知を予約しない", async () => {
        let commit!: (value: { transitStation: ReturnType<typeof buildTransitStation>; point: ReturnType<typeof buildPoints> }) => void;
        currentCreate.mockReturnValue(new Promise((resolve) => { commit = resolve; }));
        const result = CurrentLocationServiceImpl.postCurrentLocation({ ...request, points: 10 });
        expect(schedule).not.toHaveBeenCalled();
        expect(eventLookup).not.toHaveBeenCalled();
        commit({ transitStation: buildTransitStation(), point: buildPoints() });
        await result;
        expect(schedule).toHaveBeenCalledTimes(1);
    });

    it.each([false, true])("v03はトランザクション内の処理完了では通知せず、コミット結果に従う（失敗=%s）", async (failCommit) => {
        let reachedCommit!: () => void;
        const ready = new Promise<void>((resolve) => { reachedCommit = resolve; });
        let commit!: () => void;
        let rollback!: (error: Error) => void;
        const gate = new Promise<void>((resolve, reject) => { commit = resolve; rollback = reject; });
        const tx = mockWithTransaction();
        jest.spyOn(RepositoryFactory, "withTransaction").mockImplementation(async (operation) => {
            const result = await operation(tx);
            reachedCommit();
            await gate;
            return result;
        });
        const result = CurrentLocationV3ServiceImpl.postCurrentLocationV3(request);
        await ready;
        expect(schedule).not.toHaveBeenCalled();
        expect(eventLookup).not.toHaveBeenCalled();
        if (failCommit) {
            rollback(new Error("commit failed"));
            await expect(result).rejects.toThrow();
            expect(schedule).not.toHaveBeenCalled();
        } else {
            commit();
            await result;
            expect(schedule).toHaveBeenCalledTimes(1);
        }
    });

    it.each([null, buildGoalStation({ stationCode: "OTHER" })])("最新目的駅がない・一致しない場合は到着通知しない", async (goal) => {
        latestGoal.mockResolvedValue(goal);
        await CurrentLocationV3ServiceImpl.postCurrentLocationV3(request);
        expect(schedule).not.toHaveBeenCalled();
    });

    const setOtherOwner = () => property.mockResolvedValue(buildPropertyPurchaseWithRelations(
        { teamCode: "TEAM_B" },
        { station: { stationGrade: StationGrade.a }, team: { discordWebhookUrl: ownerUrl } },
    ));

    it("収益ポイント登録失敗時は、経由駅作成後でも通知しない", async () => {
        setOtherOwner();
        pointCreate.mockRejectedValue(new Error("point write failed"));
        await expect(CurrentLocationV3ServiceImpl.postCurrentLocationV3(request)).rejects.toThrow();
        expect(schedule).not.toHaveBeenCalled();
        expect(send).not.toHaveBeenCalled();
    });

    it("収益は登録された金額を所有チームへ通知し、到着通知と両立する", async () => {
        setOtherOwner();
        const result = await CurrentLocationV3ServiceImpl.postCurrentLocationV3(request);
        expect(result).not.toHaveProperty("teamDiscordWebhookUrl");
        expect(result.point?.teamCode).toBe("TEAM_B");
        expect(result.point?.points).toBe(GameConstants.STATION_GRADE.a.price * GameConstants.REVENUE_RATE);
        // 予約後のイベント設定変更や最新目的駅変更で、通知内容をすり替えない。
        event.discordWebhookUrl = "https://discord.com/api/webhooks/changed";
        latestGoal.mockResolvedValue(buildGoalStation({ stationCode: "OTHER" }));
        await runBackground();
        expect(send).toHaveBeenCalledTimes(2);
        expect(send).toHaveBeenCalledWith({
            discordWebhookUrl: ownerUrl,
            templateName: Templates.EARN_REVENUE,
            variables: { stationName: "東京", revenueYen: Converter.convertPointsToYenV3(result.point!.points) },
        });
        expect(send).toHaveBeenCalledWith(expect.objectContaining({ discordWebhookUrl: eventUrl, templateName: Templates.ARRIVAL_GOAL_STATION }));
    });

    it("イベントWebhook未設定でも、所有チームの収益通知は送る", async () => {
        event.discordWebhookUrl = "";
        setOtherOwner();
        await CurrentLocationV3ServiceImpl.postCurrentLocationV3(request);
        await runBackground();
        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith(expect.objectContaining({ discordWebhookUrl: ownerUrl, templateName: Templates.EARN_REVENUE }));
    });

    it.each(["disabled", "own", "no-webhook", "unowned"])("収益通知を送らない条件: %s", async (condition) => {
        latestGoal.mockResolvedValue(null);
        if (condition === "disabled") event.isNotificationEnabled = false;
        if (condition !== "unowned") property.mockResolvedValue(buildPropertyPurchaseWithRelations(
            { teamCode: condition === "own" ? request.teamCode : "TEAM_B" },
            { team: { discordWebhookUrl: condition === "no-webhook" ? null : ownerUrl } },
        ));
        await CurrentLocationV3ServiceImpl.postCurrentLocationV3(request);
        expect(schedule).not.toHaveBeenCalled();
    });

    it.each([StationType.plus, StationType.minus])("%s駅のポイントだけでは収益通知を送らない", async (stationType) => {
        latestGoal.mockResolvedValue(null);
        stationLookup.mockResolvedValue(buildStation({ stationType, stationGrade: StationGrade.a }));
        await CurrentLocationV3ServiceImpl.postCurrentLocationV3(request);
        expect(schedule).not.toHaveBeenCalled();
    });

    it("通知設定取得失敗でも登録結果は成功する", async () => {
        eventLookup.mockRejectedValue(new Error("settings unavailable"));
        await expect(GoalStationsServiceImpl.postGoalStations(request)).resolves.toHaveProperty("goalStation");
        expect(schedule).not.toHaveBeenCalled();
    });

    it("到着通知の準備失敗でも収益通知は送る", async () => {
        setOtherOwner();
        latestGoal.mockRejectedValue(new Error("goal unavailable"));
        await expect(CurrentLocationV3ServiceImpl.postCurrentLocationV3(request)).resolves.toHaveProperty("transitStation");
        await runBackground();
        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith(expect.objectContaining({ templateName: Templates.EARN_REVENUE }));
    });

    it("予約失敗でも登録結果は成功する", async () => {
        schedule.mockImplementationOnce(() => { throw new Error("after unavailable"); });
        await expect(GoalStationsServiceImpl.postGoalStations(request)).resolves.toHaveProperty("goalStation");
    });

    it.each(["result", "exception"])("送信失敗を隔離し、他の通知を送る: %s", async (failure) => {
        setOtherOwner();
        await CurrentLocationV3ServiceImpl.postCurrentLocationV3(request);
        if (failure === "result") send.mockResolvedValueOnce({ success: false });
        else send.mockRejectedValueOnce(new Error("Discord unavailable"));
        await expect(runBackground()).resolves.toBeUndefined();
        expect(send).toHaveBeenCalledTimes(2);
        expect(console.error).toHaveBeenCalled();
    });

    it("コミット後のRealtime失敗で応答がエラーになっても予約済み通知は実行する", async () => {
        realtime.mockRejectedValueOnce(new Error("response path failed"));
        await expect(GoalStationsServiceImpl.postGoalStations(request)).rejects.toThrow();
        await runBackground();
        expect(send).toHaveBeenCalledTimes(1);
    });

    it("登録額が0でも、ポイントレコードが存在すれば現行条件どおり通知する", async () => {
        latestGoal.mockResolvedValue(null);
        await scheduleCurrentLocationNotifications(request, { discordWebhookUrl: ownerUrl, points: 0, stationName: "東京" });
        await runBackground();
        expect(send).toHaveBeenCalledWith(expect.objectContaining({ variables: { stationName: "東京", revenueYen: "0 万" } }));
    });
});
