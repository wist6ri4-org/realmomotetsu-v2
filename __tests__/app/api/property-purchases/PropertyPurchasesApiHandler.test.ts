/**
 * @jest-environment node
 */

import PropertyPurchasesApiHandler from "@/app/api/property-purchases/PropertyPurchasesApiHandler";
import { StatusCode } from "@/constants/statuscode";
import { BadRequestError, ConflictError, ResourceNotFoundError } from "@/error";
import { PropertyPurchasesService } from "@/features/property-purchases/interface";
import {
    TEST_EVENT_CODE,
    buildPropertyPurchase,
    buildPropertyPurchaseWithRelations,
} from "../../../helpers/factories";
import {
    buildGetRequest,
    buildPostRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../helpers/apiRequest";

describe("PropertyPurchasesApiHandler", () => {
    /** モックのService */
    let service: jest.Mocked<PropertyPurchasesService>;

    beforeEach(() => {
        silenceApiLogs();
        service = {
            getPropertyPurchasesByEventCode: jest.fn(),
            postPropertyPurchases: jest.fn(),
        } as unknown as jest.Mocked<PropertyPurchasesService>;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("GET", () => {
        it("クエリパラメータをServiceに渡し、取得結果を返す", async () => {
            const propertyPurchases = [buildPropertyPurchaseWithRelations({ id: 1 })];
            service.getPropertyPurchasesByEventCode.mockResolvedValue({ propertyPurchases });

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(
                await new PropertyPurchasesApiHandler(req, service).handle(),
            );

            expect(service.getPropertyPurchasesByEventCode).toHaveBeenCalledWith({
                eventCode: TEST_EVENT_CODE,
            });
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
            expect(body).toHaveProperty("requestId");
        });

        it("必須のクエリパラメータが欠けている場合は400を返す", async () => {
            const req = buildGetRequest({});
            const { status, body } = await readResponse(
                await new PropertyPurchasesApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
            expect(body.validationErrors).toEqual([
                expect.objectContaining({ field: "eventCode" }),
            ]);
            // バリデーションで弾かれるためServiceは呼ばれない
            expect(service.getPropertyPurchasesByEventCode).not.toHaveBeenCalled();
        });

        it("イベントコードが空文字の場合は400を返す", async () => {
            const req = buildGetRequest({ eventCode: "" });
            const { status } = await readResponse(
                await new PropertyPurchasesApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(service.getPropertyPurchasesByEventCode).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合は対応するステータスコードを返す", async () => {
            service.getPropertyPurchasesByEventCode.mockRejectedValue(
                new ResourceNotFoundError("Event", TEST_EVENT_CODE),
            );

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(
                await new PropertyPurchasesApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.NOT_FOUND);
            expect(body.errorCode).toBe("RESOURCE_NOT_FOUND");
        });

        it("Serviceが想定外のエラーを投げた場合は500を返す", async () => {
            service.getPropertyPurchasesByEventCode.mockRejectedValue(new Error("DB connection lost"));

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(
                await new PropertyPurchasesApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(body.error).toBe("Internal Server Error");
            // 内部のエラーメッセージが外部に漏れないこと
            expect(JSON.stringify(body)).not.toContain("DB connection lost");
        });

        it("Serviceの戻り値がレスポンススキーマを満たさない場合は400を返す", async () => {
            // 必須のリレーションを欠いた不正なデータ
            service.getPropertyPurchasesByEventCode.mockResolvedValue({
                propertyPurchases: [buildPropertyPurchase()],
            } as never);

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(
                await new PropertyPurchasesApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
        });
    });

    describe("POST", () => {
        const validBody = {
            eventCode: TEST_EVENT_CODE,
            teamCode: "TEAM_A",
            stationCode: "STATION_A",
        };

        it("リクエストボディをServiceに渡し、登録結果を返す", async () => {
            service.postPropertyPurchases.mockResolvedValue({
                propertyPurchase: buildPropertyPurchase(validBody),
            });

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(
                await new PropertyPurchasesApiHandler(req, service).handle(),
            );

            expect(service.postPropertyPurchases).toHaveBeenCalledWith(validBody);
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it.each([
            ["eventCodeがない", { teamCode: "TEAM_A", stationCode: "STATION_A" }],
            ["teamCodeが空文字", { ...validBody, teamCode: "" }],
            ["stationCodeが数値", { ...validBody, stationCode: 123 }],
        ])("ボディが不正な場合（%s）は400を返す", async (_label, body) => {
            const req = buildPostRequest(body);
            const { status } = await readResponse(
                await new PropertyPurchasesApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(service.postPropertyPurchases).not.toHaveBeenCalled();
        });

        // NOTE 不正なJSONはreq.json()がSyntaxErrorを投げるため、ZodErrorとして扱われず500になる。
        // クライアント起因のエラーなので本来は400が適切だが、現状の挙動として記録しておく。
        it("ボディがJSONとして解釈できない場合は500を返す", async () => {
            const req = buildPostRequest("{ not json");
            const { status } = await readResponse(
                await new PropertyPurchasesApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(service.postPropertyPurchases).not.toHaveBeenCalled();
        });

        it.each([
            [new ConflictError({ message: "already purchased" }), StatusCode.CONFLICT],
            [new BadRequestError({ message: "invalid" }), StatusCode.BAD_REQUEST],
        ])("ServiceがApiErrorを投げた場合はステータスコードを引き継ぐ", async (error, expectedStatus) => {
            service.postPropertyPurchases.mockRejectedValue(error);

            const req = buildPostRequest(validBody);
            const { status } = await readResponse(
                await new PropertyPurchasesApiHandler(req, service).handle(),
            );

            expect(status).toBe(expectedStatus);
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["PUT"], ["DELETE"], ["PATCH"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(
                await new PropertyPurchasesApiHandler(req, service).handle(),
            );

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
