"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const error = await signIn(email, password);
        if (error) {
            setError(error.message);
        } else {
            // Redirect to home page after successful login
            router.push("/home");
        }
    };

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