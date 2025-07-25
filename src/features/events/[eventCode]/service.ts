import { EventByEventCodeService } from "./interface";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { GetEventByEventCodeRequest } from "./types";
import { Events } from "@/generated/prisma";

export const EventByEventCodeServiceImpl: EventByEventCodeService = {

    /**
     * イベントコードでイベントを取得する
     * @param {GetEventByEventCodeRequest} req - イベントを取得するためのリクエスト
     * @returns {Promise<Events | null>} イベント情報
     */
    async getEventByEventCode(req: GetEventByEventCodeRequest): Promise<Events | null> {
        const eventsRepository = RepositoryFactory.getEventsRepository();

        try {
            return await eventsRepository.findByEventCode(req.eventCode);
        } catch (error) {
            console.error("Error in getEventByEventCode:", error);
            throw new Error("Failed to get events by event code");
        }
    },
};
