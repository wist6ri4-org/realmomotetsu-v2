/**
 * @jest-environment node
 */

import { StatusCode } from "@/constants/statuscode";
import { ResourceNotFoundError } from "@/error";
import { TEST_EVENT_CODE, buildEvent } from "../../../../helpers/factories";
import {
    buildGetRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../../helpers/apiRequest";

// EventsByEventCodeApiHandlerはEventByEventCodeServiceImplを直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/events/[eventCode]/service", () => ({
    EventByEventCodeServiceImpl: {
        getEventByEventCode: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { EventByEventCodeServiceImpl } = jest.requireMock("@/features/events/[eventCode]/service") as {
    EventByEventCodeServiceImpl: {
        getEventByEventCode: jest.Mock;
    };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import EventsByEventCodeApiHandler from "@/app/api/events/[eventCode]/EventsByEventCodeApiHandler";

describe("EventsByEventCodeApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        EventByEventCodeServiceImpl.getEventByEventCode.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("GET", () => {
        it("パスパラメータのeventCodeをServiceに渡し、イベントを返す", async () => {
            const event = buildEvent({ eventCode: TEST_EVENT_CODE });
            EventByEventCodeServiceImpl.getEventByEventCode.mockResolvedValue({ event });

            const req = buildGetRequest();
            const { status, body } = await readResponse(
                await new EventsByEventCodeApiHandler(req, { eventCode: TEST_EVENT_CODE }).handle(),
            );

            expect(EventByEventCodeServiceImpl.getEventByEventCode).toHaveBeenCalledWith({
                eventCode: TEST_EVENT_CODE,
            });
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it("eventCodeが空文字の場合は400を返す", async () => {
            const req = buildGetRequest();
            const { status, body } = await readResponse(
                await new EventsByEventCodeApiHandler(req, { eventCode: "" }).handle(),
            );

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
            expect(EventByEventCodeServiceImpl.getEventByEventCode).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合は対応するステータスコードを返す", async () => {
            EventByEventCodeServiceImpl.getEventByEventCode.mockRejectedValue(
                new ResourceNotFoundError("Event", TEST_EVENT_CODE),
            );

            const req = buildGetRequest();
            const { status, body } = await readResponse(
                await new EventsByEventCodeApiHandler(req, { eventCode: TEST_EVENT_CODE }).handle(),
            );

            expect(status).toBe(StatusCode.NOT_FOUND);
            expect(body.errorCode).toBe("RESOURCE_NOT_FOUND");
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            EventByEventCodeServiceImpl.getEventByEventCode.mockRejectedValue(new Error("DB connection lost"));

            const req = buildGetRequest();
            const { status, body } = await readResponse(
                await new EventsByEventCodeApiHandler(req, { eventCode: TEST_EVENT_CODE }).handle(),
            );

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB connection lost");
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["POST"], ["PUT"], ["DELETE"], ["PATCH"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(
                await new EventsByEventCodeApiHandler(req, { eventCode: TEST_EVENT_CODE }).handle(),
            );

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
