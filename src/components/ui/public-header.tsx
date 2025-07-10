import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-border">
      <span className="text-2xl font-bold tracking-wider">Chari-ty</span>
      <nav className="flex items-center gap-4">
        <SignedIn>
          <Link
            href="/app/dashboard"
            className="px-4 py-2 rounded-md hover:bg-muted transition-colors"
          >
            Dashboard
          </Link>
        </SignedIn>
        <SignedOut>
          <SignInButton forceRedirectUrl="/app/dashboard">
            <button className="px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton forceRedirectUrl="/app/dashboard">
            <button className="px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </nav>
    </header>
  );
}
