/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { BombiiHistoriesServiceImpl } from "@/features/bombii-histories/service";
import { TEST_EVENT_CODE, buildBombiiHistory } from "../../helpers/factories";
import { mockRepositories } from "../../helpers/repositoryMocks";

describe("BombiiHistoriesServiceImpl", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let create: jest.Mock;

    beforeEach(() => {
        create = jest.fn().mockImplementation(async (data) => buildBombiiHistory(data));

        mockRepositories({ bombiiHistories: { create } });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("postBombiiHistories", () => {
        it("リクエストの内容でボンビー履歴を登録する", async () => {
            const req = {
                eventCode: TEST_EVENT_CODE,
                teamCode: "TEAM_A",
            };

            const res = await BombiiHistoriesServiceImpl.postBombiiHistories(req);

            expect(create).toHaveBeenCalledWith({
                eventCode: TEST_EVENT_CODE,
                teamCode: "TEAM_A",
            });
            expect(res.bombiiHistory).toMatchObject(req);
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            create.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                BombiiHistoriesServiceImpl.postBombiiHistories({
                    eventCode: TEST_EVENT_CODE,
                    teamCode: "TEAM_A",
                }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "already bombii" });
            create.mockRejectedValue(apiError);

            await expect(
                BombiiHistoriesServiceImpl.postBombiiHistories({
                    eventCode: TEST_EVENT_CODE,
                    teamCode: "TEAM_A",
                }),
            ).rejects.toBe(apiError);
        });
    });
});
