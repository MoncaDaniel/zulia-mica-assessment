"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function SubmitButton({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetch(`/api/assessments/${assessmentId}/submit`, { method: "POST" });
    if (res.ok) {
      router.refresh();
    } else {
      const body = await res.json().catch(() => null);
      alert(body?.error ?? "Failed to submit. Please try again.");
    }
    setLoading(false);
  };

  return (
    <Button variant="primary" size="sm" loading={loading} onClick={handleSubmit}>
      Submit for Review
    </Button>
  );
}
