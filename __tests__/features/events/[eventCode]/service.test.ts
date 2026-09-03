/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { EventByEventCodeServiceImpl } from "@/features/events/[eventCode]/service";
import { TEST_EVENT_CODE, buildEvent } from "../../../helpers/factories";
import { mockRepositories } from "../../../helpers/repositoryMocks";

describe("EventByEventCodeServiceImpl", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findByEventCode: jest.Mock;

    beforeEach(() => {
        findByEventCode = jest.fn().mockResolvedValue(buildEvent());

        mockRepositories({ events: { findByEventCode } });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getEventByEventCode", () => {
        it("イベントコードで取得したイベントをそのまま返す", async () => {
            const event = buildEvent({ eventCode: TEST_EVENT_CODE, eventName: "テストイベントA" });
            findByEventCode.mockResolvedValue(event);

            const res = await EventByEventCodeServiceImpl.getEventByEventCode({ eventCode: TEST_EVENT_CODE });

            expect(findByEventCode).toHaveBeenCalledWith(TEST_EVENT_CODE);
            expect(res.event).toEqual(event);
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            findByEventCode.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                EventByEventCodeServiceImpl.getEventByEventCode({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "conflict" });
            findByEventCode.mockRejectedValue(apiError);

            await expect(
                EventByEventCodeServiceImpl.getEventByEventCode({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toBe(apiError);
        });
    });
});
