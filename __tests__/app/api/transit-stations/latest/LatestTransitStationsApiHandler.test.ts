/**
 * @jest-environment node
 */

import { BadRequestError, ResourceNotFoundError } from "@/error";
import { StatusCode } from "@/constants/statuscode";
import { TEST_EVENT_CODE, buildLatestTransitStation } from "../../../../helpers/factories";
import {
    buildGetRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../../helpers/apiRequest";

// LatestTransitStationsApiHandlerはLatestTransitStationsServiceImplを直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/transit-stations/latest/service", () => ({
    LatestTransitStationsServiceImpl: {
        getLatestTransitStationsByEventCode: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { LatestTransitStationsServiceImpl } = jest.requireMock("@/features/transit-stations/latest/service") as {
    LatestTransitStationsServiceImpl: {
        getLatestTransitStationsByEventCode: jest.Mock;
    };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import LatestTransitStationsApiHandler from "@/app/api/transit-stations/latest/LatestTransitStationsApiHandler";

describe("LatestTransitStationsApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        LatestTransitStationsServiceImpl.getLatestTransitStationsByEventCode.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("GET", () => {
        it("イベントコードをServiceに渡し、最新経由駅の一覧を返す", async () => {
            const latestTransitStations = [buildLatestTransitStation({ eventCode: TEST_EVENT_CODE })];
            LatestTransitStationsServiceImpl.getLatestTransitStationsByEventCode.mockResolvedValue({
                latestTransitStations,
            });

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new LatestTransitStationsApiHandler(req).handle());

            expect(LatestTransitStationsServiceImpl.getLatestTransitStationsByEventCode).toHaveBeenCalledWith({
                eventCode: TEST_EVENT_CODE,
            });
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it("eventCodeが欠けている場合は400を返し、Serviceを呼ばない", async () => {
            const req = buildGetRequest({});
            const { status, body } = await readResponse(await new LatestTransitStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
            expect(LatestTransitStationsServiceImpl.getLatestTransitStationsByEventCode).not.toHaveBeenCalled();
        });

        it("eventCodeが空文字の場合は400を返す", async () => {
            const req = buildGetRequest({ eventCode: "" });
            const { status } = await readResponse(await new LatestTransitStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(LatestTransitStationsServiceImpl.getLatestTransitStationsByEventCode).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合は対応するステータスコードを返す", async () => {
            LatestTransitStationsServiceImpl.getLatestTransitStationsByEventCode.mockRejectedValue(
                new ResourceNotFoundError("Event", TEST_EVENT_CODE),
            );

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new LatestTransitStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.NOT_FOUND);
            expect(body.errorCode).toBe("RESOURCE_NOT_FOUND");
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            LatestTransitStationsServiceImpl.getLatestTransitStationsByEventCode.mockRejectedValue(
                new Error("DB connection lost"),
            );

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new LatestTransitStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB connection lost");
        });

        it("Serviceが投げたBadRequestErrorのステータスコードを引き継ぐ", async () => {
            LatestTransitStationsServiceImpl.getLatestTransitStationsByEventCode.mockRejectedValue(
                new BadRequestError({ message: "invalid" }),
            );

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status } = await readResponse(await new LatestTransitStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["POST"], ["PUT"], ["DELETE"], ["PATCH"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(await new LatestTransitStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
