import supabase from "@/lib/supabase";
import { PutUsersResponse } from "@/features/users/types";

export class UserUtils {
    /**
     * ユーザーのアイコンをアップロードする
     * @param file アップロードするファイル
     * @param userId ユーザーID
     * @return アップロードされたファイルの公開URL
     */
    // async uploadUserIcon(file: File, userId: string): Promise<string | null> {
    //     const bucketName = "user-assets";

    //     // 現在のセッションを確認
    //     const {
    //         data: { session },
    //     } = await supabase.auth.getSession();
    //     if (!session?.access_token) {
    //         throw new Error("認証が必要です。ログインしてください。");
    //     }

    //     // 現在のユーザーがアップロード対象のユーザーと一致するかチェック
    //     if (session.user.id !== userId) {
    //         throw new Error("自分のアイコンのみアップロードできます。");
    //     }

    //     // バケットの存在確認と作成
    //     await this.ensureBucketExists(bucketName);

    //     const fileExtension = file.name.split(".").pop();
    //     const fileName = `user-icons/${userId}.${fileExtension}`;

    //     console.log("Uploading file:", { fileName, bucketName, userId: session.user.id });

    //     const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file, {
    //         upsert: true,
    //     });
    //     console.log("Upload result:", data, error);

    //     if (error) {
    //         // より詳細なエラーメッセージを提供
    //         if (error.message.includes("Bucket not found")) {
    //             throw new Error(
    //                 `ストレージバケット「${bucketName}」が見つかりません。` +
    //                     `Supabaseダッシュボードでバケットを作成してください。` +
    //                     `\n1. Supabaseダッシュボードの「Storage」セクションにアクセス` +
    //                     `\n2. 「New bucket」をクリック` +
    //                     `\n3. バケット名：「${bucketName}」、Public: ON で作成`
    //             );
    //         }
    //         if (error.message.includes("new row violates row-level security policy")) {
    //             throw new Error(
    //                 `ストレージのアクセス権限が設定されていません。` +
    //                     `Supabaseダッシュボードでストレージポリシーを設定してください。` +
    //                     `詳細は setup_user_storage.md を参照してください。`
    //             );
    //         }
    //         throw error;
    //     }

    //     const {
    //         data: { publicUrl },
    //     } = supabase.storage.from(bucketName).getPublicUrl(fileName);

    //     return publicUrl;
    // }

    async uploadUserIcon(file: File, userId: string): Promise<string | null> {
        const bucketName = "user-assets";

        // 現在のセッションを確認
        const {
            data: { session },
        } = await supabase.auth.getSession();

        console.log("=== デバッグ情報 ===");
        console.log("Session:", session);
        console.log("Session user:", session?.user);
        console.log("Auth UID:", session?.user?.id);
        console.log("Target userId:", userId);
        console.log("Match:", session?.user?.id === userId);

        if (!session?.access_token) {
            throw new Error("認証されていません");
        }

        // 現在のユーザーがアップロード対象のユーザーと一致するかチェック
        if (session.user.id !== userId) {
            throw new Error("他のユーザーのアイコンは変更できません");
        }

        // バケットの存在確認と作成
        // await this.ensureBucketExists(bucketName);

        const fileExtension = file.name.split(".").pop();
        const fileName = `user-icons/${userId}.${fileExtension}`;

        console.log("=== アップロード情報 ===");
        console.log("FileName:", fileName);
        console.log("BucketName:", bucketName);
        console.log("File size:", file.size);
        console.log("File type:", file.type);

        // フォルダ名の分析をテスト
        const folderParts = fileName.split("/");
        console.log("Folder parts:", folderParts);
        console.log("Folder[0] (should be 'user-icons'):", folderParts[0]);
        console.log("Folder[1] (should be userId):", folderParts[1]?.split(".")[0]);

        const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file, {
            upsert: true,
        });

        console.log("=== アップロード結果 ===");
        console.log("Upload data:", data);
        console.log("Upload error:", error);

        if (error) {
            console.error("Upload failed:", error);
            throw error;
        }

        // 公開URLを生成
        const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        console.log("Public URL:", urlData.publicUrl);

