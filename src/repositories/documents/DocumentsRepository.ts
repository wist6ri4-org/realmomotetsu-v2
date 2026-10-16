import { Documents } from "@/generated/prisma";
import { BaseRepository } from "../base/BaseRepository";

/**
 * ドキュメント関連のデータアクセス処理を担当するRepository
 */
export class DocumentsRepository extends BaseRepository {
    /**
     * イベントコードでドキュメントを取得
     * @param eventCode - イベントコード
     * @return {Promise<Documents[]>} ドキュメントの配列
     */
    async findByEventCode(eventCode: string): Promise<Documents[]> {
        try {
            return await this.prisma.documents.findMany({
                where: {
                    eventCode: eventCode,
                },
                orderBy: [
                    {
                        order: "asc",
                    },
                    {
                        id: "asc",
                    },
                ],
            });
        } catch (error) {
            this.handleDatabaseError(error, "findByEventCode");
        }
    }
}
