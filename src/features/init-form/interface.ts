import { Stations } from "@/generated/prisma";

export interface InitFormService {

    /**
     * ホーム画面の初期化データを取得する
     * @returns {Promise<InitHome[]>} ホーム画面の初期化
     */
    getDataForForm: () => Promise<Stations[]>;
}