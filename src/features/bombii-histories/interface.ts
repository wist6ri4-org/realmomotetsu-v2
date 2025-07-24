import { BombiiHistories } from "@/generated/prisma";
import { PostBombiiHistoriesRequest } from "./types";

export interface BombiiHistoriesService {
    /**
     * ボンビー履歴を登録する
     * @param req - リクエストデータ
     * @return {Promise<BombiiHistories>} 登録されたボンビー履歴
     */
    postBombiiHistories: (req: PostBombiiHistoriesRequest) => Promise<BombiiHistories>;
}
