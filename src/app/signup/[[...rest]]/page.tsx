"use client";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-[calc(100vh-75px)] flex flex-col items-center justify-center bg-background px-4">
      <div className="p-8 flex flex-col gap-5 items-center">
        <SignUp signInUrl="/signin" />
      </div>
    </div>
  );
}
