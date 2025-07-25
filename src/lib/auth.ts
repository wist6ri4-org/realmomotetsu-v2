import supabase from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

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
 * @return {Promise<{ user: User | null; error: Error | null }>} - ユーザー情報とエラー情報
 */
export const signIn = async (
    email: string,
    password: string
): Promise<{ user: User | null; error: Error | null }> => {
    try {
        console.log("Signing in with email:", email);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("SignIn error:", error);
            return { user: null, error };
        }

        console.log("SignIn successful:", data.user);
        return { user: data.user, error: null };
    } catch (err) {
        console.error("Unexpected error during signIn:", err);
        const error = new Error("サインイン中に予期しないエラーが発生しました");
        return { user: null, error };
    }
};

/**
 * サインアウト（強化版）
 * @return {Promise<Error | null>} - エラーが発生した場合はエラーオブジェクト、成功した場合はnull
 */
export const signOut = async (): Promise<Error | null> => {
    try {
        // Supabaseからサインアウト
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("SignOut error:", error);
            return error;
        }

        // 追加のクリーンアップ（必要に応じて）
        localStorage.clear(); // 全てのlocalStorageをクリア

        return null;
    } catch (err) {
        console.error("Unexpected error during signOut:", err);
        return new Error("サインアウト中に予期しないエラーが発生しました");
    }
};

/**
 * Server Component用のSupabaseクライアントを作成
 */
const createServerSupabaseClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                flowType: "pkce",
                autoRefreshToken: false,
                detectSessionInUrl: false,
                persistSession: false,
            },
        }
    );
};

/**
 * 現在のユーザーを取得（Server Component用）
 * @return {Promise<User | null>} - ユーザーオブジェクト、またはエラーが発生した場合はnull
 */
export const getUser = async (): Promise<User | null> => {
    try {
        // Server Componentでは認証セッションが取得できない場合があるため、
        // 簡単な認証チェックのみ実行
        const serverSupabase = createServerSupabaseClient();
        const {
            data: { user },
            error,
        } = await serverSupabase.auth.getUser();

        if (error) {
            console.warn("Server-side auth check failed:", error.message);
            return null;
        }

        return user;
    } catch (error) {
        console.warn("Server-side user fetch failed:", error);
        return null;
    }
};

/**
 * Client Component用のユーザー取得
 * @return {Promise<User | null>} - ユーザーオブジェクト、またはエラーが発生した場合はnull
 */
export const getUserClient = async (): Promise<User | null> => {
    try {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error) {
            console.error("Error fetching user:", error);
            return null;
        }

        return user;
    } catch (error) {
        console.error("Unexpected error fetching user:", error);
        return null;
    }
};
