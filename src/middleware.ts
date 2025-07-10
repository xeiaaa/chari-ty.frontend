import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { API_BASE_URL } from "./lib/utils";

interface UserData {
  setupComplete: boolean;
}

const publicPaths = ["/", "/api/webhooks(.*)"];
const onboardingPath = "/onboarding";

export default clerkMiddleware(async (auth, request) => {
  const { userId, getToken } = await auth();
  const path = request.nextUrl.pathname;

  console.log("[Middleware] Processing request:", { path, userId });

  // If not logged in, only allow public routes
  if (!userId) {
    if (isPublicPath(path)) {
      return NextResponse.next();
    }
    // Redirect to sign in for protected routes
    const { redirectToSignIn } = await auth();
    return redirectToSignIn({
      returnBackUrl: "/dashboard" // Always redirect to dashboard after sign in
    });
  }

  // User is logged in - check their setup status
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-user-id": userId,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    const userData: UserData = await response.json();
    console.log("[Middleware] User data:", userData);

    // If setup is not complete, redirect to onboarding (except for public routes)
    if (!userData.setupComplete && path !== onboardingPath) {
      console.log("[Middleware] Redirecting incomplete user to onboarding");
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // If setup is complete and trying to access onboarding, redirect to dashboard
    if (userData.setupComplete && path === onboardingPath) {
      console.log("[Middleware] Redirecting completed user from onboarding to dashboard");
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

  } catch (error) {
    console.error("[Middleware] Error fetching user data:", error);
    // On error, allow the request to continue
    return NextResponse.next();
  }

  return NextResponse.next();
});

function isPublicPath(path: string): boolean {
  return publicPaths.some(pattern => {
    if (pattern.endsWith("(.*)")) {
      return path.startsWith(pattern.slice(0, -4));
    }
    return path === pattern;
  });
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};