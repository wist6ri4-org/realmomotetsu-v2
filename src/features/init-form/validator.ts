import { closestStationSchema } from "@/types/ClosestStation";
import { z } from "zod";

// フォームページのリクエストスキーマ
export const InitFormRequestSchema = z.object({
    eventCode: z.string().min(1, "Event code is required"),
    longitude: z
        .string()
        .optional()
        .transform((val) => {
            if (!val) return undefined;
            const num = parseFloat(val);
            if (isNaN(num)) throw new Error("Invalid longitude format");
            return num;
        }),
    latitude: z
        .string()
        .optional()
        .transform((val) => {
            if (!val) return undefined;
            const num = parseFloat(val);
            if (isNaN(num)) throw new Error("Invalid latitude format");
            return num;
        }),
});

// フォームページのレスポンススキーマ
export const InitFormResponseSchema = z.object({
    closestStations: z.array(closestStationSchema).optional(),
});
