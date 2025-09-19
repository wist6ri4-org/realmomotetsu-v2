import { TeamData } from "@/types/TeamData";

export class GameLogicUtils {
    /**
     * ボンビーを決める
     * @param {TeamData[]} teamData - チームデータの配列
     * @returns {TeamData} ボンビーを持つチームデータ
     */
    static confirmBombii(teamData: TeamData[]): TeamData {
        const candidateTeams: TeamData[] = teamData.reduce(
            (candidates: TeamData[], team: TeamData) => {
                if (candidates.length === 0) {
                    return [team];
                }

                const cr = candidates[0].remainingStationsNumber;
                const ir = team.remainingStationsNumber;
                const cc = candidates[0].scoredPoints;
                const ic = team.scoredPoints;

                // 目的駅から遠いほうがボンビー
                if (cr > ir) {
                    return candidates;
                } else if (cr < ir) {
                    return [team];
                } else {
                    // 目的からの距離が同じ場合、総資産が多いほうがボンビー
                    if (cc > ic) {
                        return candidates;
                    } else if (cc < ic) {
                        return [team];
                    } else {
                        // 総資産も同じ場合両方を返す
                        return [...candidates, team];
                    }
                }
            },
            []
        );

        const bombiiTeam = candidateTeams[Math.floor(Math.random() * candidateTeams.length)];
        return bombiiTeam;
    }
}
