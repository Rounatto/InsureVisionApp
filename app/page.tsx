"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

export default function Home() {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // TODO: handle files
    const files = e.dataTransfer.files;
    if (files.length) console.log("Dropped files:", files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: handle files
    const files = e.target.files;
    if (files?.length) console.log("Selected files:", files);
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">

      <Navbar />

      {/* ─── Main Content ─────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[color:var(--foreground)] mb-3">
            Damage Estimation
          </h1>
          <p className="text-sm text-[color:var(--muted-foreground)] max-w-md mx-auto">
            Upload photos of the damaged vehicle and our AI will generate an accurate repair cost estimate.
          </p>
        </div>

        {/* ─── Upload Area ──────────────────────────────────────── */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`mx-auto max-w-xl rounded-3xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
            dragActive
              ? "border-[color:var(--foreground)] bg-[color:var(--muted)]"
              : "border-[color:var(--border)] bg-[color:var(--muted)] hover:border-[color:var(--foreground)]/40"
          }`}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          {/* Upload icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--muted)] border border-[color:var(--border)]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-[color:var(--foreground)]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
          </div>

          <p className="text-sm font-medium text-[color:var(--foreground)] mb-1">
            Drag & drop car photos here
          </p>
          <p className="text-xs text-[color:var(--muted-foreground)] mb-5">
            or click to browse — PNG, JPG up to 10MB
          </p>

          <button
            type="button"
            className="rounded-full bg-[color:var(--foreground)] px-8 py-3 text-sm font-bold text-[color:var(--background)] hover:opacity-90 active:scale-95 transition-all"
          >
            Upload Photos
          </button>

          <input
            id="file-input"
            type="file"
            accept="image/png,image/jpeg"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </main>
    </div>
  );
}
