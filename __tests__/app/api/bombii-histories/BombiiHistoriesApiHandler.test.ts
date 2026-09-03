/**
 * @jest-environment node
 */

import { StatusCode } from "@/constants/statuscode";
import { BadRequestError, ConflictError } from "@/error";
import { TEST_EVENT_CODE, buildBombiiHistory } from "../../../helpers/factories";
import {
    buildGetRequest,
    buildPostRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../helpers/apiRequest";

// BombiiHistoriesApiHandlerはBombiiHistoriesServiceImplを直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/bombii-histories/service", () => ({
    BombiiHistoriesServiceImpl: {
        postBombiiHistories: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { BombiiHistoriesServiceImpl } = jest.requireMock("@/features/bombii-histories/service") as {
    BombiiHistoriesServiceImpl: {
        postBombiiHistories: jest.Mock;
    };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import BombiiHistoriesApiHandler from "@/app/api/bombii-histories/BombiiHistoriesApiHandler";

describe("BombiiHistoriesApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        BombiiHistoriesServiceImpl.postBombiiHistories.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("POST", () => {
        const validBody = {
            eventCode: TEST_EVENT_CODE,
            teamCode: "TEAM_A",
        };

        it("リクエストボディをServiceに渡し、登録結果を返す", async () => {
            BombiiHistoriesServiceImpl.postBombiiHistories.mockResolvedValue({
                bombiiHistory: buildBombiiHistory(validBody),
            });

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(await new BombiiHistoriesApiHandler(req).handle());

            expect(BombiiHistoriesServiceImpl.postBombiiHistories).toHaveBeenCalledWith(validBody);
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it.each([
            ["eventCodeがない", { teamCode: "TEAM_A" }],
            ["teamCodeが空文字", { ...validBody, teamCode: "" }],
        ])("ボディが不正な場合（%s）は400を返す", async (_label, body) => {
            const req = buildPostRequest(body);
            const { status, body: responseBody } = await readResponse(
                await new BombiiHistoriesApiHandler(req).handle(),
            );

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(responseBody.error).toBe("Validation failed");
            expect(BombiiHistoriesServiceImpl.postBombiiHistories).not.toHaveBeenCalled();
        });

        it.each([
            [new ConflictError({ message: "already registered" }), StatusCode.CONFLICT],
            [new BadRequestError({ message: "invalid" }), StatusCode.BAD_REQUEST],
        ])("ServiceがApiErrorを投げた場合はステータスコードを引き継ぐ", async (error, expectedStatus) => {
            BombiiHistoriesServiceImpl.postBombiiHistories.mockRejectedValue(error);

            const req = buildPostRequest(validBody);
            const { status } = await readResponse(await new BombiiHistoriesApiHandler(req).handle());

            expect(status).toBe(expectedStatus);
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            BombiiHistoriesServiceImpl.postBombiiHistories.mockRejectedValue(new Error("DB connection lost"));

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(await new BombiiHistoriesApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB connection lost");
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["GET"], ["PUT"], ["DELETE"], ["PATCH"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(await new BombiiHistoriesApiHandler(req).handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
