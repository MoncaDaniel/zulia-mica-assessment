export const maxDuration = 120;

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { streamAnalysis } from "@/lib/ai/analyze-stream";
import { getPublicUserId } from "@/lib/anon";

/**
 * POST /api/public/assessments/[id]/analyze — analysis stream for a
 * public/free assessment. No login, but the assessment MUST be owned by the
 * public system user (i.e. it came from POST /api/public/assessments), and
 * it must not already be finished.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const publicUserId = await getPublicUserId();

  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    select: { createdById: true, aiStatus: true },
  });
  if (!assessment) return new Response("Not found", { status: 404 });
  if (assessment.createdById !== publicUserId) {
    return new Response("Not a public assessment", { status: 403 });
  }
  if (assessment.aiStatus === "COMPLETED") {
    return new Response("Already analysed", { status: 409 });
  }

  return streamAnalysis(params.id, { userId: publicUserId });
}
