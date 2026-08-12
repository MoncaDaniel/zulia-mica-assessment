import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import PublicRegistryPage from "./check/page";

// The public registry is the front door now — no login prompt, no demo
// auto-login. A visitor with no session just sees it directly. Anyone with
// a real session (analyst/reviewer/admin) skips straight to the dashboard,
// same as before. /login still works if you know the URL; it's just not
// advertised anywhere on this page anymore.
export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");
  return <PublicRegistryPage />;
}
