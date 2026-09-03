/**
 * @jest-environment node
 */

import VerifyArrivalGoalStationV3ApiHandler from "@/app/api/verify/verify-arrival-goal-station-v3/VerifyArrivalGoalStationV3ApiHandler";
import { StatusCode } from "@/constants/statuscode";
import { BadRequestError, ConflictError } from "@/error";
import { VerifyArrivalGoalStationV3Service } from "@/features/verify/verify-arrival-goal-station-v3/interface";
import { VerifyArrivalGoalStationV3Result } from "@/features/verify/verify-arrival-goal-station-v3/types";
import { TEST_EVENT_CODE, TEST_EVENT_TYPE_CODE } from "../../../../helpers/factories";
import {
    buildPostRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../../helpers/apiRequest";

describe("VerifyArrivalGoalStationV3ApiHandler", () => {
    /** モックのService */
    let service: jest.Mocked<VerifyArrivalGoalStationV3Service>;

    const validBody = {
        eventTypeCode: TEST_EVENT_TYPE_CODE,
        eventCode: TEST_EVENT_CODE,
        teamCode: "TEAM_A",
        willPurchase: false,
    };

    beforeEach(() => {
        silenceApiLogs();
        service = {
            postVerifyArrivalGoalStationV3: jest.fn(),
        } as unknown as jest.Mocked<VerifyArrivalGoalStationV3Service>;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("POST", () => {
        it("リクエストボディをServiceに渡し、検証結果を返す", async () => {
            service.postVerifyArrivalGoalStationV3.mockResolvedValue({
                result: VerifyArrivalGoalStationV3Result.VERIFIED,
            });

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(
                await new VerifyArrivalGoalStationV3ApiHandler(req, service).handle(),
            );

            expect(service.postVerifyArrivalGoalStationV3).toHaveBeenCalledWith(validBody);
            expect(status).toBe(StatusCode.OK);
            expect((body.data as { result: string }).result).toBe(VerifyArrivalGoalStationV3Result.VERIFIED);
        });

        it.each([
            VerifyArrivalGoalStationV3Result.E01_ALREADY_PURCHASED,
            VerifyArrivalGoalStationV3Result.E02_INSUFFICIENT_POINTS,
            VerifyArrivalGoalStationV3Result.W01_STATION_MISMATCH,
        ])("Serviceが%sを返した場合もそのままレスポンスに乗る", async (result) => {
            service.postVerifyArrivalGoalStationV3.mockResolvedValue({ result });

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(
                await new VerifyArrivalGoalStationV3ApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.OK);
            expect((body.data as { result: string }).result).toBe(result);
        });

        it.each([
            ["eventTypeCodeがない", { eventCode: TEST_EVENT_CODE, teamCode: "TEAM_A", willPurchase: false }],
            ["teamCodeが空文字", { ...validBody, teamCode: "" }],
            ["willPurchaseが真偽値でない", { ...validBody, willPurchase: "yes" }],
        ])("ボディが不正な場合（%s）は400を返す", async (_label, body) => {
            const req = buildPostRequest(body);
            const { status } = await readResponse(
                await new VerifyArrivalGoalStationV3ApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(service.postVerifyArrivalGoalStationV3).not.toHaveBeenCalled();
        });

        it.each([
            [new ConflictError({ message: "already purchased" }), StatusCode.CONFLICT],
            [new BadRequestError({ message: "invalid" }), StatusCode.BAD_REQUEST],
        ])("ServiceがApiErrorを投げた場合はステータスコードを引き継ぐ", async (error, expectedStatus) => {
            service.postVerifyArrivalGoalStationV3.mockRejectedValue(error);

            const req = buildPostRequest(validBody);
            const { status } = await readResponse(
                await new VerifyArrivalGoalStationV3ApiHandler(req, service).handle(),
            );

            expect(status).toBe(expectedStatus);
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含めない", async () => {
            service.postVerifyArrivalGoalStationV3.mockRejectedValue(new Error("DB connection lost"));

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(
                await new VerifyArrivalGoalStationV3ApiHandler(req, service).handle(),
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
                await new VerifyArrivalGoalStationV3ApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
