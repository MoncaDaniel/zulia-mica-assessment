import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardChrome } from "@/components/layout/DashboardChrome";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <DashboardChrome hideUserInfo={process.env.DEMO_MODE === "true"}>
      {children}
    </DashboardChrome>
  );
}
