import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPublic = pathname === "/" || pathname.startsWith("/_next") || pathname.startsWith("/favicon");

  if (isPublic) return NextResponse.next();

  // Check for Supabase session cookie (any cookie starting with sb-)
  const hasCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));

  if (!hasCookie && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
