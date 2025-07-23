import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-border">
      <Link
        href="/"
        className="text-2xl font-bold tracking-wider hover:opacity-80 transition-opacity"
      >
        Chari-ty
      </Link>
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
          <Link href="/signin">
            <button className="px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors">
              Sign In
            </button>
          </Link>

          <Link href="/signup">
            <button className="px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors">
              Sign Up
            </button>
          </Link>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </nav>
    </header>
  );
}
