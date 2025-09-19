export class MissionToolUtils {
    /**
     * 洗足池の面積を基に得点を計算するユーティリティ
     */
    static MissionSenzokuike = {
        SENZOKUIKE_AREA: 41000, // 洗足池の面積
        MAX_SCORE: 150, // 最大得点
        SCALE: 5000, // スケールパラメータ
        BASE_POINT: 50, // 基礎点
        JUST_BONUS: 50, // ジャストボーナス点

        /**
         * 洗足池の面積に基づいて得点を計算する
         * @param {number} answer - ユーザーの回答
         * @return {number} 計算された得点
         */
        calculate: (answer: number) => {
            const diff = Math.abs(answer - MissionToolUtils.MissionSenzokuike.SENZOKUIKE_AREA);
            let score = Math.round(
                MissionToolUtils.MissionSenzokuike.MAX_SCORE *
                    Math.exp(-1 * (diff / MissionToolUtils.MissionSenzokuike.SCALE) ** 2)
            );

            score += MissionToolUtils.MissionSenzokuike.BASE_POINT;
            if (answer === MissionToolUtils.MissionSenzokuike.SENZOKUIKE_AREA) {
                score += MissionToolUtils.MissionSenzokuike.JUST_BONUS;
            }
            return MissionToolUtils.MissionSenzokuike.round(score);
        },

        /**
         * 二捨三入を行なう
         * @param {number} score - 得点
         * @return {number} 二捨三入後の得点
         */
        round: (score: number): number => {
            const tens = Math.floor(score / 10);
            const ones = score % 10;

            if (ones <= 2) {
                return tens * 10;
            } else if (ones <= 7) {
                return tens * 10 + 5;
            } else {
                return (tens + 1) * 10;
            }
        },
    };
}
