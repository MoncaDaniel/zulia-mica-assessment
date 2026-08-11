import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function LeadsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const leads = await prisma.leadRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Leads</h1>
        <p className="text-slate-400 text-sm mt-1">
          Contact requests submitted from the public registry ({leads.length})
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        {leads.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg">No leads yet</p>
            <p className="text-sm mt-1">Requests from the public registry page will show up here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Token</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Email</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Phone</th>
                  <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 pr-4 text-white font-medium">{lead.tokenName || "—"}</td>
                    <td className="py-4 pr-4">
                      <a href={`mailto:${lead.email}`} className="text-brand-400 hover:underline">
                        {lead.email}
                      </a>
                    </td>
                    <td className="py-4 pr-4">
                      <a href={`tel:${lead.phone}`} className="text-brand-400 hover:underline">
                        {lead.phone}
                      </a>
                    </td>
                    <td className="py-4 text-slate-400">{formatDate(lead.createdAt)}</td>
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
