import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(req) {
  // MIDDLEWARE TEMPORARILY DISABLED - DEBUGGING
  console.log("Middleware disabled - path:", req.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
