/**
 * @jest-environment node
 */

import { StatusCode } from "@/constants/statuscode";
import { ExternalServiceError, BadRequestError } from "@/error";
import {
    buildPostRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../../helpers/apiRequest";

// DiscordNotifyApiHandlerはDiscordNotifyServiceImplを直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/discord/notify/service", () => ({
    DiscordNotifyServiceImpl: {
        postDiscordNotify: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DiscordNotifyServiceImpl } = jest.requireMock("@/features/discord/notify/service") as {
    DiscordNotifyServiceImpl: {
        postDiscordNotify: jest.Mock;
    };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import DiscordNotifyApiHandler from "@/app/api/discord/notify/DiscordNotifyApiHandler";

describe("DiscordNotifyApiHandler", () => {
    const validBody = {
        discordWebhookUrl: "https://discord.com/api/webhooks/sample",
        templateName: "arrival",
        variables: { teamName: "チームA" },
    };

    beforeEach(() => {
        silenceApiLogs();
        DiscordNotifyServiceImpl.postDiscordNotify.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("POST", () => {
        it("リクエストボディをServiceに渡し、通知結果を返す", async () => {
            DiscordNotifyServiceImpl.postDiscordNotify.mockResolvedValue({ success: true });

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(await new DiscordNotifyApiHandler(req).handle());

            expect(DiscordNotifyServiceImpl.postDiscordNotify).toHaveBeenCalledWith(validBody);
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
            expect((body.data as { success: boolean }).success).toBe(true);
        });

        it("variablesを省略しても登録できる", async () => {
            DiscordNotifyServiceImpl.postDiscordNotify.mockResolvedValue({ success: true });
            const { variables: _variables, ...bodyWithoutVariables } = validBody;

            const req = buildPostRequest(bodyWithoutVariables);
            const { status } = await readResponse(await new DiscordNotifyApiHandler(req).handle());

            expect(status).toBe(StatusCode.OK);
            expect(DiscordNotifyServiceImpl.postDiscordNotify).toHaveBeenCalledWith(bodyWithoutVariables);
        });

        it.each([
            ["discordWebhookUrlがURL形式でない", { ...validBody, discordWebhookUrl: "not-a-url" }],
            ["templateNameがない", { discordWebhookUrl: validBody.discordWebhookUrl, variables: {} }],
            ["variablesの値が数値", { ...validBody, variables: { count: 1 } }],
        ])("ボディが不正な場合（%s）は400を返す", async (_label, body) => {
            const req = buildPostRequest(body);
            const { status } = await readResponse(await new DiscordNotifyApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(DiscordNotifyServiceImpl.postDiscordNotify).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合はステータスコードを引き継ぐ", async () => {
            DiscordNotifyServiceImpl.postDiscordNotify.mockRejectedValue(
                new ExternalServiceError("Discord"),
            );

            const req = buildPostRequest(validBody);
            const { status } = await readResponse(await new DiscordNotifyApiHandler(req).handle());

            expect(status).toBe(StatusCode.SERVICE_UNAVAILABLE);
        });

        it("Serviceが投げたBadRequestErrorのステータスコードも引き継ぐ", async () => {
            DiscordNotifyServiceImpl.postDiscordNotify.mockRejectedValue(
                new BadRequestError({ message: "invalid" }),
            );

            const req = buildPostRequest(validBody);
            const { status } = await readResponse(await new DiscordNotifyApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含めない", async () => {
            DiscordNotifyServiceImpl.postDiscordNotify.mockRejectedValue(new Error("webhook request failed"));

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(await new DiscordNotifyApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("webhook request failed");
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["GET"], ["PUT"], ["DELETE"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(await new DiscordNotifyApiHandler(req).handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
