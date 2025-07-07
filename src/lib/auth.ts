import supabase from "@/lib/supabase";

/**
 * サインアップ
 * @param {string} email - ユーザーのメールアドレス
 * @param {string} password - ユーザーのパスワード
 * @return {Promise<Error | null>} - エラーが発生した場合はエラーオブジェクト、成功した場合はnull
 */
export const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
        email,
        password,
    });
    return error;
}

/**
 * サインイン
 * @param {string} email - ユーザーのメールアドレス
 * @param {string} password - ユーザーのパスワード
 * @return {Promise<Error | null>} - エラーが発生した場合はエラーオブジェクト、成功した場合はnull
 */
export const signIn = async (email: string, password: string) => {
    console.log("Signing in with email:", email);
    console.log("Signing in with password:", password);
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    console.log(error)
    return error;
}

/**
 * サインアウト
 * @return {Promise<Error | null>} - エラーが発生した場合はエラーオブジェクト、成功した場合はnull
 */
export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return error;
}

/**
 * ユーザー情報を取得
 * @return {Promise<User | null>} - ユーザー情報が取得できた場合はUserオブジェクト、失敗した場合はnull
 */
export const getUser = async () => {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error) {
        console.error("Error fetching user:", error);
        return null;
    }

    return user;
}