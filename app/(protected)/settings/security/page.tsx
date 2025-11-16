"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SecuritySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      checkTwoFactorStatus();
    }
  }, [status]);

  async function checkTwoFactorStatus() {
    try {
      const response = await fetch("/api/auth/2fa/status");
      if (response.ok) {
        const data = await response.json();
        setTwoFactorEnabled(data.enabled);
      }
    } catch (error) {
      console.error("Failed to check 2FA status:", error);
    }
  }

  async function handleSetup2FA() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/2fa/setup", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setShowSetup(true);
      } else {
        setError("Failed to set up 2FA");
      }
    } catch (error) {
      setError("Failed to set up 2FA");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify2FA(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      });

      if (response.ok) {
        setSuccess("2FA enabled successfully!");
        setTwoFactorEnabled(true);
        setShowSetup(false);
        setQrCode(null);
        setSecret(null);
        setVerificationToken("");
      } else {
        const data = await response.json();
        setError(data.error || "Invalid verification code");
      }
    } catch (error) {
      setError("Failed to verify 2FA code");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable2FA() {
    if (!confirm("Are you sure you want to disable two-factor authentication?")) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/2fa/disable", { method: "POST" });
      if (response.ok) {
        setSuccess("2FA disabled successfully");
        setTwoFactorEnabled(false);
      } else {
        setError("Failed to disable 2FA");
      }
    } catch (error) {
      setError("Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <div className="flex justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Security Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account security and two-factor authentication</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {/* Two-Factor Authentication Section */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-card-foreground mb-2">Two-Factor Authentication</h2>
            <p className="text-muted-foreground mb-4">
              Add an extra layer of security to your account by requiring a verification code when signing in.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${twoFactorEnabled ? "bg-green-500" : "bg-gray-400"}`} />
              <span className="text-sm font-medium text-card-foreground">
                {twoFactorEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
          <div>
            {!twoFactorEnabled ? (
              <button
                onClick={handleSetup2FA}
                disabled={loading}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50"
              >
                {loading ? "Setting up..." : "Enable 2FA"}
              </button>
            ) : (
              <button
                onClick={handleDisable2FA}
                disabled={loading}
                className="px-6 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors font-semibold disabled:opacity-50"
              >
                {loading ? "Disabling..." : "Disable 2FA"}
              </button>
            )}
          </div>
        </div>

        {/* Setup Flow */}
        {showSetup && qrCode && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Set up your authenticator app</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="bg-white p-4 rounded-lg inline-block">
                  {qrCode && (
                    <Image src={qrCode} alt="2FA QR Code" width={200} height={200} className="rounded" />
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Or manually enter this secret key:
                </p>
                <code className="bg-muted px-3 py-2 rounded text-sm font-mono text-card-foreground block">
                  {secret}
                </code>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  2. Enter the 6-digit code from your authenticator app
                </p>
                <form onSubmit={handleVerify2FA} className="flex gap-3">
                  <input
                    type="text"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading || verificationToken.length !== 6}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSetup(false);
                      setQrCode(null);
                      setSecret(null);
                      setVerificationToken("");
                    }}
                    className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Tips */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Security Tips</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-2">
            <span>✓</span>
            <span>Use a strong, unique password for your account</span>
          </li>
          <li className="flex gap-2">
            <span>✓</span>
            <span>Enable two-factor authentication for added security</span>
          </li>
          <li className="flex gap-2">
            <span>✓</span>
            <span>Never share your password or 2FA codes with anyone</span>
          </li>
          <li className="flex gap-2">
            <span>✓</span>
            <span>Keep your authenticator app backup codes in a safe place</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
