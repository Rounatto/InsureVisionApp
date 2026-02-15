"use client";

import Link from "next/link";

export default function Register() {
  return (
    // 1. FOND DE PAGE
    <div className="flex h-screen w-full items-center justify-center bg-[url('/background2.jpg')] bg-cover bg-center p-4 overflow-hidden">
      
      {/* 2. CARTE PRINCIPALE */}
      <div className="flex w-full max-w-5xl h-[85vh] min-h-[600px] overflow-hidden rounded-[40px] shadow-2xl bg-white text-black font-sans">
        
        {/* SECTION GAUCHE */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-between bg-[url('/background2.jpg')] bg-cover bg-center p-12 text-white relative">
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-3">
            <span className="text-xs font-bold tracking-widest uppercase text-blue-300">InsureVision AI</span>
            <div className="h-[1px] w-12 bg-blue-300/50"></div>
          </div>

          <div className="relative z-10 mb-4">
            <h1 className="text-5xl font-serif italic leading-tight mb-4">
               Accelerate<br />Your Claims<br />Processing
            </h1>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl max-w-xs">
                <p className="text-sm leading-relaxed mb-3 text-white/90 italic">
                    "InsureVision has saved our adjusters 40% of their time."
                </p>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-400 border border-white/50" />
                    <div>
                        <p className="text-xs font-bold">Sari Parantainen</p>
                        <p className="text-[10px] text-white/60">Claims Director</p>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* SECTION DROITE */}
    
        <div className="flex w-full md:w-1/2 flex-col h-full px-8 md:px-12 py-4 justify-between">
          
          {/* A. LOGO */}
          <div className="flex-none flex justify-center pt-2">
            <img src="/logo-eye2.png" className="h-auto w-16 object-contain" alt="Logo" />
          </div>

          {/* B. FORMULAIRE */}
          <div className="flex-1 flex flex-col justify-center w-full max-w-[380px] mx-auto">
            
            <div className="text-center mb-5">

              <h1 className="text-4xl font-serif text-black italic mb-2">Create Account</h1>
              <p className="text-xs text-gray-500">
                Join our network of smart insurance adjusters
              </p>
            </div>

            <div className="flex flex-col gap-2.5 text-black">
              
              {/* Name */}
              <div>
                <label className="block mb-1.5 ml-1 text-xs font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full rounded-full border border-gray-200 bg-white p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-700/20 text-black placeholder-gray-400"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block mb-1.5 ml-1 text-xs font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-full border border-gray-200 bg-white p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-700/20 text-black placeholder-gray-400"
                />
              </div>

              {/* Passwords */}
              <div className="flex gap-3">
                <div className="w-1/2">
                  <label className="block mb-1.5 ml-1 text-xs font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-full border border-gray-100 bg-gray-50 p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-700/20 text-black placeholder-gray-400"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block mb-1.5 ml-1 text-xs font-medium text-gray-700">Confirm</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-full border border-gray-100 bg-gray-50 p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-700/20 text-black placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Boutons */}
              <div className="flex flex-col gap-2.5 mt-2">
                <button className="w-full rounded-full bg-black py-3.5 font-bold text-white text-sm transition-transform active:scale-95 hover:bg-gray-900 shadow-md cursor-pointer">
                    Create Account
                </button>
                <button className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 py-3.5 font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-xs cursor-pointer">
                    <svg viewBox="0 0 48 48" className="h-5 w-5">
                        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"/>
                        <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2c-2.1 1.6-4.7 2.4-7.3 2.4-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z"/>
                        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.6-6.3 7.3l6.3 5.2C39 37.2 44 31.2 44 24c0-1.3-.1-2.4-.4-3.5z"/>
                    </svg>
                    Sign up with Google
                </button>
              </div>
            </div>
          </div>

          {/* C. FOOTER */}
          <div className="flex-none text-center pb-2">
            <p className="text-xs text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-black hover:underline">
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}