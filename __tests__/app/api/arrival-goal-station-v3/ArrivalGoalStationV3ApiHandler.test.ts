/**
 * @jest-environment node
 */

import ArrivalGoalStationV3ApiHandler from "@/app/api/arrival-goal-station-v3/ArrivalGoalStationV3ApiHandler";
import { StatusCode } from "@/constants/statuscode";
import { BadRequestError, ConflictError, DataIntegrityError } from "@/error";
import { ArrivalGoalStationV3Service } from "@/features/arrival-goal-station-v3/interface";
import {
    TEST_EVENT_CODE,
    TEST_EVENT_TYPE_CODE,
    buildPropertyPurchase,
    buildStations,
} from "../../../helpers/factories";
import {
    buildPostRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../helpers/apiRequest";

describe("ArrivalGoalStationV3ApiHandler", () => {
    /** モックのService */
    let service: jest.Mocked<ArrivalGoalStationV3Service>;

    const validBody = {
        eventTypeCode: TEST_EVENT_TYPE_CODE,
        eventCode: TEST_EVENT_CODE,
        teamCode: "TEAM_A",
        stations: buildStations(["STATION_A", "STATION_B"]),
        willPurchase: false,
    };

    beforeEach(() => {
        silenceApiLogs();
        service = {
            postArrivalGoalStationV3: jest.fn(),
        } as unknown as jest.Mocked<ArrivalGoalStationV3Service>;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("POST", () => {
        it("リクエストボディをServiceに渡し、到着処理の結果を返す", async () => {
            service.postArrivalGoalStationV3.mockResolvedValue({
                points: 5000,
                propertyPurchases: null,
                purchasePoints: null,
                consecutiveGoalCount: 0,
                consecutiveGoalBonus: null,
            });

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(
                await new ArrivalGoalStationV3ApiHandler(req, service).handle(),
            );

            // stationsはJSON経由でDateがISO文字列に変換されるため、呼び出し引数の内容比較はしない
            expect(service.postArrivalGoalStationV3).toHaveBeenCalledTimes(1);
            const calledWith = service.postArrivalGoalStationV3.mock.calls[0][0];
            expect(calledWith.eventCode).toBe(TEST_EVENT_CODE);
            expect(calledWith.teamCode).toBe("TEAM_A");
            expect(calledWith.willPurchase).toBe(false);
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
            expect((body.data as { points: number }).points).toBe(5000);
        });

        it("物件購入ありの戻り値もそのままレスポンスに乗る", async () => {
            service.postArrivalGoalStationV3.mockResolvedValue({
                points: 5000,
                propertyPurchases: buildPropertyPurchase({ stationCode: "STATION_B" }),
                purchasePoints: 10_000,
                consecutiveGoalCount: 1,
                consecutiveGoalBonus: 1_000,
            });

            const req = buildPostRequest({ ...validBody, willPurchase: true });
            const { status, body } = await readResponse(
                await new ArrivalGoalStationV3ApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.OK);
            const data = body.data as Record<string, unknown>;
            expect(data.purchasePoints).toBe(10_000);
            expect(data.consecutiveGoalBonus).toBe(1_000);
        });

        it.each([
            ["eventTypeCodeがない", { eventCode: TEST_EVENT_CODE, teamCode: "TEAM_A", stations: [], willPurchase: false }],
            ["teamCodeが空文字", { ...validBody, teamCode: "" }],
            ["willPurchaseが真偽値でない", { ...validBody, willPurchase: "yes" }],
            ["stationsが配列でない", { ...validBody, stations: "STATION_A" }],
        ])("ボディが不正な場合（%s）は400を返す", async (_label, body) => {
            const req = buildPostRequest(body);
            const { status } = await readResponse(
                await new ArrivalGoalStationV3ApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(service.postArrivalGoalStationV3).not.toHaveBeenCalled();
        });

        it.each([
            [new ConflictError({ message: "already purchased" }), StatusCode.CONFLICT],
            [new BadRequestError({ message: "invalid" }), StatusCode.BAD_REQUEST],
            [new DataIntegrityError("inconsistent state"), 422],
        ])("ServiceがApiErrorを投げた場合はステータスコードを引き継ぐ", async (error, expectedStatus) => {
            service.postArrivalGoalStationV3.mockRejectedValue(error);

            const req = buildPostRequest(validBody);
            const { status } = await readResponse(
                await new ArrivalGoalStationV3ApiHandler(req, service).handle(),
            );

            expect(status).toBe(expectedStatus);
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含めない", async () => {
            service.postArrivalGoalStationV3.mockRejectedValue(new Error("DB connection lost"));

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(
                await new ArrivalGoalStationV3ApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(body.error).toBe("Internal Server Error");
            expect(JSON.stringify(body)).not.toContain("DB connection lost");
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["GET"], ["PUT"], ["DELETE"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(
                await new ArrivalGoalStationV3ApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
