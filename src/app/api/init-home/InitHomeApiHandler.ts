import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { InitHomeServiceImpl } from "@/features/init-home/service";

class InitHomeApiHandler extends BaseApiHandler {
    constructor(req: NextRequest) {
        super(req);
    }

    protected getHandlers(): Handlers {
        return {
            GET: this.handleGet.bind(this),
            // 必要に応じてPOST, PUT, DELETEも追加
        };
    }

    private async handleGet(req: NextRequest): Promise<NextResponse> {
        this.logInfo("Handling GET request for init-home");

        try {
            // クエリパラメータからeventCodeを取得
            const { searchParams } = new URL(req.url);
            const eventCode = searchParams.get("eventCode");

            if (!eventCode) {
                this.logInfo("eventCode parameter is missing");
                return this.createErrorResponse("eventCode parameter is required", 400);
            }

            this.logDebug("Request parameters", { eventCode });

            // サービスからデータを取得
            const data = await InitHomeServiceImpl.getDataForHome({ eventCode });

            this.logInfo("Successfully retrieved init-home data", {
                teamDataCount: data.teamData.length,
                hasNextGoal: !!data.nextGoalStation,
                hasBombiiTeam: !!data.bombiiTeam,
            });

            return this.createSuccessResponse(data);
        } catch (error) {
            this.logError(error);
            throw error; // BaseApiHandlerがエラーハンドリングを行う
        }
    }
}

export default InitHomeApiHandler;
