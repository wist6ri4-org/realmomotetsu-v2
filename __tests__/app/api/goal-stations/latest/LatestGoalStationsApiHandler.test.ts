/**
 * @jest-environment node
 */

import { StatusCode } from "@/constants/statuscode";
import { ResourceNotFoundError } from "@/error";
import { TEST_EVENT_CODE, buildGoalStation } from "../../../../helpers/factories";
import {
    buildGetRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../../helpers/apiRequest";

// LatestGoalStationsApiHandlerはLatestGoalStationsServiceImplを直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/goal-stations/latest/service", () => ({
    LatestGoalStationsServiceImpl: {
        getLatestGoalStationByEventCode: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { LatestGoalStationsServiceImpl } = jest.requireMock("@/features/goal-stations/latest/service") as {
    LatestGoalStationsServiceImpl: {
        getLatestGoalStationByEventCode: jest.Mock;
    };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import LatestGoalStationsApiHandler from "@/app/api/goal-stations/latest/LatestGoalStationsApiHandler";

describe("LatestGoalStationsApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        LatestGoalStationsServiceImpl.getLatestGoalStationByEventCode.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("GET", () => {
        it("イベントコードをServiceに渡し、最新の目的駅を返す", async () => {
            const goalStation = buildGoalStation({ stationCode: "STATION_A" });
            LatestGoalStationsServiceImpl.getLatestGoalStationByEventCode.mockResolvedValue({ goalStation });

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new LatestGoalStationsApiHandler(req).handle());

            expect(LatestGoalStationsServiceImpl.getLatestGoalStationByEventCode).toHaveBeenCalledWith({
                eventCode: TEST_EVENT_CODE,
            });
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it("eventCodeが欠けている場合は400を返す", async () => {
            const req = buildGetRequest({});
            const { status, body } = await readResponse(await new LatestGoalStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
            expect(LatestGoalStationsServiceImpl.getLatestGoalStationByEventCode).not.toHaveBeenCalled();
        });

        it("eventCodeが空文字の場合は400を返す", async () => {
            const req = buildGetRequest({ eventCode: "" });
            const { status } = await readResponse(await new LatestGoalStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(LatestGoalStationsServiceImpl.getLatestGoalStationByEventCode).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合は対応するステータスコードを返す", async () => {
            LatestGoalStationsServiceImpl.getLatestGoalStationByEventCode.mockRejectedValue(
                new ResourceNotFoundError("GoalStation", TEST_EVENT_CODE),
            );

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new LatestGoalStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.NOT_FOUND);
            expect(body.errorCode).toBe("RESOURCE_NOT_FOUND");
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            LatestGoalStationsServiceImpl.getLatestGoalStationByEventCode.mockRejectedValue(
                new Error("DB connection lost"),
            );

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new LatestGoalStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB connection lost");
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["POST"], ["PUT"], ["DELETE"], ["PATCH"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(await new LatestGoalStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
