-- Auth Hooks: ユーザー作成時に自動でusersテーブルにレコードを作成する関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, nickname, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nickname', NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        'user'::public."Role"
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        RETURN NEW;
END;
$$;

-- ユーザー更新用関数
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    UPDATE public.users
    SET
        email = NEW.email,
        nickname = COALESCE(NEW.raw_user_meta_data->>'nickname', NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', nickname),
        updated_at = NOW()
    WHERE id = NEW.id;

    IF NOT FOUND THEN
        INSERT INTO public.users (id, email, nickname, role)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'nickname', NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
            'user'::public."Role"
        );
    END IF;

    RETURN NEW;
END;
$$;

-- トリガー作成
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- RLS設定
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Service role can manage all users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');