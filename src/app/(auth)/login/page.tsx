"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-3xl text-white">
            Zulia <span className="text-brand-500">MiCA</span>
          </h1>
          <p className="text-slate-400 mt-2">Token Assessment Platform</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@zulia.network"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign in
            </Button>
          </form>

          <div className="mt-6 p-3 bg-slate-800 rounded-lg text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-300">Demo accounts:</p>
            <p>analyst@zulia.network / password123</p>
            <p>reviewer@zulia.network / password123</p>
            <p>admin@zulia.network / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
