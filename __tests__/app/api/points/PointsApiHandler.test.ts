/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { StatusCode } from "@/constants/statuscode";
import { BadRequestError, ConflictError } from "@/error";
import { PointStatus } from "@/generated/prisma";
import { buildPoints } from "../../../helpers/factories";
import {
    buildGetRequest,
    buildPostRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../helpers/apiRequest";

/** JSONボディを持つPUTリクエストを生成する */
const buildPutRequest = (body: unknown): NextRequest =>
    new NextRequest(new URL("http://localhost:3001/api/test"), {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: typeof body === "string" ? body : JSON.stringify(body),
    });

// PointsApiHandlerはPointsServiceImplを直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/points/service", () => ({
    PointsServiceImpl: {
        getPointsByEventCodeGroupedByTeamCode: jest.fn(),
        postPoints: jest.fn(),
        putPoints: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PointsServiceImpl } = jest.requireMock("@/features/points/service") as {
    PointsServiceImpl: {
        getPointsByEventCodeGroupedByTeamCode: jest.Mock;
        postPoints: jest.Mock;
        putPoints: jest.Mock;
    };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import PointsApiHandler from "@/app/api/points/PointsApiHandler";

describe("PointsApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        PointsServiceImpl.getPointsByEventCodeGroupedByTeamCode.mockReset();
        PointsServiceImpl.postPoints.mockReset();
        PointsServiceImpl.putPoints.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("GET", () => {
        it("イベントコードをServiceに渡し、グループ化されたポイントを返す", async () => {
            const points = {
                TEAM_A: {
                    points: [buildPoints({ status: PointStatus.points })],
                    scored: [],
                    property: [],
                    revenue: [],
                },
            };
            PointsServiceImpl.getPointsByEventCodeGroupedByTeamCode.mockResolvedValue({ points });

            const req = buildGetRequest({ eventCode: "EVENT_A" });
            const { status, body } = await readResponse(await new PointsApiHandler(req).handle());

            expect(PointsServiceImpl.getPointsByEventCodeGroupedByTeamCode).toHaveBeenCalledWith({
                eventCode: "EVENT_A",
            });
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it("eventCodeが欠けている場合は400を返す", async () => {
            const req = buildGetRequest({});
            const { status, body } = await readResponse(await new PointsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
            expect(PointsServiceImpl.getPointsByEventCodeGroupedByTeamCode).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合は対応するステータスコードを返す", async () => {
            PointsServiceImpl.getPointsByEventCodeGroupedByTeamCode.mockRejectedValue(
                new BadRequestError({ message: "invalid" }),
            );

            const req = buildGetRequest({ eventCode: "EVENT_A" });
            const { status } = await readResponse(await new PointsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
        });

        it("Serviceが想定外のエラーを投げた場合は500を返す", async () => {
            PointsServiceImpl.getPointsByEventCodeGroupedByTeamCode.mockRejectedValue(new Error("DB down"));

            const req = buildGetRequest({ eventCode: "EVENT_A" });
            const { status, body } = await readResponse(await new PointsApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB down");
        });
    });

    describe("POST", () => {
        const validBody = {
            eventCode: "EVENT_A",
            teamCode: "TEAM_A",
            points: 100,
            status: PointStatus.points,
        };

        it("リクエストボディをServiceに渡し、登録結果を返す", async () => {
            PointsServiceImpl.postPoints.mockResolvedValue({ point: buildPoints(validBody) });

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(await new PointsApiHandler(req).handle());

            expect(PointsServiceImpl.postPoints).toHaveBeenCalledWith(validBody);
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it.each([
            ["eventCodeがない", { teamCode: "TEAM_A", points: 100, status: PointStatus.points }],
            ["pointsが小数", { ...validBody, points: 1.5 }],
            ["statusが不正な値", { ...validBody, status: "invalid" }],
        ])("ボディが不正な場合（%s）は400を返す", async (_label, body) => {
            const req = buildPostRequest(body);
            const { status } = await readResponse(await new PointsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(PointsServiceImpl.postPoints).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合はステータスコードを引き継ぐ", async () => {
            PointsServiceImpl.postPoints.mockRejectedValue(new ConflictError({ message: "conflict" }));

            const req = buildPostRequest(validBody);
            const { status } = await readResponse(await new PointsApiHandler(req).handle());

            expect(status).toBe(StatusCode.CONFLICT);
        });
    });

    describe("PUT", () => {
        it("リクエストボディをServiceに渡し、更新件数を返す", async () => {
            PointsServiceImpl.putPoints.mockResolvedValue({ count: 2 });

            const req = buildPutRequest({ teamCode: "TEAM_A" });
            const { status, body } = await readResponse(await new PointsApiHandler(req).handle());

            expect(PointsServiceImpl.putPoints).toHaveBeenCalledWith({ teamCode: "TEAM_A" });
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it("teamCodeが空文字の場合は400を返す", async () => {
            const req = buildPutRequest({ teamCode: "" });
            const { status } = await readResponse(await new PointsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(PointsServiceImpl.putPoints).not.toHaveBeenCalled();
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["DELETE"], ["PATCH"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(await new PointsApiHandler(req).handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
