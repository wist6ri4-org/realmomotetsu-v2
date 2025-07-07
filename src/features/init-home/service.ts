import { prisma } from "@/lib/prisma";
import { InitHomeService } from "./interface";
import { InitHomeRequest, InitHomeResponse } from "./types";

export const InitHomeServiceImpl: InitHomeService = {
    /**
     * ホーム画面の初期化データを取得する
     * @returns {Promise<InitHome[]>} ホーム画面の初期化データの配列
     */
    async getDataForHome(req: InitHomeRequest): Promise<InitHomeResponse> {
        const res: InitHomeResponse = {
            teamData: [],
            nextGoalStation: null,
            bombiiTeam: null,
        };


        return res;
    }
}