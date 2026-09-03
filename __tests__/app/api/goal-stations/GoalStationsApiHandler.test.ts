/**
 * @jest-environment node
 */

import { StatusCode } from "@/constants/statuscode";
import { BadRequestError, ConflictError, ResourceNotFoundError } from "@/error";
import { TEST_EVENT_CODE, buildGoalStation } from "../../../helpers/factories";
import {
    buildGetRequest,
    buildPostRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../helpers/apiRequest";

// GoalStationsApiHandlerはGoalStationsServiceImplを直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/goal-stations/service", () => ({
    GoalStationsServiceImpl: {
        getGoalStationsByEventCode: jest.fn(),
        postGoalStations: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GoalStationsServiceImpl } = jest.requireMock("@/features/goal-stations/service") as {
    GoalStationsServiceImpl: {
        getGoalStationsByEventCode: jest.Mock;
        postGoalStations: jest.Mock;
    };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import GoalStationsApiHandler from "@/app/api/goal-stations/GoalStationsApiHandler";

describe("GoalStationsApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        GoalStationsServiceImpl.getGoalStationsByEventCode.mockReset();
        GoalStationsServiceImpl.postGoalStations.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("GET", () => {
        it("イベントコードをServiceに渡し、目的駅一覧を返す", async () => {
            const goalStations = [buildGoalStation({ stationCode: "STATION_A" })];
            GoalStationsServiceImpl.getGoalStationsByEventCode.mockResolvedValue({ goalStations });

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new GoalStationsApiHandler(req).handle());

            expect(GoalStationsServiceImpl.getGoalStationsByEventCode).toHaveBeenCalledWith({
                eventCode: TEST_EVENT_CODE,
            });
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it("eventCodeが欠けている場合は400を返す", async () => {
            const req = buildGetRequest({});
            const { status, body } = await readResponse(await new GoalStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
            expect(GoalStationsServiceImpl.getGoalStationsByEventCode).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合は対応するステータスコードを返す", async () => {
            GoalStationsServiceImpl.getGoalStationsByEventCode.mockRejectedValue(
                new ResourceNotFoundError("Event", TEST_EVENT_CODE),
            );

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new GoalStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.NOT_FOUND);
            expect(body.errorCode).toBe("RESOURCE_NOT_FOUND");
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            GoalStationsServiceImpl.getGoalStationsByEventCode.mockRejectedValue(new Error("DB connection lost"));

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new GoalStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB connection lost");
        });
    });

    describe("POST", () => {
        const validBody = {
            eventCode: TEST_EVENT_CODE,
            stationCode: "STATION_A",
        };

        it("リクエストボディをServiceに渡し、登録結果を返す", async () => {
            GoalStationsServiceImpl.postGoalStations.mockResolvedValue({
                goalStation: buildGoalStation(validBody),
            });

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(await new GoalStationsApiHandler(req).handle());

            expect(GoalStationsServiceImpl.postGoalStations).toHaveBeenCalledWith(validBody);
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it.each([
            ["eventCodeがない", { stationCode: "STATION_A" }],
            ["stationCodeが空文字", { ...validBody, stationCode: "" }],
        ])("ボディが不正な場合（%s）は400を返す", async (_label, body) => {
            const req = buildPostRequest(body);
            const { status } = await readResponse(await new GoalStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(GoalStationsServiceImpl.postGoalStations).not.toHaveBeenCalled();
        });

        it.each([
            [new ConflictError({ message: "already set" }), StatusCode.CONFLICT],
            [new BadRequestError({ message: "invalid" }), StatusCode.BAD_REQUEST],
        ])("ServiceがApiErrorを投げた場合はステータスコードを引き継ぐ", async (error, expectedStatus) => {
            GoalStationsServiceImpl.postGoalStations.mockRejectedValue(error);

            const req = buildPostRequest(validBody);
            const { status } = await readResponse(await new GoalStationsApiHandler(req).handle());

            expect(status).toBe(expectedStatus);
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            GoalStationsServiceImpl.postGoalStations.mockRejectedValue(new Error("DB connection lost"));

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(await new GoalStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB connection lost");
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["PUT"], ["DELETE"], ["PATCH"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(await new GoalStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
