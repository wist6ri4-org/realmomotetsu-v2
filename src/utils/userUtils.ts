import supabase from "@/lib/supabase";

export class UserUtils {
    /**
     * ユーザーのアイコンをアップロードする
     * @param file アップロードするファイル
     * @param userId ユーザーID
     * @return アップロードされたファイルの公開URL
     */
    async uploadUserIcon(file: File, userId: string): Promise<string | null> {
        const fileExtension = file.name.split(".").pop();
        const fileName = `user-icons/${userId}.${fileExtension}`;

        const { data, error } = await supabase.storage.from("user-assets").upload(fileName, file, {
            upsert: true,
        });
        console.log("Upload result:", data, error);

        if (error) throw error;

        const {
            data: { publicUrl },
        } = supabase.storage.from("user-assets").getPublicUrl(fileName);

        return publicUrl;
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
        return supabase.storage.from("user-assets").getPublicUrl(`user-icons/${userId}`).data.publicUrl;
    }

}
