/**
 * @jest-environment node
 */

jest.mock("@/utils/discordUtils", () => ({
    getDiscordNotifier: jest.fn(),
}));

import { DiscordNotifyServiceImpl } from "@/features/discord/notify/service";

const { getDiscordNotifier } = jest.requireMock("@/utils/discordUtils");

describe("DiscordNotifyServiceImpl", () => {
    /** 各テストで参照するnotifierのモックメソッド */
    let sendNotification: jest.Mock;

    beforeEach(() => {
        sendNotification = jest.fn().mockResolvedValue(undefined);
        getDiscordNotifier.mockReturnValue({ sendNotification });
        // serviceが送信結果をconsole.log/warn/errorに直接出力するため、テスト結果を読みやすくするために抑止する
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "warn").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("postDiscordNotify", () => {
        it("通知の送信に成功した場合はsuccess:trueを返す", async () => {
            const res = await DiscordNotifyServiceImpl.postDiscordNotify({
                discordWebhookUrl: "https://discord.com/api/webhooks/sample",
                templateName: "goal.json",
                variables: { teamName: "チームA" },
            });

            expect(getDiscordNotifier).toHaveBeenCalledWith("https://discord.com/api/webhooks/sample");
            expect(sendNotification).toHaveBeenCalledWith("goal.json", { teamName: "チームA" }, false);
            expect(res).toEqual({ success: true });
        });

        it("variablesを指定しない場合は空オブジェクトで送信する", async () => {
            await DiscordNotifyServiceImpl.postDiscordNotify({
                discordWebhookUrl: "https://discord.com/api/webhooks/sample",
                templateName: "goal.json",
            });

            expect(sendNotification).toHaveBeenCalledWith("goal.json", {}, false);
        });

        it("テンプレート名が.txtで終わる場合はisTextTemplateにtrueを渡す", async () => {
            await DiscordNotifyServiceImpl.postDiscordNotify({
                discordWebhookUrl: "https://discord.com/api/webhooks/sample",
                templateName: "simple.txt",
            });

            expect(sendNotification).toHaveBeenCalledWith("simple.txt", {}, true);
        });

        it("テンプレート名が.txt以外で終わる場合はisTextTemplateにfalseを渡す", async () => {
            await DiscordNotifyServiceImpl.postDiscordNotify({
                discordWebhookUrl: "https://discord.com/api/webhooks/sample",
                templateName: "goal.json",
            });

            expect(sendNotification).toHaveBeenCalledWith("goal.json", {}, false);
        });

        it("Discord通知が無効化されている場合はエラーでもsuccess:trueを返す", async () => {
            sendNotification.mockRejectedValue(new Error("Discord notifications are not enabled"));

            const res = await DiscordNotifyServiceImpl.postDiscordNotify({
                discordWebhookUrl: "https://discord.com/api/webhooks/sample",
                templateName: "goal.json",
            });

            expect(res).toEqual({ success: true });
        });

        it("それ以外のエラーの場合は例外を投げずsuccess:falseを返す", async () => {
            sendNotification.mockRejectedValue(new Error("Discord API error: 500 Internal Server Error"));

            const res = await DiscordNotifyServiceImpl.postDiscordNotify({
                discordWebhookUrl: "https://discord.com/api/webhooks/sample",
                templateName: "goal.json",
            });

            expect(res).toEqual({ success: false });
        });

        it("Error以外がスローされた場合も例外を投げずsuccess:falseを返す", async () => {
            sendNotification.mockRejectedValue("unexpected failure");

            const res = await DiscordNotifyServiceImpl.postDiscordNotify({
                discordWebhookUrl: "https://discord.com/api/webhooks/sample",
                templateName: "goal.json",
            });

            expect(res).toEqual({ success: false });
        });
    });
});
