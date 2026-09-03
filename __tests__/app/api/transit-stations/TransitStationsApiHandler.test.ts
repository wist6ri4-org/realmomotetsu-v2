/**
 * @jest-environment node
 */

import { BadRequestError, ConflictError } from "@/error";
import { buildStation, buildTransitStation } from "../../../helpers/factories";
import {
    buildGetRequest,
    buildPostRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../helpers/apiRequest";
import { StatusCode } from "@/constants/statuscode";

// TransitStationsApiHandlerはTransitStationsServiceImplを直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/transit-stations/service", () => ({
    TransitStationsServiceImpl: {
        getTransitStationsByEventCodeGroupedByTeamCode: jest.fn(),
        postTransitStations: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TransitStationsServiceImpl } = jest.requireMock("@/features/transit-stations/service") as {
    TransitStationsServiceImpl: {
        getTransitStationsByEventCodeGroupedByTeamCode: jest.Mock;
        postTransitStations: jest.Mock;
    };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import TransitStationsApiHandler from "@/app/api/transit-stations/TransitStationsApiHandler";

describe("TransitStationsApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        TransitStationsServiceImpl.getTransitStationsByEventCodeGroupedByTeamCode.mockReset();
        TransitStationsServiceImpl.postTransitStations.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("GET", () => {
        it("イベントコードをServiceに渡し、チームコードごとにグループ化された経由駅を返す", async () => {
            const transitStations = {
                TEAM_A: [{ ...buildTransitStation(), station: buildStation() }],
            };
            TransitStationsServiceImpl.getTransitStationsByEventCodeGroupedByTeamCode.mockResolvedValue({
                transitStations,
            });

            const req = buildGetRequest({ eventCode: "EVENT_A" });
            const { status, body } = await readResponse(await new TransitStationsApiHandler(req).handle());

            expect(TransitStationsServiceImpl.getTransitStationsByEventCodeGroupedByTeamCode).toHaveBeenCalledWith({
                eventCode: "EVENT_A",
            });
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it("eventCodeが欠けている場合は400を返し、Serviceを呼ばない", async () => {
            const req = buildGetRequest({});
            const { status, body } = await readResponse(await new TransitStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
            expect(TransitStationsServiceImpl.getTransitStationsByEventCodeGroupedByTeamCode).not.toHaveBeenCalled();
        });

        it("eventCodeが空文字の場合は400を返す", async () => {
            const req = buildGetRequest({ eventCode: "" });
            const { status } = await readResponse(await new TransitStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(TransitStationsServiceImpl.getTransitStationsByEventCodeGroupedByTeamCode).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合は対応するステータスコードを返す", async () => {
            TransitStationsServiceImpl.getTransitStationsByEventCodeGroupedByTeamCode.mockRejectedValue(
                new BadRequestError({ message: "invalid" }),
            );

            const req = buildGetRequest({ eventCode: "EVENT_A" });
            const { status } = await readResponse(await new TransitStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            TransitStationsServiceImpl.getTransitStationsByEventCodeGroupedByTeamCode.mockRejectedValue(
                new Error("DB down"),
            );

            const req = buildGetRequest({ eventCode: "EVENT_A" });
            const { status, body } = await readResponse(await new TransitStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB down");
        });

        it("Serviceの戻り値がレスポンススキーマを満たさない場合は400を返す", async () => {
            // 必須のstationリレーションを欠いた不正なデータ
            TransitStationsServiceImpl.getTransitStationsByEventCodeGroupedByTeamCode.mockResolvedValue({
                transitStations: { TEAM_A: [buildTransitStation()] },
            });

            const req = buildGetRequest({ eventCode: "EVENT_A" });
            const { status } = await readResponse(await new TransitStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
        });
    });

    describe("POST", () => {
        const validBody = {
            eventCode: "EVENT_A",
            teamCode: "TEAM_A",
            stationCode: "STATION_A",
        };

        it("リクエストボディをServiceに渡し、登録結果を返す", async () => {
            TransitStationsServiceImpl.postTransitStations.mockResolvedValue({
                transitStation: buildTransitStation(validBody),
            });

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(await new TransitStationsApiHandler(req).handle());

            expect(TransitStationsServiceImpl.postTransitStations).toHaveBeenCalledWith(validBody);
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it.each([
            ["eventCodeがない", { teamCode: "TEAM_A", stationCode: "STATION_A" }],
            ["teamCodeが空文字", { ...validBody, teamCode: "" }],
            ["stationCodeが数値", { ...validBody, stationCode: 123 }],
        ])("ボディが不正な場合（%s）は400を返し、Serviceを呼ばない", async (_label, body) => {
            const req = buildPostRequest(body);
            const { status } = await readResponse(await new TransitStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(TransitStationsServiceImpl.postTransitStations).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合はステータスコードを引き継ぐ", async () => {
            TransitStationsServiceImpl.postTransitStations.mockRejectedValue(
                new ConflictError({ message: "already exists" }),
            );

            const req = buildPostRequest(validBody);
            const { status } = await readResponse(await new TransitStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.CONFLICT);
        });

        it("Serviceが想定外のエラーを投げた場合は500を返す", async () => {
            TransitStationsServiceImpl.postTransitStations.mockRejectedValue(new Error("DB down"));

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(await new TransitStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB down");
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["PUT"], ["DELETE"], ["PATCH"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(await new TransitStationsApiHandler(req).handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
