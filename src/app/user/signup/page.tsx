"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const error = await signUp(email, password);
        if (error) {
            setError(error.message);
        } else {
            router.push("/user/signin");
        }
    };

    return (
        <div>
            <h1>Sign Up</h1>
            <form onSubmit={handleSignUp}>
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
                <button type="submit">Sign Up</button>
            </form>
            {error && <p className="text-red-500">{error}</p>}
            <p>
                Already have an account? <a href="/user/signin">Sign in</a>
            </p>
        </div>
    );
}