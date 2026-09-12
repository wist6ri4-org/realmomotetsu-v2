/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiHandler, createApiHandlerWithParams } from "@/app/api/utils/apiHandler";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { silenceApiLogs, buildRequestWithMethod } from "../../../helpers/apiRequest";

describe("createApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("リクエストごとにハンドラークラスをインスタンス化し、handle()の結果を返す", async () => {
        const handleMock = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));

        class DummyHandler extends BaseApiHandler {
            protected getHandlers(): Handlers {
                return {};
            }
            handle(): Promise<NextResponse> {
                return handleMock();
            }
        }

        const routeHandler = createApiHandler(DummyHandler);
        const req = buildRequestWithMethod("GET");

        const response = await routeHandler(req);

        expect(handleMock).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(200);
    });

    it("リクエストごとに新しいインスタンスを生成する", async () => {
        const constructorSpy = jest.fn();

        class DummyHandler extends BaseApiHandler {
            constructor(req: NextRequest) {
                super(req);
                constructorSpy(req);
            }
            protected getHandlers(): Handlers {
                return {};
            }
            handle(): Promise<NextResponse> {
                return Promise.resolve(NextResponse.json({}));
            }
        }

        const routeHandler = createApiHandler(DummyHandler);
        await routeHandler(buildRequestWithMethod("GET"));
        await routeHandler(buildRequestWithMethod("POST"));

        expect(constructorSpy).toHaveBeenCalledTimes(2);
    });
});

describe("createApiHandlerWithParams", () => {
    beforeEach(() => {
        silenceApiLogs();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("Promiseで渡されたパスパラメータをawaitしてからハンドラーに渡す", async () => {
        const constructorSpy = jest.fn();

        class DummyHandlerWithParams extends BaseApiHandler {
            constructor(req: NextRequest, params: { eventCode: string }) {
                super(req);
                constructorSpy(params);
            }
            protected getHandlers(): Handlers {
                return {};
            }
            handle(): Promise<NextResponse> {
                return Promise.resolve(NextResponse.json({}));
            }
        }

        const routeHandler = createApiHandlerWithParams(DummyHandlerWithParams);
        const req = buildRequestWithMethod("GET");

        await routeHandler(req, { params: Promise.resolve({ eventCode: "EVENT_A" }) });

        expect(constructorSpy).toHaveBeenCalledWith({ eventCode: "EVENT_A" });
    });
});
