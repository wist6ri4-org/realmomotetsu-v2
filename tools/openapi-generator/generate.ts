/**
 * OpenAPI仕様書生成ツール
 *
 * src/app/api 配下の route.ts を走査してエンドポイント（パス・HTTPメソッド）を自動検出し、
 * 対応する src/features/<feature>/validator.ts の名前付きZodスキーマから
 * OpenAPI 3.1 ドキュメントを生成する。validator.ts 側への変更は不要。
 *
 * 使い方:
 *   npx tsx tools/openapi-generator/generate.ts
 *
 * 出力先: public/openapi/openapi.json（/api-docs ページが参照する）
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import "zod-openapi/extend";
import { z } from "zod";
import { createDocument, type ZodOpenApiPathsObject } from "zod-openapi";

const API_ROOT = resolve(__dirname, "../../src/app/api");
const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

type EndpointInfo = {
    urlPath: string; // 例: /api/points/bulk, /api/users/{uuid}
    relPath: string; // 例: points/bulk, users/[uuid]（posix区切り）
    methods: HttpMethod[];
};

const toPosix = (p: string): string => p.split("\\").join("/");

/** src/app/api 配下を再帰的に走査し、route.ts を持つエンドポイントを収集する */
function findEndpoints(dir: string, endpoints: EndpointInfo[] = []): EndpointInfo[] {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            findEndpoints(fullPath, endpoints);
            continue;
        }
        if (entry.name !== "route.ts") continue;

        const relPath = toPosix(relative(API_ROOT, dir));
        const urlPath = `/api/${relPath}`.replace(/\[(\w+)\]/g, "{$1}");
        const source = readFileSync(fullPath, "utf-8");
        const methods = HTTP_METHODS.filter((m) => new RegExp(`export const ${m} =`).test(source));

        if (methods.length > 0) {
            endpoints.push({ urlPath, relPath, methods });
        }
    }
    return endpoints;
}

// BaseApiHandler.createSuccessResponse() が返すレスポンス封筒（src/app/api/README.md参照）
const successEnvelope = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        data: dataSchema,
        requestId: z.string().openapi({ example: "req_1234567890_abc123" }),
        timestamp: z.string().openapi({ example: "2026-08-04T10:30:00.000Z" }),
    });

// BaseApiHandler.createApiErrorResponse() / createErrorResponse() の共通形式
const ErrorResponseSchema = z.object({
    error: z.string(),
    errorCode: z.string().nullable().optional(),
    // z.unknown()はOpenAPI上で type を持たない自由形式スキーマになるため、
    // .nullable() を付けると type のない nullable:true だけが残りSwagger UIの描画が壊れる
    details: z.unknown().optional(),
    requestId: z.string(),
    timestamp: z.string(),
});

const errorResponses = {
    "400": {
        description: "Bad Request（Zodバリデーションエラー、または ApiError のサブクラス）",
        content: { "application/json": { schema: ErrorResponseSchema } },
    },
    "500": {
        description: "Internal Server Error",
        content: { "application/json": { schema: ErrorResponseSchema } },
    },
} as const;

/** スキーマ定義の直前に書かれた `// 〜` コメントをdescriptionとして拾う */
function extractLeadingComment(source: string, exportName: string): string | undefined {
    const re = new RegExp(`//\\s*(.+)\\r?\\n\\s*export const ${exportName}\\b`);
    return re.exec(source)?.[1]?.trim();
}

