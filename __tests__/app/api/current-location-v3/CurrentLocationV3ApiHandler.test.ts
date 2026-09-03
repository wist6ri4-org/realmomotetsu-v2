/**
 * @jest-environment node
 */

import { StatusCode } from "@/constants/statuscode";
import { BadRequestError, ConflictError } from "@/error";
import { StationType } from "@/generated/prisma";
import { buildPoints, buildTransitStation } from "../../../helpers/factories";
import {
    buildPostRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../helpers/apiRequest";

// CurrentLocationV3ApiHandlerはCurrentLocationV3ServiceImplを直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/current-location-v3/service", () => ({
    CurrentLocationV3ServiceImpl: {
        postCurrentLocationV3: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CurrentLocationV3ServiceImpl } = jest.requireMock("@/features/current-location-v3/service") as {
    CurrentLocationV3ServiceImpl: {
        postCurrentLocationV3: jest.Mock;
    };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import CurrentLocationV3ApiHandler from "@/app/api/current-location-v3/CurrentLocationV3ApiHandler";

describe("CurrentLocationV3ApiHandler", () => {
    const validBody = {
        eventCode: "EVENT_A",
        teamCode: "TEAM_A",
        stationCode: "STATION_A",
    };

    beforeEach(() => {
        silenceApiLogs();
        CurrentLocationV3ServiceImpl.postCurrentLocationV3.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("POST", () => {
        it("リクエストボディをServiceに渡し、登録結果を返す", async () => {
            const transitStation = buildTransitStation({ stationCode: "STATION_A" });
            CurrentLocationV3ServiceImpl.postCurrentLocationV3.mockResolvedValue({ transitStation });

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(await new CurrentLocationV3ApiHandler(req).handle());

            expect(CurrentLocationV3ServiceImpl.postCurrentLocationV3).toHaveBeenCalledWith(validBody);
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it("point・stationType・teamDiscordWebhookUrlを含む戻り値もそのままレスポンスに乗る", async () => {
            const transitStation = buildTransitStation({ stationCode: "STATION_A" });
            const point = buildPoints({ points: 5 });
            CurrentLocationV3ServiceImpl.postCurrentLocationV3.mockResolvedValue({
                transitStation,
                point,
                teamDiscordWebhookUrl: "https://discord.com/api/webhooks/sample",
                stationType: StationType.plus,
            });

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(await new CurrentLocationV3ApiHandler(req).handle());

            expect(status).toBe(StatusCode.OK);
            const data = body.data as Record<string, unknown>;
            expect(data.stationType).toBe(StationType.plus);
            expect(data.teamDiscordWebhookUrl).toBe("https://discord.com/api/webhooks/sample");
        });

        it.each([
            ["eventCodeがない", { teamCode: "TEAM_A", stationCode: "STATION_A" }],
            ["teamCodeが空文字", { ...validBody, teamCode: "" }],
            ["stationCodeが数値", { ...validBody, stationCode: 123 }],
        ])("ボディが不正な場合（%s）は400を返す", async (_label, body) => {
            const req = buildPostRequest(body);
            const { status } = await readResponse(await new CurrentLocationV3ApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(CurrentLocationV3ServiceImpl.postCurrentLocationV3).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合はステータスコードを引き継ぐ", async () => {
            CurrentLocationV3ServiceImpl.postCurrentLocationV3.mockRejectedValue(
                new ConflictError({ message: "conflict" }),
            );

            const req = buildPostRequest(validBody);
            const { status } = await readResponse(await new CurrentLocationV3ApiHandler(req).handle());

            expect(status).toBe(StatusCode.CONFLICT);
        });

        it("Serviceが投げたBadRequestErrorのステータスコードも引き継ぐ", async () => {
            CurrentLocationV3ServiceImpl.postCurrentLocationV3.mockRejectedValue(
                new BadRequestError({ message: "invalid" }),
            );

            const req = buildPostRequest(validBody);
            const { status } = await readResponse(await new CurrentLocationV3ApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含めない", async () => {
            CurrentLocationV3ServiceImpl.postCurrentLocationV3.mockRejectedValue(new Error("DB connection lost"));

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(await new CurrentLocationV3ApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB connection lost");
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["GET"], ["PUT"], ["DELETE"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(await new CurrentLocationV3ApiHandler(req).handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
