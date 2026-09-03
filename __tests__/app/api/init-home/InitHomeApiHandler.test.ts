/**
 * @jest-environment node
 */

import { StatusCode } from "@/constants/statuscode";
import { InternalServerError, ResourceNotFoundError } from "@/error";
import { InitHomeResponse } from "@/features/init-home/types";
import { buildGoalStation, buildTeam, buildTeamData, TEST_EVENT_CODE } from "../../../helpers/factories";
import {
    buildGetRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../helpers/apiRequest";

// InitHomeApiHandlerはInitHomeServiceImplをモジュールレベルで直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/init-home/service", () => ({
    InitHomeServiceImpl: {
        getDataForHome: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { InitHomeServiceImpl } = jest.requireMock("@/features/init-home/service") as {
    InitHomeServiceImpl: { getDataForHome: jest.Mock };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import InitHomeApiHandler from "@/app/api/init-home/InitHomeApiHandler";

describe("InitHomeApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        InitHomeServiceImpl.getDataForHome.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("GET", () => {
        it("eventCodeをServiceに渡し、ホーム画面の初期化データを返す", async () => {
            const data: InitHomeResponse = {
                teamData: [buildTeamData()],
                nextGoalStation: buildGoalStation(),
                bombiiTeam: buildTeam(),
            };
            InitHomeServiceImpl.getDataForHome.mockResolvedValue(data);

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new InitHomeApiHandler(req).handle());

            expect(InitHomeServiceImpl.getDataForHome).toHaveBeenCalledWith({
                eventCode: TEST_EVENT_CODE,
            });
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it("nextGoalStationとbombiiTeamがnullの場合もそのまま返す", async () => {
            const data: InitHomeResponse = {
                teamData: [buildTeamData()],
                nextGoalStation: null,
                bombiiTeam: null,
            };
            InitHomeServiceImpl.getDataForHome.mockResolvedValue(data);

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status } = await readResponse(await new InitHomeApiHandler(req).handle());

            expect(status).toBe(StatusCode.OK);
        });

        it.each([
            ["eventCodeがない", {}],
            ["eventCodeが空文字", { eventCode: "" }],
        ])("クエリパラメータが不正な場合（%s）は400を返す", async (_label, params) => {
            const req = buildGetRequest(params);
            const { status, body } = await readResponse(await new InitHomeApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
            expect(InitHomeServiceImpl.getDataForHome).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合は対応するステータスコードを返す", async () => {
            InitHomeServiceImpl.getDataForHome.mockRejectedValue(
                new ResourceNotFoundError("Event", TEST_EVENT_CODE),
            );

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new InitHomeApiHandler(req).handle());

            expect(status).toBe(StatusCode.NOT_FOUND);
            expect(body.errorCode).toBe("RESOURCE_NOT_FOUND");
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            InitHomeServiceImpl.getDataForHome.mockRejectedValue(new Error("DB connection lost"));

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new InitHomeApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB connection lost");
        });

        it("Serviceの戻り値がレスポンススキーマを満たさない場合は400を返す", async () => {
            InitHomeServiceImpl.getDataForHome.mockResolvedValue({
                teamData: [{ id: 1 }],
                nextGoalStation: null,
                bombiiTeam: null,
            } as never);

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new InitHomeApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
        });

        it("Serviceが投げたInternalServerErrorのステータスコードを引き継ぐ", async () => {
            InitHomeServiceImpl.getDataForHome.mockRejectedValue(new InternalServerError("unexpected"));

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status } = await readResponse(await new InitHomeApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["POST"], ["PUT"], ["DELETE"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(await new InitHomeApiHandler(req).handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
