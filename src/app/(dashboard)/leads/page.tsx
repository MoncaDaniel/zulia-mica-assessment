import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { GrantButton } from "./GrantButton";

const STATUS_STYLE: Record<string, string> = {
  NEW: "bg-brand-900/40 text-brand-300 border-brand-700",
  CONTACTED: "bg-blue-900/40 text-blue-300 border-blue-700",
  CLOSED: "bg-slate-800 text-slate-400 border-slate-700",
};

export default async function LeadsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const leads = await prisma.leadRequest.findMany({ orderBy: { createdAt: "desc" } });
  const newCount = leads.filter((l) => l.status === "NEW").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Leads</h1>
        <p className="text-slate-400 text-sm mt-1">
          Contact requests from the public site — {leads.length} total, {newCount} new. Use
          “Generate run link” to hand someone a one-time free assessment.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        {leads.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg">No leads yet</p>
            <p className="text-sm mt-1">Requests from the public site will show up here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Token</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Contact</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Note</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Received</th>
                  <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Grant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors align-top">
                    <td className="py-4 pr-4 text-white font-medium">{lead.tokenName || "—"}</td>
                    <td className="py-4 pr-4">
                      <a href={`mailto:${lead.email}`} className="text-brand-400 hover:underline">
                        {lead.email}
                      </a>
                      {lead.phone && (
                        <div className="text-xs text-slate-500 mt-0.5">{lead.phone}</div>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-slate-400 max-w-xs">
                      {lead.note ? <span className="line-clamp-3">{lead.note}</span> : "—"}
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border text-[11px] font-medium ${
                          STATUS_STYLE[lead.status] ?? STATUS_STYLE.CLOSED
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-slate-400 whitespace-nowrap">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="py-4">
                      <GrantButton leadId={lead.id} status={lead.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
