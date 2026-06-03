"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

export default function ReviewActions({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handleReview = async (action: "APPROVE" | "REJECT") => {
    setLoading(action === "APPROVE" ? "approve" : "reject");
    const res = await fetch(`/api/assessments/${assessmentId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, notes }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      alert("Review action failed. Please try again.");
    }
    setLoading(null);
  };

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Reviewer notes (required for rejection, optional for approval)..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
      <div className="flex gap-3">
        <Button
          variant="primary"
          loading={loading === "approve"}
          onClick={() => handleReview("APPROVE")}
        >
          Approve
        </Button>
        <Button
          variant="danger"
          loading={loading === "reject"}
          disabled={!notes.trim()}
          onClick={() => handleReview("REJECT")}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
