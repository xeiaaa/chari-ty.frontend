"use client";
import { SignIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <SignIn signUpUrl="/signup" />
      <SignedOut>
        <p className="text-sm text-muted-foreground mt-4">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-primary underline hover:opacity-80"
          >
            Sign up
          </Link>
        </p>
      </SignedOut>
    </div>
  );
}
