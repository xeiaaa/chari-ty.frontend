"use client";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="h-[calc(100vh-75px)] flex flex-col items-center justify-center bg-background px-4">
      <SignIn signUpUrl="/signup" />
    </div>
  );
}
