import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function proxy(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("Supabase environment variables are missing in middleware!");
    return response; // Skip auth check if config is missing
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      get: (name) => request.cookies.get(name)?.value,
      set: (name, value, options) => {
        request.cookies.set({ name, value, ...options });
        response.cookies.set({ name, value, ...options });
      },
      remove: (name, options) => {
        request.cookies.set({ name, value: "", ...options });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  // Use getSession() instead of getUser() for much faster middleware performance
  // getSession() checks the local token, while getUser() always hits the network
  const { data: { session } } = await supabase.auth.getSession();
  const mockSession = request.cookies.get("mock_session")?.value;
  const isMockUser = mockSession === "user";
  const isMockAdmin = mockSession === "admin";
  const isAuthenticated = !!session || isMockUser || isMockAdmin;

  const path = request.nextUrl.pathname;

  // Auth/Redirect logic
  const isAdminRoute = path.startsWith("/quiz/admin") || path.startsWith("/admin");
  const isProtectedRoute = path.startsWith("/quiz") || path.startsWith("/dashboard") || isAdminRoute;

  // Redirect legacy /login to root
  if (path === "/login") {
     return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect to root if not authenticated and trying to access protected route
  if (!isAuthenticated && isProtectedRoute && path !== "/auth/callback") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Admin access control - Only run DB check on admin routes to save performance
  if (isAdminRoute && !isMockAdmin && session?.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "evaluator") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions (.svg, .png, .jpg, .jpeg, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)',
  ],
};
