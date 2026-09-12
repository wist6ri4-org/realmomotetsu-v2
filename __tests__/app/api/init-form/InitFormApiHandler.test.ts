/**
 * @jest-environment node
 */

import { StatusCode } from "@/constants/statuscode";
import { BadRequestError, InternalServerError } from "@/error";
import { InitFormResponse } from "@/features/init-form/types";
import { TEST_EVENT_CODE } from "../../../helpers/factories";
import {
    buildGetRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../helpers/apiRequest";

// InitFormApiHandlerはInitFormServiceImplをモジュールレベルで直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/init-form/service", () => ({
    InitFormServiceImpl: {
        getDataForForm: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { InitFormServiceImpl } = jest.requireMock("@/features/init-form/service") as {
    InitFormServiceImpl: { getDataForForm: jest.Mock };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import InitFormApiHandler from "@/app/api/init-form/InitFormApiHandler";

describe("InitFormApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        InitFormServiceImpl.getDataForForm.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("GET", () => {
        it("eventCodeをServiceに渡し、最寄り駅の一覧を返す", async () => {
            const data: InitFormResponse = {
                closestStations: [
                    { stationCode: "STATION_A", distance: 120 },
                    { stationCode: "STATION_B", distance: 480 },
                ],
            };
            InitFormServiceImpl.getDataForForm.mockResolvedValue(data);

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new InitFormApiHandler(req).handle());

            expect(InitFormServiceImpl.getDataForForm).toHaveBeenCalledWith({
                eventCode: TEST_EVENT_CODE,
            });
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it("closestStationsを含まない結果もそのまま返す", async () => {
            const data: InitFormResponse = {};
            InitFormServiceImpl.getDataForForm.mockResolvedValue(data);

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status } = await readResponse(await new InitFormApiHandler(req).handle());

            expect(status).toBe(StatusCode.OK);
        });

        it.each([
            ["eventCodeがない", {}],
            ["eventCodeが空文字", { eventCode: "" }],
        ])("クエリパラメータが不正な場合（%s）は400を返す", async (_label, params) => {
            const req = buildGetRequest(params);
            const { status, body } = await readResponse(await new InitFormApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
            expect(InitFormServiceImpl.getDataForForm).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合は対応するステータスコードを返す", async () => {
            InitFormServiceImpl.getDataForForm.mockRejectedValue(
                new BadRequestError({ message: "invalid location" }),
            );

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status } = await readResponse(await new InitFormApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            InitFormServiceImpl.getDataForForm.mockRejectedValue(new Error("geolocation service down"));

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new InitFormApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("geolocation service down");
        });

        it("Serviceの戻り値がレスポンススキーマを満たさない場合は400を返す", async () => {
            InitFormServiceImpl.getDataForForm.mockResolvedValue({
                closestStations: [{ stationCode: "STATION_A" }],
            } as never);

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new InitFormApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
        });

        it("Serviceが投げたInternalServerErrorのステータスコードを引き継ぐ", async () => {
            InitFormServiceImpl.getDataForForm.mockRejectedValue(new InternalServerError("unexpected"));

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status } = await readResponse(await new InitFormApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["POST"], ["PUT"], ["DELETE"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(await new InitFormApiHandler(req).handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