        return urlData.publicUrl;
    }

    /**
     * バケットの存在確認と作成
     * @param bucketName バケット名
     */
    private async ensureBucketExists(bucketName: string): Promise<void> {
        try {
            // バケットの一覧を取得して存在確認
            const { data: buckets, error: listError } = await supabase.storage.listBuckets();

            if (listError) {
                console.warn("Failed to list buckets:", listError);
                return; // エラーが発生した場合は作成をスキップ
            }

            const bucketExists = buckets?.some((bucket) => bucket.name === bucketName);

            if (!bucketExists) {
                // バケットが存在しない場合は作成
                const { error: createError } = await supabase.storage.createBucket(bucketName, {
                    public: true, // アイコンは公開アクセス可能にする
                    allowedMimeTypes: ["image/*"], // 画像ファイルのみ許可
                    fileSizeLimit: 5242880, // 5MB制限
                });

                if (createError) {
                    console.warn("Failed to create bucket:", createError);
                    // バケット作成に失敗した場合でも、アップロードを試行する
                    // （手動で作成されている可能性があるため）
                }
            }
        } catch (error) {
            console.warn("Error ensuring bucket exists:", error);
            // エラーが発生した場合でも処理を続行
        }
    }

    /**
     * ユーザーのニックネームを更新する
     * @param userId ユーザーUUID
     * @param nickname 新しいニックネーム
     * @return 更新されたユーザー情報
     */
    async updateUserNickname(userId: string, nickname: string): Promise<PutUsersResponse> {
        // 現在のセッションからアクセストークンを取得
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
            throw new Error("認証が必要です。ログインしてください。");
        }

        const response = await fetch(`/api/users/${userId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                nickname,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                `ニックネームの更新に失敗しました: ${error.message || "Unknown error"}`
            );
        }

        return await response.json();
    }

    /**
     * ユーザーのメールアドレスを更新する
     * @param userId ユーザーUUID
     * @param email 新しいメールアドレス
     * @return 更新されたユーザー情報
     */
    async updateUserEmail(userId: string, email: string): Promise<PutUsersResponse> {
        // 現在のセッションからアクセストークンを取得
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
            throw new Error("認証が必要です。ログインしてください。");
        }

        // Supabase Authでメールアドレスを更新
        const { error: authError } = await supabase.auth.updateUser({
            email: email,
        });

        if (authError) {
            throw new Error(`Authでのメールアドレス更新に失敗しました: ${authError.message}`);
        }

        // データベースのユーザー情報も更新
        const response = await fetch(`/api/users/${userId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                email,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                `データベースでのメールアドレス更新に失敗しました: ${
                    error.message || "Unknown error"
                }`
            );
        }

        return await response.json();
    }

    /**
     * ユーザーのアイコンを削除する
     * @param userId ユーザーID
     */
    async deleteUserIcon(userId: string): Promise<void> {
        const fileName = `user-icons/${userId}`;

        const { error } = await supabase.storage.from("user-assets").remove([fileName]);

        if (error) throw error;
    }

    /**
     * ユーザーのアイコンのURLを取得する
     * @param userId ユーザーID
     * @return アイコンのURL
     */
    getUserIconUrl(userId: string): string {
        return supabase.storage.from("user-assets").getPublicUrl(`user-icons/${userId}`).data
            .publicUrl;
    }

    /**
     * ユーザーのアイコンのURLを動的に取得する（拡張子を推定）
     * @param userId ユーザーID
     * @return アイコンのURL（存在しない場合はnull）
     */
    async getUserIconUrlWithExtension(userId: string): Promise<string | null> {
        const bucketName = "user-assets";
        const possibleExtensions = ["png", "jpg", "jpeg", "gif", "webp"];

        // 各拡張子を試してファイルが存在するかチェック
        for (const ext of possibleExtensions) {
            try {
                const fileName = `user-icons/${userId}.${ext}`;
                const { data, error } = await supabase.storage.from(bucketName).download(fileName);

                if (data && !error) {
                    // ファイルが存在する場合は公開URLを返す
                    return supabase.storage.from(bucketName).getPublicUrl(fileName).data.publicUrl;
                }
            } catch {
                // ファイルが存在しない場合は次の拡張子を試す
                continue;
            }
        }

        return null; // どの拡張子でもファイルが見つからない場合
    }

    /**
     * ユーザーのアイコンのURLを取得する（静的）
     * ファイルが存在しない場合はデフォルトアバターが表示される
     * @param userId ユーザーID
     * @param extension ファイル拡張子（デフォルト: png）
     * @return アイコンのURL
     */
    static getUserIconUrlStatic(userId: string, extension: string = "png"): string {
        // 環境変数から Supabase URL を取得、またはハードコード
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
        return `${supabaseUrl}/storage/v1/object/public/user-assets/user-icons/${userId}.${extension}`;
    }
}
