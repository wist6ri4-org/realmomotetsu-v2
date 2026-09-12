/**
 * @jest-environment node
 */

import PointsBulkApiHandler from "@/app/api/points/bulk/PointsBulkApiHandler";
import { StatusCode } from "@/constants/statuscode";
import { BadRequestError, ConflictError } from "@/error";
import { PointStatus } from "@/generated/prisma";
import { PointsBulkService } from "@/features/points/bulk/interface";
import { buildPoints } from "../../../../helpers/factories";
import {
    buildPostRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../../helpers/apiRequest";

describe("PointsBulkApiHandler", () => {
    let service: jest.Mocked<PointsBulkService>;

    beforeEach(() => {
        silenceApiLogs();
        service = {
            postBulkPoints: jest.fn(),
        } as unknown as jest.Mocked<PointsBulkService>;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("POST", () => {
        const validBody = {
            eventCode: "EVENT_A",
            fromTeamCode: "TEAM_A",
            toTeamCode: "TEAM_B",
            points: 100,
            status: PointStatus.points,
        };

        it("リクエストボディをServiceに渡し、移動元・移動先のポイントを返す", async () => {
            service.postBulkPoints.mockResolvedValue({
                fromPoint: buildPoints({ teamCode: "TEAM_A", points: -100 }),
                toPoint: buildPoints({ teamCode: "TEAM_B", points: 100 }),
            });

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(
                await new PointsBulkApiHandler(req, service).handle(),
            );

            expect(service.postBulkPoints).toHaveBeenCalledWith(validBody);
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it.each([
            ["fromTeamCodeがない", { eventCode: "EVENT_A", toTeamCode: "TEAM_B", points: 100, status: PointStatus.points }],
            ["pointsが0以下", { ...validBody, points: 0 }],
            ["pointsが小数", { ...validBody, points: 1.5 }],
        ])("ボディが不正な場合（%s）は400を返す", async (_label, body) => {
            const req = buildPostRequest(body);
            const { status } = await readResponse(
                await new PointsBulkApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(service.postBulkPoints).not.toHaveBeenCalled();
        });

        it.each([
            [new ConflictError({ message: "already moved" }), StatusCode.CONFLICT],
            [new BadRequestError({ message: "invalid" }), StatusCode.BAD_REQUEST],
        ])("ServiceがApiErrorを投げた場合はステータスコードを引き継ぐ", async (error, expectedStatus) => {
            service.postBulkPoints.mockRejectedValue(error);

            const req = buildPostRequest(validBody);
            const { status } = await readResponse(
                await new PointsBulkApiHandler(req, service).handle(),
            );

            expect(status).toBe(expectedStatus);
        });

        it("Serviceが想定外のエラーを投げた場合は500を返す", async () => {
            service.postBulkPoints.mockRejectedValue(new Error("DB down"));

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(
                await new PointsBulkApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB down");
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["GET"], ["PUT"], ["DELETE"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(
                await new PointsBulkApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
