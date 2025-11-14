import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-12">
      <div className="w-full max-w-4xl space-y-8 text-center">
        <h1 className="text-6xl font-bold tracking-tight text-gray-900">
          Open<span className="text-blue-600">Journal</span>
        </h1>

        <p className="text-xl text-gray-600">
          Your personal and business documentation platform with enterprise-grade security
        </p>

        {session?.user ? (
          <div className="space-y-4">
            <p className="text-lg text-gray-700">
              Welcome back,{" "}
              <span className="font-semibold">{session.user.name || session.user.email}</span>!
            </p>
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-4">
                <Link
                  href="/dashboard"
                  className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/settings/security"
                  className="rounded-md bg-gray-200 px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-300"
                >
                  Security Settings
                </Link>
              </div>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex justify-center gap-4">
            <Link
              href="/auth/signin"
              className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Sign Up
            </Link>
          </div>
        )}

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Rich Text Editor</h3>
            <p className="mt-2 text-sm text-gray-600">
              Powerful formatting tools with markdown support
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Secure & Private</h3>
            <p className="mt-2 text-sm text-gray-600">
              Enterprise-grade security with 2FA and encryption
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Version Control</h3>
            <p className="mt-2 text-sm text-gray-600">
              Track changes and restore previous versions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
