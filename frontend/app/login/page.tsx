"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  AUTH_COOKIE_NAME,
  AUTH_ROLE_COOKIE_NAME,
  authenticateUser,
  isRouteAllowedForRole,
} from "@/lib/adminAuth";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const user = authenticateUser(emailId.trim(), password);

    if (user) {
      document.cookie = `${AUTH_COOKIE_NAME}=true; path=/; max-age=${60 * 60 * 8}; samesite=lax`;
      document.cookie = `${AUTH_ROLE_COOKIE_NAME}=${user.role}; path=/; max-age=${60 * 60 * 8}; samesite=lax`;

      const redirectPath = searchParams.get("redirect");
      if (redirectPath && isRouteAllowedForRole(redirectPath, user.role)) {
        router.push(redirectPath);
        return;
      }

      router.push(user.defaultRoute);
      return;
    }

    setError("Invalid email ID or password.");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="text-center">
              <div className="w-48 h-48 mx-auto mb-4 flex items-center justify-center overflow-hidden">
                <Image
                  src="/virgoLogo.png"
                  alt="Virgo logo"
                  width={192}
                  height={192}
                  className="object-contain object-center"
                  style={{ transform: "translateX(-10px)" }}
                  priority
                />
              </div>
              <h1 className="text-3xl font-bold text-sky-600 mb-1">VIRGO</h1>
              <p className="text-sm text-sky-500 font-medium">CLOTHING CULTURE</p>
              <p className="text-xs text-gray-500">Pvt. Ltd.</p>
            </div>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Portal Login</h2>
              <p className="text-gray-600 text-sm">Enter your email ID and password to access your section</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email ID */}
              <div>
                <label htmlFor="emailId" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email ID
                </label>
                <input
                  id="emailId"
                  type="email"
                  value={emailId}
                  onChange={(e) => setEmailId(e.target.value)}
                  placeholder="Enter email ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>

              {error ? <p className="text-sm text-red-600 font-medium">{error}</p> : null}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          © 2026 Virgo Clothing Culture Pvt. Ltd. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
