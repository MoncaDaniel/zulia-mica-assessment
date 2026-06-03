"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default function NewAssessmentPage() {
  const router = useRouter();
  const [tokenName, setTokenName] = useState("");
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenName.trim()) {
      setError("Token name is required");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenName: tokenName.trim(), ticker: ticker.trim() || undefined }),
    });

    if (res.ok) {
      const assessment = await res.json();
      router.push(`/assessments/${assessment.id}`);
    } else {
      setError("Failed to create assessment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-white">New Assessment</h1>
        <p className="text-slate-400 text-sm mt-1">Start a MiCA compliance assessment for a token</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white">Token Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Token Name"
              placeholder="e.g. Circle USD Coin"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              required
            />
            <Input
              label="Ticker / Symbol"
              placeholder="e.g. USDC"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
            />

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>
                Create Assessment
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
