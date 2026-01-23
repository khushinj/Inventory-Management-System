"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication
    setTimeout(() => {
      if (employeeId && password) {
        // Store auth state (in production, use proper authentication)
        if (rememberMe) {
          localStorage.setItem("employeeId", employeeId);
        }
        router.push("/retail");
      } else {
        alert("Please enter valid credentials");
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-4">
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Stylized faces */}
                  <path
                    d="M100 30 C110 30 120 35 125 45 L135 70 C138 80 135 90 125 95 L115 100 L125 110 C130 115 130 125 125 130 L110 145 C105 150 95 150 90 145 L75 130 C70 125 70 115 75 110 L85 100 L75 95 C65 90 62 80 65 70 L75 45 C80 35 90 30 100 30 Z"
                    fill="#0EA5E9"
                  />
                  <path
                    d="M70 50 C75 45 82 42 88 45 L95 55 C98 62 96 70 90 75 L80 82 L70 75 C65 70 64 62 67 55 Z"
                    fill="#EC4899"
                  />
                  <ellipse cx="90" cy="100" rx="20" ry="35" fill="#0EA5E9" opacity="0.6" />
                  <ellipse cx="75" cy="90" rx="15" ry="25" fill="#EC4899" opacity="0.6" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-sky-600 mb-1">VIRGO</h1>
              <p className="text-sm text-sky-500 font-medium">CLOTHING CULTURE</p>
              <p className="text-xs text-gray-500">Pvt. Ltd.</p>
            </div>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Login</h2>
              <p className="text-gray-600 text-sm">Enter your credentials to access the portal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Employee ID */}
              <div>
                <label htmlFor="employeeId" className="block text-sm font-semibold text-gray-700 mb-2">
                  Employee ID
                </label>
                <input
                  id="employeeId"
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter your employee ID"
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
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 font-medium">Remember me</span>
                </label>
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                  Forgot password?
                </a>
              </div>

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
