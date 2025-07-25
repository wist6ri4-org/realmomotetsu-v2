import supabase from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

/**
 * サインアップ
 * @param {string} email - ユーザーのメールアドレス
 * @param {string} password - ユーザーのパスワード
 * @return {Promise<Error | null>} - エラーが発生した場合はエラーオブジェクト、成功した場合はnull
 */
export const signUp = async (email: string, password: string): Promise<Error | null> => {
    try {
        // Authenticationに認証ユーザーを作成
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            console.error("Auth SignUp error:", authError);
            return authError;
        }

        // DBにユーザープロファイルを作成
        if (authData.user) {
            const createUser = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uuid: authData.user.id,
                    email: authData.user.email,
                    nickname: email.split("@")[0], // デフォルトのニックネームをメールのローカル部分に設定
                }),
            });

            const userError = await createUser.json();
            if (!createUser.ok) {
                console.error("User creation error:", userError);
                return new Error(`ユーザープロファイルの作成に失敗しました: ${userError.message}`);
            }
        }

        console.log("SignUp successful:", authData);
        return null;
    } catch (err) {
        console.error("Unexpected error during signUp:", err);
        return new Error("サインアップ中に予期しないエラーが発生しました");
    }
};

/**
 * サインイン
 * @param {string} email - ユーザーのメールアドレス
 * @param {string} password - ユーザーのパスワード
 * @return {Promise<Error | null>} - エラーが発生した場合はエラーオブジェクト、成功した場合はnull
 */
export const signIn = async (email: string, password: string): Promise<Error | null> => {
    console.log("Signing in with email:", email);
    console.log("Signing in with password:", password);
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    console.log(error);
    return error;
};

/**
 * サインアウト
 * @return {Promise<Error | null>} - エラーが発生した場合はエラーオブジェクト、成功した場合はnull
 */
export const signOut = async (): Promise<Error | null> => {
    const { error } = await supabase.auth.signOut();
    return error;
};

/**
 * 現在のユーザーを取得
 * @return {Promise<User | null>} - ユーザーオブジェクト、またはエラーが発生した場合はnull
 */
export const getUser = async (): Promise<User | null> => {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error) {
        console.error("Error fetching user:", error);
        return null;
    }

    return user;
};
