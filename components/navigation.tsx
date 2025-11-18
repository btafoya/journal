"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

export function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
              OpenJournal
            </Link>

            {/* Main Navigation - Only show when authenticated */}
            {status === "authenticated" && (
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/entries"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive("/entries") ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Entries
                </Link>
                <Link
                  href="/entries/new"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive("/entries/new") ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  New Entry
                </Link>
                <Link
                  href="/settings/categories"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive("/settings/categories") ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Categories
                </Link>
              </div>
            )}
          </div>

          {/* Right Side Navigation */}
          <div className="flex items-center gap-4">
            <ThemeToggle />

            {status === "loading" ? (
              <div className="h-9 w-20 animate-pulse bg-muted rounded" />
            ) : status === "authenticated" ? (
              <>
                {/* User Menu */}
                <div className="hidden md:flex items-center gap-4">
                  <Link
                    href="/settings/security"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive("/settings") ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    Sign Out
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                  <button
                    className="p-2 rounded-md hover:bg-muted"
                    aria-label="Open menu"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
