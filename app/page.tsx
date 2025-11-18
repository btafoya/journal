import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 px-4 py-12">
      <div className="w-full max-w-4xl space-y-8 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground">
          Open<span className="text-primary">Journal</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground">
          Your personal and business documentation platform with enterprise-grade security
        </p>

        {session?.user ? (
          <div className="space-y-4">
            <p className="text-lg text-foreground">
              Welcome back,{" "}
              <span className="font-semibold">{session.user.name || session.user.email}</span>!
            </p>
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/entries"
                  className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/settings/security"
                  className="rounded-md bg-secondary px-6 py-3 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/80 transition-colors"
                >
                  Security Settings
                </Link>
              </div>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="rounded-md bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/auth/signin"
              className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-md bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}

        <div className="mt-16 grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-3">
          <div className="rounded-lg bg-card p-6 shadow-sm ring-1 ring-border">
            <h3 className="text-lg font-semibold text-card-foreground">Rich Text Editor</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Powerful formatting tools with markdown support
            </p>
          </div>
          <div className="rounded-lg bg-card p-6 shadow-sm ring-1 ring-border">
            <h3 className="text-lg font-semibold text-card-foreground">Secure & Private</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Enterprise-grade security with 2FA and encryption
            </p>
          </div>
          <div className="rounded-lg bg-card p-6 shadow-sm ring-1 ring-border">
            <h3 className="text-lg font-semibold text-card-foreground">Version Control</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Track changes and restore previous versions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
