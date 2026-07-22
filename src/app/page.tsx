import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Public demo deployment, no session yet: skip the login form entirely
  // and land the visitor directly in the dashboard as the demo analyst.
  // Never overrides an existing (real) session -- see /api/demo-login.
  if (!session && process.env.DEMO_MODE === "true") {
    redirect("/api/demo-login");
  }

  redirect("/dashboard");
}
