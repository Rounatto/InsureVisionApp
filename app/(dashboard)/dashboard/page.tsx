"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { downloadEstimatePdf } from "@/lib/generatePdf";
import { NETWORK_ERROR_MESSAGE } from "@/lib/constants";

const MAX_FILES = 8;
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg"];

interface UploadedFile {
  file: File;
  preview: string;
}

interface EstimateResult {
  id: string;
  totalCost: number;
  parts: { name: string; cost: number; severity: string }[];
  summary: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<EstimateResult | null>(null);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      setError("");
      const newFiles: UploadedFile[] = [];

      for (const file of Array.from(incoming)) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          setError("Only PNG and JPG files are accepted.");
          continue;
        }
        if (file.size > MAX_SIZE_BYTES) {
          setError(`"${file.name}" exceeds the ${MAX_SIZE_MB}MB limit.`);
          continue;
        }
        // Skip duplicates by name+size
        const isDuplicate = files.some(
          (f) => f.file.name === file.name && f.file.size === file.size
        );
        if (isDuplicate) continue;

        newFiles.push({ file, preview: URL.createObjectURL(file) });
      }

      const combined = [...files, ...newFiles];
      if (combined.length > MAX_FILES) {
        setError(`You can upload up to ${MAX_FILES} photos.`);
        setFiles(combined.slice(0, MAX_FILES));
      } else {
        setFiles(combined);
      }
    },
    [files]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
    setResult(null);
  };

  const clearAll = () => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setResult(null);
    setError("");
  };

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
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = ""; // allow re-selecting the same file
  };

  const handleSubmit = async () => {
    if (!files.length) return;
    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("photos", f.file));

      const res = await fetch("/api/estimate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Estimation failed. Please try again.");
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch {
      setError(NETWORK_ERROR_MESSAGE);
    }
    setSubmitting(false);
  };

  return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[color:var(--foreground)] mb-3">
            Damage Estimation
          </h1>
          <p className="text-sm text-[color:var(--muted-foreground)] max-w-md mx-auto">
            Upload photos of the damaged vehicle and our AI will generate an accurate repair cost estimate.
          </p>
        </div>

        {/* ─── Upload Area ──────────────────────────────────────── */}
        {files.length === 0 ? (
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
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--background)] border border-[color:var(--border)]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-[color:var(--foreground)]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>

            <p className="text-sm font-medium text-[color:var(--foreground)] mb-1">
              Drag & drop car photos here
            </p>
            <p className="text-xs text-[color:var(--muted-foreground)] mb-5">
              or click to browse — PNG, JPG up to {MAX_SIZE_MB}MB each (max {MAX_FILES} photos)
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
        ) : (
          /* ─── Photo Previews ─────────────────────────────────── */
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[color:var(--muted-foreground)]">
                {files.length} photo{files.length > 1 ? "s" : ""} selected
              </p>
              <div className="flex gap-2">
                {files.length < MAX_FILES && (
                  <button
                    onClick={() => document.getElementById("file-input")?.click()}
                    className="rounded-full border border-[color:var(--border)] px-4 py-1.5 text-xs font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-colors"
                  >
                    + Add More
                  </button>
                )}
                <button
                  onClick={clearAll}
                  className="rounded-full border border-[color:var(--border)] px-4 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6"
            >
              {files.map((f, i) => (
                <div key={f.file.name + f.file.size} className="group relative aspect-square rounded-xl overflow-hidden border border-[color:var(--border)]">
                  <Image
                    src={f.preview}
                    alt={f.file.name}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                    <p className="text-[10px] text-white truncate">{f.file.name}</p>
                  </div>
                </div>
              ))}
            </div>

            <input
              id="file-input"
              type="file"
              accept="image/png,image/jpeg"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-full bg-[color:var(--foreground)] py-3.5 text-sm font-bold text-[color:var(--background)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Uploading & Analyzing…" : "Get Damage Estimate"}
            </button>
          </div>
        )}

        {/* ─── Error Message ──────────────────────────────────── */}
        {error && (
          <p className="text-center text-xs text-red-500 mt-4">{error}</p>
        )}

        {/* ─── Results ────────────────────────────────────────── */}
        {result && (
          <div className="mx-auto max-w-2xl mt-10">
            <div className="border-b border-[color:var(--border)] pb-4 mb-6">
              <h2 className="text-xl font-bold text-[color:var(--foreground)]">Estimation Result</h2>
              <p className="text-xs text-[color:var(--muted-foreground)] mt-1">ID: {result.id}</p>
            </div>

            <p className="text-sm text-[color:var(--muted-foreground)] mb-6">{result.summary}</p>

            {/* Parts breakdown */}
            <div className="space-y-3 mb-6">
              {result.parts.map((part, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className={`inline-block h-2 w-2 rounded-full ${
                      part.severity === "High" ? "bg-red-500" :
                      part.severity === "Medium" ? "bg-yellow-500" : "bg-green-500"
                    }`} />
                    <span className="text-sm text-[color:var(--foreground)]">{part.name}</span>
                    <span className="text-xs text-[color:var(--muted-foreground)]">({part.severity})</span>
                  </div>
                  <span className="text-sm font-medium text-[color:var(--foreground)]">${part.cost.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-[color:var(--border)] pt-4 flex items-center justify-between">
              <span className="text-sm font-bold text-[color:var(--foreground)]">Estimated Total</span>
              <span className="text-2xl font-bold text-[color:var(--foreground)]">${result.totalCost.toLocaleString()}</span>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() =>
                  downloadEstimatePdf({
                    ...result,
                    userName: session?.user?.name || undefined,
                    userEmail: session?.user?.email || undefined,
                    photoCount: files.length,
                  })
                }
                className="flex-1 rounded-full bg-[color:var(--foreground)] py-3 text-xs sm:text-sm font-bold text-[color:var(--background)] hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Download PDF
              </button>
              <button
                onClick={clearAll}
                className="flex-1 rounded-full border border-[color:var(--border)] py-3 text-xs sm:text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-colors"
              >
                New Estimation
              </button>
            </div>
          </div>
        )}
      </main>
  );
}
