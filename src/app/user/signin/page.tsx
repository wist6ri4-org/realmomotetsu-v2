"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const {user, error} = await signIn(email, password);
        if (error) {
            setError(error.message);
        } else {
            fetchEventCode(user as User).then(eventCode => {
                if (eventCode) {
                    router.push(`/events/${eventCode}/home`);
                } else {
                    setError("Event code not found for user");
                }
            });
        }
    };

    const fetchEventCode = async (user: User): Promise<string> => {
        try {
            setError(null);

            const uuid = user.id;
            const response = await fetch(`/api/users/${uuid}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const userData = data?.data || {};

            return userData.attendances[0].eventCode;
        } catch (error) {
            console.error("Error fetching event code:", error);
            setError(error instanceof Error ? error.message : "Unknown error");
            return "";
        }
    }

    return (
        <div>
            <h1>Login</h1>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
            </form>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <p>
                Don&apos;t have an account? <a href="/user/signup">Sign up</a>
            </p>
        </div>
    );
}