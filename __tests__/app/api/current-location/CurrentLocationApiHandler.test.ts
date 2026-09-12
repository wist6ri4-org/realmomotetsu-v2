/**
 * @jest-environment node
 */

import { StatusCode } from "@/constants/statuscode";
import { GameConstants } from "@/constants/gameConstants";
import { BadRequestError, ConflictError } from "@/error";
import { buildPoints, buildTransitStation } from "../../../helpers/factories";
import {
    buildPostRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../helpers/apiRequest";

// CurrentLocationApiHandlerはCurrentLocationServiceImplを直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/current-location/service", () => ({
    CurrentLocationServiceImpl: {
        postCurrentLocation: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CurrentLocationServiceImpl } = jest.requireMock("@/features/current-location/service") as {
    CurrentLocationServiceImpl: {
        postCurrentLocation: jest.Mock;
    };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import CurrentLocationApiHandler from "@/app/api/current-location/CurrentLocationApiHandler";

describe("CurrentLocationApiHandler", () => {
    const validBody = {
        eventCode: "EVENT_A",
        teamCode: "TEAM_A",
        stationCode: "STATION_A",
        points: 100,
        status: GameConstants.POINT_STATUS.POINTS,
    };

    beforeEach(() => {
        silenceApiLogs();
        CurrentLocationServiceImpl.postCurrentLocation.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("POST", () => {
        it("リクエストボディをServiceに渡し、登録結果を返す", async () => {
            const transitStation = buildTransitStation({ stationCode: "STATION_A" });
            const point = buildPoints({ points: 100 });
            CurrentLocationServiceImpl.postCurrentLocation.mockResolvedValue({ transitStation, point });

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(await new CurrentLocationApiHandler(req).handle());

            expect(CurrentLocationServiceImpl.postCurrentLocation).toHaveBeenCalledWith(validBody);
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it.each([
            ["eventCodeがない", { teamCode: "TEAM_A", stationCode: "STATION_A", points: 100 }],
            ["teamCodeが空文字", { ...validBody, teamCode: "" }],
            ["pointsが小数", { ...validBody, points: 1.5 }],
            ["statusが不正な値", { ...validBody, status: "invalid" }],
        ])("ボディが不正な場合（%s）は400を返す", async (_label, body) => {
            const req = buildPostRequest(body);
            const { status } = await readResponse(await new CurrentLocationApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(CurrentLocationServiceImpl.postCurrentLocation).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合はステータスコードを引き継ぐ", async () => {
            CurrentLocationServiceImpl.postCurrentLocation.mockRejectedValue(
                new ConflictError({ message: "conflict" }),
            );

            const req = buildPostRequest(validBody);
            const { status } = await readResponse(await new CurrentLocationApiHandler(req).handle());

            expect(status).toBe(StatusCode.CONFLICT);
        });

        it("Serviceが投げたBadRequestErrorのステータスコードも引き継ぐ", async () => {
            CurrentLocationServiceImpl.postCurrentLocation.mockRejectedValue(
                new BadRequestError({ message: "invalid" }),
            );

            const req = buildPostRequest(validBody);
            const { status } = await readResponse(await new CurrentLocationApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含めない", async () => {
            CurrentLocationServiceImpl.postCurrentLocation.mockRejectedValue(new Error("DB connection lost"));

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(await new CurrentLocationApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB connection lost");
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["GET"], ["PUT"], ["DELETE"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(await new CurrentLocationApiHandler(req).handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
