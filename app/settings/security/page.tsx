"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SecuritySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 2FA Setup State
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyToken, setVerifyToken] = useState("");

  // 2FA Disable State
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    // Check current 2FA status
    if (session?.user) {
      fetchTwoFactorStatus();
    }
  }, [session]);

  const fetchTwoFactorStatus = async () => {
    try {
      const response = await fetch("/api/auth/2fa/status");
      const data = await response.json();
      setTwoFactorEnabled(data.enabled || false);
    } catch (err) {
      console.error("Failed to fetch 2FA status:", err);
    }
  };

  const handleSetup2FA = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to setup 2FA");
        return;
      }

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setShowSetupModal(true);
    } catch {
      setError("An error occurred while setting up 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verifyToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to verify token");
        return;
      }

      setSuccess("2FA enabled successfully!");
      setTwoFactorEnabled(true);
      setShowSetupModal(false);
      setVerifyToken("");
      setQrCode("");
      setSecret("");
    } catch {
      setError("An error occurred during verification");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: disablePassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to disable 2FA");
        return;
      }

      setSuccess("2FA disabled successfully");
      setTwoFactorEnabled(false);
      setShowDisableModal(false);
      setDisablePassword("");
    } catch {
      setError("An error occurred while disabling 2FA");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account security and authentication methods
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && !showSetupModal && !showDisableModal && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Two-Factor Authentication Section */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h2>
            <p className="mt-1 text-sm text-gray-600">
              Add an extra layer of security to your account by requiring a verification code in
              addition to your password.
            </p>
          </div>

          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Status</p>
                <p className="mt-1 text-sm text-gray-600">
                  {twoFactorEnabled ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Enabled
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      Disabled
                    </span>
                  )}
                </p>
              </div>

              <div>
                {twoFactorEnabled ? (
                  <button
                    onClick={() => setShowDisableModal(true)}
                    disabled={loading}
                    className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Disable 2FA
                  </button>
                ) : (
                  <button
                    onClick={handleSetup2FA}
                    disabled={loading}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading ? "Setting up..." : "Enable 2FA"}
                  </button>
                )}
              </div>
            </div>

            {twoFactorEnabled && (
              <div className="mt-4 rounded-md bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  Two-factor authentication is enabled. You&apos;ll need to enter a verification
                  code from your authenticator app each time you sign in.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Setup Modal */}
        {showSetupModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowSetupModal(false)}
              />

              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Setup Two-Factor Authentication
                      </h3>
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">
                          Scan this QR code with your authenticator app (Google Authenticator,
                          Authy, 1Password, etc.)
                        </p>

                        {qrCode && (
                          <div className="mt-4 flex justify-center">
                            <Image src={qrCode} alt="2FA QR Code" width={200} height={200} />
                          </div>
                        )}

                        <div className="mt-4">
                          <p className="text-xs text-gray-500">
                            Or enter this secret key manually:
                          </p>
                          <code className="mt-1 block rounded bg-gray-100 px-3 py-2 text-sm text-gray-900">
                            {secret}
                          </code>
                        </div>

                        {error && (
                          <div className="mt-4 rounded-md bg-red-50 p-3">
                            <p className="text-sm text-red-800">{error}</p>
                          </div>
                        )}

                        <form onSubmit={handleVerify2FA} className="mt-4">
                          <label
                            htmlFor="token"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Verification Code
                          </label>
                          <input
                            type="text"
                            id="token"
                            name="token"
                            value={verifyToken}
                            onChange={(e) => setVerifyToken(e.target.value)}
                            placeholder="000000"
                            maxLength={6}
                            pattern="[0-9]{6}"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Enter the 6-digit code from your authenticator app
                          </p>

                          <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse sm:gap-3">
                            <button
                              type="submit"
                              disabled={loading || verifyToken.length !== 6}
                              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 sm:w-auto sm:text-sm"
                            >
                              {loading ? "Verifying..." : "Verify and Enable"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowSetupModal(false);
                                setError("");
                                setVerifyToken("");
                              }}
                              disabled={loading}
                              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 sm:mt-0 sm:w-auto sm:text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Disable Modal */}
        {showDisableModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowDisableModal(false)}
              />

              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Disable Two-Factor Authentication
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Are you sure you want to disable two-factor authentication? This will make
                          your account less secure.
                        </p>

                        {error && (
                          <div className="mt-4 rounded-md bg-red-50 p-3">
                            <p className="text-sm text-red-800">{error}</p>
                          </div>
                        )}

                        <form onSubmit={handleDisable2FA} className="mt-4">
                          <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Confirm your password
                          </label>
                          <input
                            type="password"
                            id="password"
                            name="password"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          />

                          <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse sm:gap-3">
                            <button
                              type="submit"
                              disabled={loading}
                              className="inline-flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 sm:w-auto sm:text-sm"
                            >
                              {loading ? "Disabling..." : "Disable 2FA"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowDisableModal(false);
                                setError("");
                                setDisablePassword("");
                              }}
                              disabled={loading}
                              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 sm:mt-0 sm:w-auto sm:text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