/** URLパスの {param} 部分を抽出する（例: /api/users/{uuid} -> ["uuid"]） */
function extractPathParamNames(urlPath: string): string[] {
    return [...urlPath.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
}

/**
 * リクエストスキーマをパスパラメータ相当のフィールドとそれ以外に分割する。
 * users/[uuid] のように、1つのZodオブジェクトにパスパラメータとボディ項目が
 * 混在しているケース（例: PutUsersByUuidRequestScheme に uuid と nickname 等が同居）に対応する。
 */
function splitPathParams(
    schema: z.ZodTypeAny | undefined,
    pathParamNames: string[]
): { pathSchema?: z.AnyZodObject; restSchema?: z.ZodTypeAny } {
    if (pathParamNames.length === 0) {
        return { restSchema: schema };
    }

    const pathShape: Record<string, z.ZodTypeAny> = {};
    const restShape: Record<string, z.ZodTypeAny> = schema instanceof z.ZodObject ? { ...schema.shape } : {};

    for (const name of pathParamNames) {
        pathShape[name] = restShape[name] ?? z.string();
        delete restShape[name];
    }

    const restSchema =
        schema === undefined
            ? undefined
            : schema instanceof z.ZodObject
              ? Object.keys(restShape).length > 0
                  ? z.object(restShape)
                  : undefined
              : schema; // ZodObjectでない場合はパス分割せずそのまま扱う

    return { pathSchema: z.object(pathShape), restSchema };
}

async function buildPathItem(endpoint: EndpointInfo): Promise<ZodOpenApiPathsObject[string] | null> {
    const validatorFsPath = resolve(__dirname, `../../src/features/${endpoint.relPath}/validator.ts`);
    if (!existsSync(validatorFsPath)) {
        console.warn(`  x validator.ts not found for ${endpoint.urlPath}, skipping`);
        return null;
    }

    const importSpecifier = `../../src/features/${endpoint.relPath}/validator`;
    const moduleExports: Record<string, unknown> = await import(importSpecifier);
    const source = readFileSync(validatorFsPath, "utf-8");
    const exportNames = Object.keys(moduleExports);
    const requestExportNames = exportNames.filter((n) => /Request(Schema|Scheme)$/.test(n));
    const responseExportNames = exportNames.filter((n) => /Response(Schema|Scheme)$/.test(n));
    const pathParamNames = extractPathParamNames(endpoint.urlPath);

    const pathItem: Record<string, unknown> = {};

    for (const method of endpoint.methods) {
        const capMethod = method.charAt(0) + method.slice(1).toLowerCase(); // Get / Post / Put / Delete / Patch
        const isSingleMethodEndpoint = endpoint.methods.length === 1;

        const requestName =
            requestExportNames.find((n) => n.startsWith(capMethod)) ??
            (isSingleMethodEndpoint && requestExportNames.length === 1 ? requestExportNames[0] : undefined);
        const responseName =
            responseExportNames.find((n) => n.startsWith(capMethod)) ??
            (isSingleMethodEndpoint && responseExportNames.length === 1 ? responseExportNames[0] : undefined);

        if (!responseName) {
            console.warn(`  x ${method} ${endpoint.urlPath}: response schema not found, skipping method`);
            continue;
        }

        const requestSchema = requestName ? (moduleExports[requestName] as z.ZodTypeAny) : undefined;
        const responseSchema = moduleExports[responseName] as z.ZodTypeAny;
        const description = requestName ? extractLeadingComment(source, requestName) : undefined;

        const { pathSchema, restSchema } = splitPathParams(requestSchema, pathParamNames);

        const requestParams: Record<string, z.ZodTypeAny> = {};
        if (pathSchema) requestParams.path = pathSchema;
        if (restSchema && (method === "GET" || method === "DELETE")) requestParams.query = restSchema;

        const operation: Record<string, unknown> = {
            summary: `${method} ${endpoint.urlPath}`,
            ...(description ? { description } : {}),
            ...(Object.keys(requestParams).length > 0 ? { requestParams } : {}),
            ...(restSchema && method !== "GET" && method !== "DELETE"
                ? { requestBody: { content: { "application/json": { schema: restSchema } } } }
                : {}),
            responses: {
                "200": {
                    description: "OK",
                    content: { "application/json": { schema: successEnvelope(responseSchema) } },
                },
                ...errorResponses,
            },
        };

        pathItem[method.toLowerCase()] = operation;
    }

    return Object.keys(pathItem).length > 0 ? (pathItem as ZodOpenApiPathsObject[string]) : null;
}

async function main() {
    const endpoints = findEndpoints(API_ROOT);
    console.log(`Found ${endpoints.length} endpoint(s) under src/app/api`);

    const paths: ZodOpenApiPathsObject = {};
    for (const endpoint of endpoints) {
        const pathItem = await buildPathItem(endpoint);
        if (pathItem) {
            paths[endpoint.urlPath] = pathItem;
        }
    }

    const document = createDocument({
        // 3.1.0だとnullableなフィールドが `"type": ["string", "null"]` 形式で出力され、
        // Swagger UIのモデル描画がこの表現に対応しきれずエラーになるため3.0.0を使う
        openapi: "3.0.0",
        info: {
            title: "Real Momotetsu V2 API",
            version: "0.1.0",
            description:
                "src/app/api 配下の route.ts と src/features/*/validator.ts から自動生成されたAPI仕様書。" +
                "手動で編集せず、`npx tsx tools/openapi-generator/generate.ts` を再実行して更新すること。",
        },
        servers: [{ url: "http://localhost:3001" }],
        paths,
    });

    const outputPath = resolve(__dirname, "../../public/openapi/openapi.json");
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(document, null, 2) + "\n", "utf-8");

    console.log(`OpenAPI document written to ${outputPath} (${Object.keys(paths).length} path(s))`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
