/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { InitServiceImpl } from "@/features/init/service";
import {
    TEST_EVENT_CODE,
    TEST_EVENT_TYPE_CODE,
    buildDocument,
    buildEvent,
    buildEventType,
    buildNearbyStation,
    buildStation,
    buildTeam,
    buildUser,
} from "../../helpers/factories";
import { mockRepositories } from "../../helpers/repositoryMocks";

describe("InitServiceImpl.getDataForInit", () => {
    /** テストで使う共通のUUID */
    const TEST_UUID = "00000000-0000-0000-0000-000000000001";

    /** 各テストで参照するRepositoryのモックメソッド */
    let findByEventCodeWithRelations: jest.Mock;
    let findEventTypeByEventTypeCode: jest.Mock;
    let findTeamsByEventCode: jest.Mock;
    let findStationsByEventTypeCode: jest.Mock;
    let findNearbyStationsByEventTypeCode: jest.Mock;
    let findDocumentsByEventCode: jest.Mock;
    let findByUuid: jest.Mock;

    /** イベント取得の既定値（イベント種別コードの伝播元） */
    const event = { ...buildEvent(), eventType: buildEventType() };

    beforeEach(() => {
        findByEventCodeWithRelations = jest.fn().mockResolvedValue(event);
        findEventTypeByEventTypeCode = jest.fn().mockResolvedValue(buildEventType());
        findTeamsByEventCode = jest.fn().mockResolvedValue([]);
        findStationsByEventTypeCode = jest.fn().mockResolvedValue([]);
        findNearbyStationsByEventTypeCode = jest.fn().mockResolvedValue([]);
        findDocumentsByEventCode = jest.fn().mockResolvedValue([]);
        findByUuid = jest.fn().mockResolvedValue({ ...buildUser(), attendances: [] });

        mockRepositories({
            events: { findByEventCodeWithRelations },
            eventTypes: { findByEventTypeCode: findEventTypeByEventTypeCode },
            teams: { findByEventCode: findTeamsByEventCode },
            stations: { findByEventTypeCode: findStationsByEventTypeCode },
            nearbyStations: { findByEventTypeCode: findNearbyStationsByEventTypeCode },
            documents: { findByEventCode: findDocumentsByEventCode },
            users: { findByUuid },
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("イベントに紐づくイベント種別コードで各Repositoryを呼び出し、結果をまとめて返す", async () => {
        const teams = [buildTeam({ teamCode: "TEAM_A" })];
        const stations = [buildStation({ stationCode: "STATION_A" })];
        const nearbyStations = [buildNearbyStation("STATION_A", "STATION_B", 10)];
        const documents = [buildDocument({ id: 1 })];
        const eventType = buildEventType();
        const user = { ...buildUser({ uuid: TEST_UUID }), attendances: [] };

        findEventTypeByEventTypeCode.mockResolvedValue(eventType);
        findTeamsByEventCode.mockResolvedValue(teams);
        findStationsByEventTypeCode.mockResolvedValue(stations);
        findNearbyStationsByEventTypeCode.mockResolvedValue(nearbyStations);
        findDocumentsByEventCode.mockResolvedValue(documents);
        findByUuid.mockResolvedValue(user);

        const res = await InitServiceImpl.getDataForInit({ eventCode: TEST_EVENT_CODE, uuid: TEST_UUID });

        expect(findByEventCodeWithRelations).toHaveBeenCalledWith(TEST_EVENT_CODE);
        expect(findEventTypeByEventTypeCode).toHaveBeenCalledWith(TEST_EVENT_TYPE_CODE);
        expect(findTeamsByEventCode).toHaveBeenCalledWith(TEST_EVENT_CODE);
        expect(findStationsByEventTypeCode).toHaveBeenCalledWith(TEST_EVENT_TYPE_CODE);
        expect(findNearbyStationsByEventTypeCode).toHaveBeenCalledWith(TEST_EVENT_TYPE_CODE);
        expect(findDocumentsByEventCode).toHaveBeenCalledWith(TEST_EVENT_CODE);
        expect(findByUuid).toHaveBeenCalledWith(TEST_UUID);

        expect(res).toEqual({
            eventType,
            teams,
            stations,
            nearbyStations,
            documents,
            user,
            event,
        });
    });

    it("イベントが見つからない場合は空文字のイベント種別コードで各Repositoryを呼び出す", async () => {
        findByEventCodeWithRelations.mockResolvedValue(null);

        await InitServiceImpl.getDataForInit({ eventCode: TEST_EVENT_CODE, uuid: TEST_UUID });

        expect(findEventTypeByEventTypeCode).toHaveBeenCalledWith("");
        expect(findStationsByEventTypeCode).toHaveBeenCalledWith("");
        expect(findNearbyStationsByEventTypeCode).toHaveBeenCalledWith("");
    });

    it("想定外のエラーはInternalServerErrorに変換される", async () => {
        findByEventCodeWithRelations.mockRejectedValue(new Error("DB connection lost"));

        await expect(
            InitServiceImpl.getDataForInit({ eventCode: TEST_EVENT_CODE, uuid: TEST_UUID }),
        ).rejects.toThrow(InternalServerError);
    });

    it("ApiErrorはそのまま再スローされる", async () => {
        const apiError = new ConflictError({ message: "conflict" });
        findByUuid.mockRejectedValue(apiError);

        await expect(
            InitServiceImpl.getDataForInit({ eventCode: TEST_EVENT_CODE, uuid: TEST_UUID }),
        ).rejects.toBe(apiError);
    });
});
