/**
 * @jest-environment node
 */

import { LogService } from "@/app/api/utils/logService";
import { LogContext } from "@/app/api/utils/types";

const buildContext = (overrides: Partial<LogContext> = {}): LogContext => ({
    method: "GET",
    url: "http://localhost/api/test",
    timestamp: "2026-01-01T00:00:00.000Z",
    requestId: "req_fixed_id",
    ...overrides,
});

describe("LogService", () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
        jest.restoreAllMocks();
        (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
    });

    describe("createLogContext", () => {
        it("リクエストからmethod/url/userAgentを抽出し、requestIdとtimestampを付与する", () => {
            const req = new Request("http://localhost/api/test", {
                method: "POST",
                headers: { "user-agent": "jest-test-agent" },
            });

            const context = LogService.createLogContext(req);

            expect(context.method).toBe("POST");
            expect(context.url).toBe("http://localhost/api/test");
            expect(context.userAgent).toBe("jest-test-agent");
            expect(context.requestId).toEqual(expect.stringMatching(/^req_\d+_[a-z0-9]+$/));
            expect(() => new Date(context.timestamp).toISOString()).not.toThrow();
        });

        it("user-agentヘッダーが無い場合はundefinedになる", () => {
            const req = new Request("http://localhost/api/test", { method: "GET" });

            const context = LogService.createLogContext(req);

            expect(context.userAgent).toBeUndefined();
        });

        it("呼び出すたびに異なるrequestIdを生成する", () => {
            const req = new Request("http://localhost/api/test");

            const first = LogService.createLogContext(req);
            const second = LogService.createLogContext(req);

            expect(first.requestId).not.toBe(second.requestId);
        });
    });

    describe("logAccess", () => {
        it("ステータスコードと応答時間を含むアクセスログを出力する", () => {
            const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            const context = buildContext();

            LogService.logAccess(context, 200, 42);

            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("[ACCESS]"),
            );
            const output = logSpy.mock.calls[0][0] as string;
            expect(output).toContain(context.requestId);
            expect(output).toContain(context.method);
            expect(output).toContain(context.url);
            expect(output).toContain("200");
            expect(output).toContain("42ms");
        });
    });

    describe("logError", () => {
        it("Errorインスタンスのメッセージとスタックトレースを出力する", () => {
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            const context = buildContext();
            const error = new Error("boom");

            LogService.logError(context, error);

            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining("[ERROR]"),
                expect.objectContaining({ error: "boom", stack: error.stack }),
            );
        });

        it("Errorインスタンスでない値はString化して出力する", () => {
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            const context = buildContext();

            LogService.logError(context, "unexpected string error");

            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining("[ERROR]"),
                expect.objectContaining({ error: "unexpected string error", stack: undefined }),
            );
        });
    });

    describe("logInfo", () => {
        it("メッセージと追加データを出力する", () => {
            const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            const context = buildContext();

            LogService.logInfo(context, "something happened", { foo: "bar" });

            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("[INFO]"),
                { foo: "bar" },
            );
            const output = logSpy.mock.calls[0][0] as string;
            expect(output).toContain("something happened");
        });
    });

    describe("logDebug", () => {
        it("development環境ではデバッグログを出力する", () => {
            (process.env as Record<string, string | undefined>).NODE_ENV = "development";
            const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
            const context = buildContext();

            LogService.logDebug(context, "debug message", { detail: 1 });

            expect(debugSpy).toHaveBeenCalled();
        });

        it("development環境以外ではデバッグログを出力しない", () => {
            (process.env as Record<string, string | undefined>).NODE_ENV = "test";
            const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
            const context = buildContext();

            LogService.logDebug(context, "debug message");

            expect(debugSpy).not.toHaveBeenCalled();
        });
    });
});
