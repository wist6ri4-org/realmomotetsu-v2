/**
 * @jest-environment node
 */

import { StatusCode } from "@/constants/statuscode";
import { InternalServerError, ResourceNotFoundError } from "@/error";
import { InitRouletteResponse } from "@/features/init-roulette/types";
import { buildGoalStation, buildLatestTransitStation, TEST_EVENT_CODE } from "../../../helpers/factories";
import {
    buildGetRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../helpers/apiRequest";

// InitRouletteApiHandlerはInitRouletteServiceImplをモジュールレベルで直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/init-roulette/service", () => ({
    InitRouletteServiceImpl: {
        getDataForRoulette: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { InitRouletteServiceImpl } = jest.requireMock("@/features/init-roulette/service") as {
    InitRouletteServiceImpl: { getDataForRoulette: jest.Mock };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import InitRouletteApiHandler from "@/app/api/init-roulette/InitRouletteApiHandler";

describe("InitRouletteApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        InitRouletteServiceImpl.getDataForRoulette.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("GET", () => {
        it("eventCodeをServiceに渡し、ルーレット画面の初期化データを返す", async () => {
            const data: InitRouletteResponse = {
                latestTransitStations: [buildLatestTransitStation()],
                goalStations: [buildGoalStation()],
            };
            InitRouletteServiceImpl.getDataForRoulette.mockResolvedValue(data);

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new InitRouletteApiHandler(req).handle());

            expect(InitRouletteServiceImpl.getDataForRoulette).toHaveBeenCalledWith({
                eventCode: TEST_EVENT_CODE,
            });
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it("既出目的駅が0件の場合も空配列としてそのまま返す", async () => {
            const data: InitRouletteResponse = {
                latestTransitStations: [],
                goalStations: [],
            };
            InitRouletteServiceImpl.getDataForRoulette.mockResolvedValue(data);

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status } = await readResponse(await new InitRouletteApiHandler(req).handle());

            expect(status).toBe(StatusCode.OK);
        });

        it.each([
            ["eventCodeがない", {}],
            ["eventCodeが空文字", { eventCode: "" }],
        ])("クエリパラメータが不正な場合（%s）は400を返す", async (_label, params) => {
            const req = buildGetRequest(params);
            const { status, body } = await readResponse(await new InitRouletteApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
            expect(InitRouletteServiceImpl.getDataForRoulette).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合は対応するステータスコードを返す", async () => {
            InitRouletteServiceImpl.getDataForRoulette.mockRejectedValue(
                new ResourceNotFoundError("Event", TEST_EVENT_CODE),
            );

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new InitRouletteApiHandler(req).handle());

            expect(status).toBe(StatusCode.NOT_FOUND);
            expect(body.errorCode).toBe("RESOURCE_NOT_FOUND");
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            InitRouletteServiceImpl.getDataForRoulette.mockRejectedValue(new Error("DB connection lost"));

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new InitRouletteApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB connection lost");
        });

        it("Serviceの戻り値がレスポンススキーマを満たさない場合は400を返す", async () => {
            InitRouletteServiceImpl.getDataForRoulette.mockResolvedValue({
                latestTransitStations: [{ id: 1 }],
                goalStations: [],
            } as never);

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new InitRouletteApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
        });

        it("Serviceが投げたInternalServerErrorのステータスコードを引き継ぐ", async () => {
            InitRouletteServiceImpl.getDataForRoulette.mockRejectedValue(new InternalServerError("unexpected"));

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status } = await readResponse(await new InitRouletteApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["POST"], ["PUT"], ["DELETE"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(await new InitRouletteApiHandler(req).handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
