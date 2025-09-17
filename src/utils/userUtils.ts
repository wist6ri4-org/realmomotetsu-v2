import supabase from "@/lib/supabase";
import { PutUsersResponse } from "@/features/users/types";

export class UserUtils {
    readonly BUCKET_NAME = "user-assets";
    readonly USER_ICON_FOLDER = "user-icons";

    /**
     * ユーザーのアイコンをアップロードする
     * @param {File} file - アップロードする画像ファイル
     * @param {string} userId - ユーザーのUUID
     * @return {Promise<string | null>} - アップロードされたアイコンのURL
     */
    async uploadUserIcon(file: File, userId: string): Promise<string | null> {
        // 現在のセッションを確認
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
            throw new Error("認証されていません");
        }

        // 現在のユーザーがアップロード対象のユーザーと一致するかチェック
        if (session.user.id !== userId) {
            throw new Error("他のユーザーのアイコンは変更できません");
        }

        // TODO バケットの存在確認と作成
        // await this.ensureBucketExists(this.BUCKET_NAME);

        const fileExtension = file.name.split(".").pop();
        const fileName = `${this.USER_ICON_FOLDER}/${userId}.${fileExtension}`;

        await this.deleteUserIcon(userId); // 既存のアイコンを削除

        const { error } = await supabase.storage.from(this.BUCKET_NAME).upload(fileName, file, {
            upsert: true,
        });

        if (error) {
            console.error("Upload failed:", error);
            throw error;
        }

        // 公開URLを生成
        const { data: urlData } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(fileName);

        // キャッシュ無効化のためにタイムスタンプを追加
        const timestamp = Date.now();
        const publicUrlWithCacheBuster = `${urlData.publicUrl}?t=${timestamp}`;

        return publicUrlWithCacheBuster;
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
        try {
            // user-iconsフォルダ内のファイルをリストアップ
            const { data: files, error: listError } = await supabase.storage
                .from(this.BUCKET_NAME)
                .list(this.USER_ICON_FOLDER, {
                    limit: 100,
                    search: userId,
                });

            if (listError) {
                console.warn("Failed to list files:", listError);
                return;
            }

            if (!files || files.length === 0) {
                console.log("No files found for user:", userId);
                return;
            }

            // userIdに一致するファイルを見つけて削除
            const filesToDelete: string[] = [];
            for (const file of files) {
                // ファイル名がuserIdで始まるかチェック（例: userId.png, userId.jpg など）
                if (file.name.startsWith(userId + ".")) {
                    filesToDelete.push(`${this.USER_ICON_FOLDER}/${file.name}`);
                }
            }

            // 見つかったファイルを削除
            if (filesToDelete.length > 0) {
                const { error: removeError } = await supabase.storage
                    .from(this.BUCKET_NAME)
                    .remove(filesToDelete);

                if (removeError) {
                    console.error("Failed to remove files:", removeError);
                    throw removeError;
                }

                console.log("Successfully deleted files:", filesToDelete);
            }
        } catch (error) {
            console.error("Error in deleteUserIcon:", error);
            // エラーが発生しても処理を続行（ファイルが存在しない場合など）
        }
    }

    /**
     * ユーザーのアイコンのURLを取得する
     * @param userId ユーザーID
     * @return アイコンのURL
     */
    getUserIconUrl(userId: string): string {
        return supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(`${this.USER_ICON_FOLDER}/${userId}`).data.publicUrl;
    }

    /**
     * ユーザーのアイコンのURLを動的に取得する（拡張子を推定）
     * @param userId ユーザーID
     * @param forceRefresh キャッシュを無視して強制的に再読み込みするか（現在未使用）
     * @return アイコンのURL（存在しない場合はnull）
     */
    async getUserIconUrlWithExtension(
        userId: string,
        forceRefresh: boolean = false // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<string | null> {
        // より効率的な方法：listメソッドを使ってユーザーのファイルを直接検索
        try {
            const { data: files, error: listError } = await supabase.storage
                .from(this.BUCKET_NAME)
                .list("user-icons", {
                    limit: 10,
                    search: userId,
                });

            if (listError) {
                console.warn("Failed to list files:", listError);
                return null;
            }

            if (!files || files.length === 0) {
                console.log("No files found for user:", userId);
                return null;
            }

            // userIdで始まるファイルを検索
            const userFile = files.find((file) => file.name.startsWith(userId + "."));

            if (!userFile) {
                console.log("No matching file found for user:", userId);
                return null;
            }

            // 見つかったファイルの公開URLを生成
            const fileName = `${this.USER_ICON_FOLDER}/${userFile.name}`;
            const baseUrl = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(fileName)
                .data.publicUrl;

            // キャッシュ無効化のためにタイムスタンプを追加
            const timestamp = Date.now();
            const publicUrl = `${baseUrl}?t=${timestamp}`;

            console.log("Found file:", userFile.name);
            console.log("Generated public URL with cache buster:", publicUrl);

            return publicUrl;
        } catch (error) {
            console.error("Error in getUserIconUrlWithExtension:", error);
            return null;
        }
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
