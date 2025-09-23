import { EventByEventCodeService } from "./interface";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { GetEventByEventCodeRequest, GetEventByEventCodeResponse } from "./types";

export const EventByEventCodeServiceImpl: EventByEventCodeService = {
    /**
     * イベントコードでイベントを取得する
     * @param {GetEventByEventCodeRequest} req - リクエスト
     * @return {Promise<GetEventByEventCodeResponse>} レスポンス
     */
    async getEventByEventCode(
        req: GetEventByEventCodeRequest
    ): Promise<GetEventByEventCodeResponse> {
        const eventsRepository = RepositoryFactory.getEventsRepository();

        try {
            const event = await eventsRepository.findByEventCode(req.eventCode);
            const res: GetEventByEventCodeResponse = {
                event: event,
            };
            return res;
        } catch (error) {
            console.error("Error in getEventByEventCode:", error);
            throw new Error("Failed to get events by event code");
        }
    },
};
