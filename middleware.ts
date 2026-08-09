import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Teacher routes
  const isTeacherPublic = pathname === "/teacher/login" || pathname === "/teacher/setup" || pathname === "/teacher/register";
  if (pathname.startsWith("/teacher") && !isTeacherPublic) {
    const session = request.cookies.get("teacher_session");
    if (!session?.value) {
      return NextResponse.redirect(new URL("/teacher/login", request.url));
    }
  }

  // Legacy /admin → redirect to teacher dashboard
  if (pathname === "/admin") {
    const session = request.cookies.get("teacher_session");
    if (!session?.value) return NextResponse.redirect(new URL("/teacher/login", request.url));
    return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
  }

  // Protect /admin/* sub-routes (groups/new etc.) with teacher session
  if (pathname.startsWith("/admin/") && pathname !== "/admin/login") {
    const session = request.cookies.get("teacher_session");
    if (!session?.value) return NextResponse.redirect(new URL("/teacher/login", request.url));
  }

  // Student routes
  if (pathname === "/home" || pathname.startsWith("/practice/")) {
    const session = request.cookies.get("student_session");
    if (!session?.value) {
      return NextResponse.redirect(new URL("/student/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/teacher/:path*", "/admin/:path*", "/admin", "/home", "/practice/:path*"],
};
