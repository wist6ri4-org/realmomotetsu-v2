import { EventByEventCodeService } from "./interface";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { GetEventByEventCodeRequest, GetEventByEventCodeResponse } from "./types";
import { ApiError, InternalServerError } from "@/error";

export const EventByEventCodeServiceImpl: EventByEventCodeService = {
    /**
     * イベントコードでイベントを取得する
     * @param {GetEventByEventCodeRequest} req - リクエスト
     * @return {Promise<GetEventByEventCodeResponse>} レスポンス
     */
    async getEventByEventCode(req: GetEventByEventCodeRequest): Promise<GetEventByEventCodeResponse> {
        const eventsRepository = RepositoryFactory.getEventsRepository();

        try {
            const event = await eventsRepository.findByEventCode(req.eventCode);
            const res: GetEventByEventCodeResponse = {
                event: event,
            };
            return res;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${this.getEventByEventCode.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
