/**
 * @jest-environment node
 */

import { StatusCode } from "@/constants/statuscode";
import { InternalServerError, ResourceNotFoundError } from "@/error";
import { InitRoutemapResponse } from "@/features/init-routemap/types";
import { buildGoalStation, buildTeam, buildTeamData, TEST_EVENT_CODE } from "../../../helpers/factories";
import {
    buildGetRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../helpers/apiRequest";

// InitRoutemapApiHandlerはInitRoutemapServiceImplをモジュールレベルで直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/init-routemap/service", () => ({
    InitRoutemapServiceImpl: {
        getDataForRoutemap: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { InitRoutemapServiceImpl } = jest.requireMock("@/features/init-routemap/service") as {
    InitRoutemapServiceImpl: { getDataForRoutemap: jest.Mock };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import InitRoutemapApiHandler from "@/app/api/init-routemap/InitRoutemapApiHandler";

/** レスポンススキーマを満たす正常なInitRoutemapResponseを生成する */
const buildValidInitRoutemapResponse = (): InitRoutemapResponse => {
    // points/scoredPoints/propertyPurchasePoints/revenuePointsはレスポンスから除外される
    const { points: _points, scoredPoints: _scoredPoints, propertyPurchasePoints: _propertyPurchasePoints, revenuePoints: _revenuePoints, ...teamDataForRoutemap } = buildTeamData();

    return {
        teamData: [teamDataForRoutemap],
        nextGoalStation: buildGoalStation(),
        bombiiTeam: buildTeam(),
        propertyPurchases: [{ stationCode: "STATION_A", team: { teamColor: "#ff0000" } }],
    };
};

describe("InitRoutemapApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        InitRoutemapServiceImpl.getDataForRoutemap.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("GET", () => {
        it("eventCodeをServiceに渡し、路線図画面の初期化データを返す", async () => {
            const data = buildValidInitRoutemapResponse();
            InitRoutemapServiceImpl.getDataForRoutemap.mockResolvedValue(data);

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new InitRoutemapApiHandler(req).handle());

            expect(InitRoutemapServiceImpl.getDataForRoutemap).toHaveBeenCalledWith({
                eventCode: TEST_EVENT_CODE,
            });
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it("nextGoalStationとbombiiTeamがnullの場合もそのまま返す", async () => {
            const data = { ...buildValidInitRoutemapResponse(), nextGoalStation: null, bombiiTeam: null };
            InitRoutemapServiceImpl.getDataForRoutemap.mockResolvedValue(data);

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status } = await readResponse(await new InitRoutemapApiHandler(req).handle());

            expect(status).toBe(StatusCode.OK);
        });

        it.each([
            ["eventCodeがない", {}],
            ["eventCodeが空文字", { eventCode: "" }],
        ])("クエリパラメータが不正な場合（%s）は400を返す", async (_label, params) => {
            const req = buildGetRequest(params);
            const { status, body } = await readResponse(await new InitRoutemapApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
            expect(InitRoutemapServiceImpl.getDataForRoutemap).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合は対応するステータスコードを返す", async () => {
            InitRoutemapServiceImpl.getDataForRoutemap.mockRejectedValue(
                new ResourceNotFoundError("Event", TEST_EVENT_CODE),
            );

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new InitRoutemapApiHandler(req).handle());

            expect(status).toBe(StatusCode.NOT_FOUND);
            expect(body.errorCode).toBe("RESOURCE_NOT_FOUND");
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            InitRoutemapServiceImpl.getDataForRoutemap.mockRejectedValue(new Error("DB connection lost"));

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new InitRoutemapApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB connection lost");
        });

        it("Serviceの戻り値がレスポンススキーマを満たさない場合は400を返す", async () => {
            InitRoutemapServiceImpl.getDataForRoutemap.mockResolvedValue({
                teamData: [{ id: 1 }],
                nextGoalStation: null,
                bombiiTeam: null,
                propertyPurchases: [],
            } as never);

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new InitRoutemapApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
        });

        it("Serviceが投げたInternalServerErrorのステータスコードを引き継ぐ", async () => {
            InitRoutemapServiceImpl.getDataForRoutemap.mockRejectedValue(new InternalServerError("unexpected"));

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status } = await readResponse(await new InitRoutemapApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["POST"], ["PUT"], ["DELETE"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(await new InitRoutemapApiHandler(req).handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
