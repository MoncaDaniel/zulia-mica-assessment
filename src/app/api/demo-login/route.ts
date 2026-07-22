import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

/**
 * Public demo deployment only: silently signs the visitor in as the seeded
 * demo ANALYST account and drops them straight into the dashboard, so a
 * recruiter/visitor never has to type credentials. Mints a NextAuth JWT
 * session cookie directly (bypassing the Credentials provider's login
 * form) using the same encode() NextAuth itself uses, so the resulting
 * session is indistinguishable from a normal sign-in to the rest of the
 * app -- getServerSession/withAuth read it exactly the same way.
 *
 * Hard-gated behind DEMO_MODE so this can never bypass auth on a real
 * deployment of this tool for an actual client.
 */
export async function GET(req: NextRequest) {
  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const demoUser = await prisma.user.findUnique({
    where: { email: "analyst@zulia.network" },
  });

  if (!demoUser) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const token = await encode({
    token: {
      id: demoUser.id,
      sub: demoUser.id,
      role: demoUser.role,
      name: demoUser.name,
      email: demoUser.email,
    },
    secret: process.env.NEXTAUTH_SECRET!,
  });

  const isProd = process.env.NODE_ENV === "production";
  const cookieName = isProd ? "__Secure-next-auth.session-token" : "next-auth.session-token";

  const res = NextResponse.redirect(new URL("/dashboard", req.url));
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
