"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import {
  AUTH_COOKIE_NAME,
  AUTH_ROLE_COOKIE_NAME,
  isRouteAllowedForRole,
} from "@/lib/adminAuth";
import { api } from "@/lib/api";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("shop");
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setIsLoading(true);

    try {
      if (isSignup) {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setIsLoading(false);
          return;
        }
        await api.post("/auth/signup", { emailId: emailId.trim(), password, role });
        setIsSignup(false);
        setPassword("");
        setConfirmPassword("");
        setNotice("Account created. Sign in with your new password.");
        setIsLoading(false);
        return;
      }

      const response = await api.post("/auth/login", { emailId: emailId.trim(), password });
      const user = response.data.user;
      window.localStorage.setItem("ims_access_token", response.data.token);
      document.cookie = `${AUTH_COOKIE_NAME}=true; path=/; max-age=${60 * 60 * 8}; samesite=lax`;
      document.cookie = `${AUTH_ROLE_COOKIE_NAME}=${user.role}; path=/; max-age=${60 * 60 * 8}; samesite=lax`;

      const redirectPath = searchParams.get("redirect");
      if (redirectPath && isRouteAllowedForRole(redirectPath, user.role)) {
        router.push(redirectPath);
        return;
      }

      router.push(user.defaultRoute);
    } catch (error: unknown) {
      const responseMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message ||
            (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      const networkError = error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message || "")
        : "";
      setError(responseMessage || (networkError ? "Backend is not reachable. Please try again." : "Invalid email ID or password."));
      setIsLoading(false);
    }
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{isSignup ? "Create Account" : "Portal Login"}</h2>
              <p className="text-gray-600 text-sm">{isSignup ? "Create an account for your portal section" : "Enter your email ID and password to access your section"}</p>
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

              {isSignup ? (
                <div>
                  <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">Portal Section</label>
                  <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900">
                    <option value="shop">Shop</option>
                    <option value="domestic">Domestic</option>
                    <option value="ecommerce">Ecommerce</option>
                  </select>
                </div>
              ) : null}

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-gray-700">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {isSignup ? (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" minLength={8} className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400" required />
                    <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-gray-700">
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              ) : null}

              {error ? <p className="text-sm text-red-600 font-medium">{error}</p> : null}
              {notice ? <p className="text-sm text-green-600 font-medium">{notice}</p> : null}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (isSignup ? "Creating Account..." : "Signing In...") : (isSignup ? "Create Account" : "Sign In")}
              </button>
              <button type="button" onClick={() => { setIsSignup((current) => !current); setError(""); setNotice(""); }} className="w-full text-blue-600 hover:text-blue-800 text-sm font-semibold">
                {isSignup ? "Already have an account? Sign in" : "Need an account? Sign up"}
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
