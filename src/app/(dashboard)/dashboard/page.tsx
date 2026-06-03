import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AssessmentTable } from "@/components/dashboard/AssessmentTable";
import { formatScore, cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const assessments = await prisma.assessment.findMany({
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
      sections: { select: { sectionKey: true, sectionScore: true, completedAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: assessments.length,
    pass: assessments.filter((a) => a.flag === "PASS").length,
    review: assessments.filter((a) => a.flag === "REVIEW").length,
    fail: assessments.filter((a) => a.flag === "FAIL").length,
    submitted: assessments.filter((a) => a.status === "SUBMITTED").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Assessments</h1>
          <p className="text-slate-400 text-sm mt-1">MiCA token compliance assessments</p>
        </div>
        <Link href="/assessments/new">
          <Button variant="primary" size="md">
            + New Assessment
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-slate-300" },
          { label: "Pass", value: stats.pass, color: "text-green-400" },
          { label: "Review", value: stats.review, color: "text-amber-400" },
          { label: "Fail", value: stats.fail, color: "text-red-400" },
          { label: "Awaiting Review", value: stats.submitted, color: "text-blue-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className={cn("text-2xl font-bold font-display", stat.color)}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <AssessmentTable
          assessments={assessments.map((a) => ({
            ...a,
            createdAt: a.createdAt.toISOString(),
            sections: a.sections.map((s) => ({
              sectionKey: s.sectionKey,
              completedAt: s.completedAt?.toISOString() ?? null,
            })),
          }))}
          userRole={session.user.role}
        />
      </div>
    </div>
  );
}
