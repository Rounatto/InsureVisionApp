"use client";

import Link from "next/link";

export default function Login() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[url('/background.jpg')] bg-cover bg-center p-4">
      <div className="flex w-full max-w-5xl min-h-[90vh] overflow-hidden rounded-[30px] bg-white/10">
        <div className="hidden md:block md:w-[45%]" />

        <div className="flex w-full md:w-[55%] flex-col items-center justify-center rounded-[15px] bg-white px-4">
          <div className="flex w-full max-w-[400px] flex-col items-center">
            <img src="/logo(3).JPG" className="mb-5 h-auto w-20 object-contain" alt="Logo" />

            <h1 className="mb-[2px] mt-5 text-4xl text-black">Welcome Back</h1>
            <p className="mb-[10px] text-center text-sm text-black">
              Enter your email and password to access your account
            </p>

            <div className="flex w-full flex-col bg-white p-5 text-black">
              <label className="font-bold">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                className="mb-[10px] w-full rounded-[10px] border border-gray-300 p-2"
              />

              <label className="mt-[10px] font-bold">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                className="mb-[10px] w-full rounded-[10px] border border-gray-300 p-2"
              />

              <div className="flex justify-center">
                <Link
                  href="/dashboard"
                  className="mt-[30px] inline-block rounded-[10px] bg-green-600 px-5 py-2.5"
                >
                  <span className="font-bold text-white">Se connecter</span>
                </Link>
              </div>

              {/* Google UI only */}
              <button
                type="button"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] border border-gray-300 px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
              >
                <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2c-2.1 1.6-4.7 2.4-7.3 2.4-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.6-6.3 7.3l6.3 5.2C39 37.2 44 31.2 44 24c0-1.3-.1-2.4-.4-3.5z"/>
                </svg>
                Continue with Google
              </button>
                <div className="mt-3 text-center">
                    <Link href="/forgot-password" className="text-sm font-medium text-emerald-700 hover:underline">
                        Forgot password?
                    </Link>
                    </div>

              <p className="mt-10 text-center text-black">
                Don&apos;t have an account?
                <Link href="/register">
                  <span className="ml-[5px] text-lg font-bold text-black">Sign up</span>
                </Link>
              </p>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}