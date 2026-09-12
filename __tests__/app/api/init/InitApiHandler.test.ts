/**
 * @jest-environment node
 */

import { StatusCode } from "@/constants/statuscode";
import { InternalServerError, ResourceNotFoundError } from "@/error";
import { InitResponse } from "@/features/init/types";
import {
    buildAttendance,
    buildDocument,
    buildEvent,
    buildEventType,
    buildNearbyStation,
    buildStation,
    buildTeam,
    buildUser,
    TEST_EVENT_CODE,
} from "../../../helpers/factories";
import {
    buildGetRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../helpers/apiRequest";

// InitApiHandlerはInitServiceImplをモジュールレベルで直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/init/service", () => ({
    InitServiceImpl: {
        getDataForInit: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { InitServiceImpl } = jest.requireMock("@/features/init/service") as {
    InitServiceImpl: { getDataForInit: jest.Mock };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import InitApiHandler from "@/app/api/init/InitApiHandler";

/** レスポンススキーマを満たす正常なInitResponseを生成する */
const buildValidInitResponse = (): InitResponse => ({
    eventType: buildEventType(),
    teams: [buildTeam()],
    stations: [buildStation()],
    nearbyStations: [buildNearbyStation("STATION_A", "STATION_B", 5)],
    documents: [buildDocument()],
    user: {
        ...buildUser(),
        attendances: [
            {
                ...buildAttendance(),
                event: { ...buildEvent(), eventType: buildEventType() },
            },
        ],
    },
    event: { ...buildEvent(), eventType: buildEventType() },
});

describe("InitApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        InitServiceImpl.getDataForInit.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("GET", () => {
        it("eventCodeとuuidをServiceに渡し、初期化データを返す", async () => {
            const data = buildValidInitResponse();
            InitServiceImpl.getDataForInit.mockResolvedValue(data);

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE, uuid: "uuid-1" });
            const { status, body } = await readResponse(await new InitApiHandler(req).handle());

            expect(InitServiceImpl.getDataForInit).toHaveBeenCalledWith({
                eventCode: TEST_EVENT_CODE,
                uuid: "uuid-1",
            });
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it.each([
            ["eventCodeがない", { uuid: "uuid-1" }],
            ["uuidがない", { eventCode: TEST_EVENT_CODE }],
            ["eventCodeが空文字", { eventCode: "", uuid: "uuid-1" }],
        ])("クエリパラメータが不正な場合（%s）は400を返す", async (_label, params) => {
            const req = buildGetRequest(params);
            const { status, body } = await readResponse(await new InitApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
            expect(InitServiceImpl.getDataForInit).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合は対応するステータスコードを返す", async () => {
            InitServiceImpl.getDataForInit.mockRejectedValue(
                new ResourceNotFoundError("User", "uuid-1"),
            );

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE, uuid: "uuid-1" });
            const { status, body } = await readResponse(await new InitApiHandler(req).handle());

            expect(status).toBe(StatusCode.NOT_FOUND);
            expect(body.errorCode).toBe("RESOURCE_NOT_FOUND");
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            InitServiceImpl.getDataForInit.mockRejectedValue(new Error("DB connection lost"));

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE, uuid: "uuid-1" });
            const { status, body } = await readResponse(await new InitApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB connection lost");
        });

        it("Serviceの戻り値がレスポンススキーマを満たさない場合は400を返す", async () => {
            // 必須のuserを欠いた不正なデータ
            const { user: _user, ...invalidData } = buildValidInitResponse();
            InitServiceImpl.getDataForInit.mockResolvedValue(invalidData as never);

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE, uuid: "uuid-1" });
            const { status, body } = await readResponse(await new InitApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
        });

        it("Serviceが投げたInternalServerErrorのステータスコードを引き継ぐ", async () => {
            InitServiceImpl.getDataForInit.mockRejectedValue(new InternalServerError("unexpected"));

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE, uuid: "uuid-1" });
            const { status } = await readResponse(await new InitApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["POST"], ["PUT"], ["DELETE"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(await new InitApiHandler(req).handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
