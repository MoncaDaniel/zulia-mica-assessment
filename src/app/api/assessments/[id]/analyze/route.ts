export const maxDuration = 120;

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { streamAnalysis } from "@/lib/ai/analyze-stream";

/**
 * POST /api/assessments/[id]/analyze — authenticated analysis SSE stream.
 * The stream implementation is shared with the public flow; see
 * src/lib/ai/analyze-stream.ts.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  return streamAnalysis(params.id, { userId: session.user?.id });
}
