"use client";
import { SignedOut, SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="p-8 flex flex-col gap-5 items-center">
        <SignUp signInUrl="/signin" />
        <SignedOut>
          <p className="text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-primary underline hover:opacity-80"
            >
              Sign in
            </Link>
          </p>
        </SignedOut>
      </div>
    </div>
  );
}
