'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Upload, Loader2, CircleCheck, CircleX } from 'lucide-react';
import { downloadEstimatePdf } from '@/lib/generatePdf';
import { NETWORK_ERROR_MESSAGE } from '@/lib/constants';
import BannedNotification from '@/components/BannedNotification';
import UnbannedNotification from '@/components/UnbannedNotification';

const MAX_FILES = 8;
const MAX_SIZE_MB = 4;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg'];
const JOB_POLL_INTERVAL_MS = 2500;
const JOB_POLL_MAX_ATTEMPTS = 36;
const ALMOST_DONE_POLL_ATTEMPTS = 5;

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
}

interface PhotoUploadState {
  progress: number;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  url?: string;
  error?: string;
}

interface EstimateResult {
  id: string;
  totalCost: number;
  parts: { name: string; cost: number; severity: string }[];
  photos?: string[];
  summary: string;
}

interface EstimateJobCreateResponse {
  success: boolean;
  jobId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

interface EstimateJobStatusResponse {
  success: boolean;
  jobId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: EstimateResult;
  error?: string;
}

type EstimationUiStatus =
  | 'IDLE'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export default function Home() {
  const { data: session } = useSession();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [estimationStatus, setEstimationStatus] =
    useState<EstimationUiStatus>('IDLE');
  const [pollAttemptsWithoutResult, setPollAttemptsWithoutResult] = useState(0);
  const [photoUploads, setPhotoUploads] = useState<
    Record<string, PhotoUploadState>
  >({});

  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => setShowResult(true), 30);
      return () => clearTimeout(timer);
    }
    setShowResult(false);
  }, [result]);

  const estimationInProgress = estimationStatus !== 'IDLE';

  const estimationProgress =
    estimationStatus === 'QUEUED'
      ? 10
      : estimationStatus === 'PROCESSING' &&
          pollAttemptsWithoutResult >= ALMOST_DONE_POLL_ATTEMPTS
        ? 90
        : estimationStatus === 'PROCESSING'
          ? Math.min(85, 30 + pollAttemptsWithoutResult * 10)
          : estimationStatus === 'COMPLETED'
            ? 100
            : estimationStatus === 'FAILED'
              ? 90
              : 0;

  const estimationLabel =
    estimationStatus === 'QUEUED'
      ? 'Job queued, waiting to process...'
      : estimationStatus === 'PROCESSING' &&
          pollAttemptsWithoutResult >= ALMOST_DONE_POLL_ATTEMPTS
        ? 'Almost done...'
        : estimationStatus === 'PROCESSING'
          ? 'Analyzing damage...'
          : estimationStatus === 'COMPLETED'
            ? 'Estimate completed.'
            : estimationStatus === 'FAILED'
              ? 'Estimation failed. Please try again.'
              : '';

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      setError('');
      const newFiles: UploadedFile[] = [];

      for (const file of Array.from(incoming)) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          setError('Only PNG and JPG files are accepted.');
          continue;
        }
        if (file.size > MAX_SIZE_BYTES) {
          setError(`"${file.name}" exceeds the ${MAX_SIZE_MB}MB limit.`);
          continue;
        }
        const isDuplicate = files.some(
          (f) => f.file.name === file.name && f.file.size === file.size
        );
        if (isDuplicate) continue;

        newFiles.push({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
        });
      }

      const combined = [...files, ...newFiles];
      if (combined.length > MAX_FILES) {
        setError(`You can upload up to ${MAX_FILES} photos.`);
        const sliced = combined.slice(0, MAX_FILES);
        setFiles(sliced);
        setPhotoUploads((prev) => {
          const next: Record<string, PhotoUploadState> = {};
          for (const f of sliced) {
            next[f.id] = prev[f.id] ?? { progress: 0, status: 'pending' };
          }
          return next;
        });
      } else {
        setFiles(combined);
        setPhotoUploads((prev) => {
          const next = { ...prev };
          for (const f of newFiles) {
            next[f.id] = { progress: 0, status: 'pending' };
          }
          return next;
        });
      }
    },
    [files]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      const removed = updated[index];
      URL.revokeObjectURL(removed.preview);
      updated.splice(index, 1);
      setPhotoUploads((old) => {
        const next = { ...old };
        delete next[removed.id];
        return next;
      });
      return updated;
    });
    setResult(null);
    setShowResult(false);
  };

  const clearAll = () => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setResult(null);
    setShowResult(false);
    setError('');
    setPhotoUploads({});
    setEstimationStatus('IDLE');
    setPollAttemptsWithoutResult(0);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  };

  const uploadSinglePhoto = (
    file: UploadedFile,
    batchId: string,
    photoNumber: number
  ) => {
    return new Promise<{ url: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/estimate/upload');

      xhr.upload.onprogress = (event) => {
        const totalBytes = event.total > 0 ? event.total : file.file.size;
        if (!totalBytes) return;

        const loadedBytes = Math.min(event.loaded, totalBytes);
        const computedProgress = Math.round((loadedBytes / totalBytes) * 100);
        setPhotoUploads((prev) => ({
          ...prev,
          [file.id]: {
            ...prev[file.id],
            status: 'uploading',
            progress: Math.max(
              prev[file.id]?.progress ?? 0,
              Math.min(100, computedProgress)
            ),
          },
        }));
      };

      xhr.onerror = () => {
        reject(new Error(`Photo ${photoNumber} failed to upload.`));
      };

      xhr.onload = () => {
        try {
          const data = xhr.responseText ? JSON.parse(xhr.responseText) : {};
          if (xhr.status >= 200 && xhr.status < 300 && data.url) {
            resolve({ url: data.url as string });
            return;
          }

          reject(
            new Error(data?.message || `Photo ${photoNumber} failed to upload.`)
          );
        } catch {
          reject(new Error(`Photo ${photoNumber} failed to upload.`));
        }
      };

      const formData = new FormData();
      formData.append('photo', file.file);
      formData.append('batchId', batchId);
      xhr.send(formData);
    });
  };

  const retryPhotoUpload = async (file: UploadedFile, photoNumber: number) => {
    if (submitting) return;

    setPhotoUploads((prev) => ({
      ...prev,
      [file.id]: {
        ...prev[file.id],
        status: 'uploading',
        progress: 0,
        error: undefined,
      },
    }));

    try {
      const upload = await uploadSinglePhoto(
        file,
        `retry-${crypto.randomUUID()}`,
        photoNumber
      );

      setPhotoUploads((prev) => ({
        ...prev,
        [file.id]: {
          ...prev[file.id],
          status: 'uploaded',
          progress: 100,
          url: upload.url,
          error: undefined,
        },
      }));
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : `Photo ${photoNumber} failed to upload.`;
      setPhotoUploads((prev) => ({
        ...prev,
        [file.id]: {
          ...prev[file.id],
          status: 'failed',
          progress: 0,
          error: message,
        },
      }));
    }
  };

  const handleSubmit = async () => {
    if (!files.length) return;
    setSubmitting(true);
    setEstimationStatus('IDLE');
    setPollAttemptsWithoutResult(0);
    setError('');
    setResult(null);
    setShowResult(false);

    try {
      const batchId = crypto.randomUUID();
      const uploadedUrls: string[] = [];
      const failedMessages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const currentFile = files[i];
        const photoNumber = i + 1;
        const currentState = photoUploads[currentFile.id];

        if (currentState?.status === 'uploaded' && currentState.url) {
          uploadedUrls.push(currentState.url);
          continue;
        }

        setPhotoUploads((prev) => ({
          ...prev,
          [currentFile.id]: {
            ...prev[currentFile.id],
            status: 'uploading',
            progress: 0,
            error: undefined,
          },
        }));

        try {
          const upload = await uploadSinglePhoto(
            currentFile,
            batchId,
            photoNumber
          );

          uploadedUrls.push(upload.url);
          setPhotoUploads((prev) => ({
            ...prev,
            [currentFile.id]: {
              ...prev[currentFile.id],
              status: 'uploaded',
              progress: 100,
              url: upload.url,
            },
          }));
        } catch (uploadError) {
          const message =
            uploadError instanceof Error
              ? uploadError.message
              : `Photo ${photoNumber} failed to upload.`;
          failedMessages.push(message);
          setPhotoUploads((prev) => ({
            ...prev,
            [currentFile.id]: {
              ...prev[currentFile.id],
              status: 'failed',
              progress: 0,
              error: message,
            },
          }));
        }
      }

      if (!uploadedUrls.length) {
        setError(
          failedMessages[0] ||
            'All photos failed to upload. Please try again with smaller files.'
        );
        setSubmitting(false);
        return;
      }

      setEstimationStatus('QUEUED');
      setPollAttemptsWithoutResult(0);

      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoUrls: uploadedUrls,
          photoCount: uploadedUrls.length,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to queue estimation.');
        setEstimationStatus('FAILED');
        setSubmitting(false);
        return;
      }

      const queued = (await res.json()) as EstimateJobCreateResponse;

      if (!queued.jobId) {
        setError('Estimation job ID is missing. Please try again.');
        setEstimationStatus('FAILED');
        setPollAttemptsWithoutResult(0);
        setSubmitting(false);
        return;
      }

      if (
        queued.status === 'QUEUED' ||
        queued.status === 'PROCESSING' ||
        queued.status === 'FAILED'
      ) {
        setEstimationStatus(queued.status);
      }

      let finalResult: EstimateResult | null = null;
      let finalError = '';

      for (let attempt = 0; attempt < JOB_POLL_MAX_ATTEMPTS; attempt++) {
        await new Promise((resolve) =>
          setTimeout(resolve, JOB_POLL_INTERVAL_MS)
        );

        const statusRes = await fetch(`/api/estimate/status/${queued.jobId}`, {
          cache: 'no-store',
        });

        if (!statusRes.ok) {
          const statusData = await statusRes.json().catch(() => ({}));
          finalError =
            statusData.message || 'Failed to check estimation status.';
          break;
        }

        const statusData =
          (await statusRes.json()) as EstimateJobStatusResponse;

        if (
          statusData.status === 'QUEUED' ||
          statusData.status === 'PROCESSING'
        ) {
          setEstimationStatus(statusData.status);
          setPollAttemptsWithoutResult(attempt + 1);
        }

        if (statusData.status === 'COMPLETED' && statusData.result) {
          setEstimationStatus('COMPLETED');
          setPollAttemptsWithoutResult(attempt + 1);
          await new Promise((resolve) => setTimeout(resolve, 500));
          finalResult = statusData.result;
          break;
        }

        if (statusData.status === 'FAILED') {
          setEstimationStatus('FAILED');
          finalError =
            statusData.error ||
            'Estimation processing failed. Please try again.';
          break;
        }
      }

      if (finalResult) {
        setResult(finalResult);
      } else {
        setError(
          finalError ||
            'Estimation is taking too long. Please check back shortly.'
        );
      }

      if (failedMessages.length > 0) {
        setError(
          `${failedMessages[0]} ${
            failedMessages.length > 1
              ? `(+${failedMessages.length - 1} more photo errors)`
              : ''
          }`
        );
      }

      if (finalResult) {
        setEstimationStatus('IDLE');
      } else {
        setEstimationStatus('FAILED');
      }
      setPollAttemptsWithoutResult(0);
    } catch {
      setError(NETWORK_ERROR_MESSAGE);
      setEstimationStatus('FAILED');
      setPollAttemptsWithoutResult(0);
    }
    setSubmitting(false);
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <UnbannedNotification />
      <BannedNotification />
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[color:var(--foreground)] mb-3">
          Damage Estimation
        </h1>
        <p className="text-sm text-[color:var(--muted-foreground)] max-w-md mx-auto">
          Upload photos of the damaged vehicle and our AI will generate an
          accurate repair cost estimate.
        </p>
      </div>

      {files.length === 0 ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`mx-auto max-w-xl rounded-3xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
            dragActive
              ? 'border-[color:var(--foreground)] bg-[color:var(--muted)]'
              : 'border-[color:var(--border)] bg-[color:var(--muted)] hover:border-[color:var(--foreground)]/40'
          }`}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--background)] border border-[color:var(--border)]">
            <Upload className="h-7 w-7 text-[color:var(--foreground)]" />
          </div>

          <p className="text-sm font-medium text-[color:var(--foreground)] mb-1">
            Drag & drop car photos here
          </p>
          <p className="text-xs text-[color:var(--muted-foreground)] mb-5">
            or click to browse - PNG, JPG up to {MAX_SIZE_MB}MB each (max{' '}
            {MAX_FILES} photos)
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
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[color:var(--muted-foreground)]">
              {files.length} photo{files.length > 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              {files.length < MAX_FILES && (
                <button
                  onClick={() => document.getElementById('file-input')?.click()}
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
              <div
                key={f.id}
                className="group relative aspect-square rounded-xl overflow-hidden border border-[color:var(--border)]"
              >
                <Image
                  src={f.preview}
                  alt={f.file.name}
                  fill
                  className={`object-cover transition-opacity ${
                    photoUploads[f.id]?.status === 'uploading'
                      ? 'opacity-60'
                      : 'opacity-100'
                  }`}
                />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                  <p className="text-[10px] text-white truncate">
                    {f.file.name}
                  </p>
                  {photoUploads[f.id]?.status !== 'uploading' && (
                    <p className="mt-0.5 text-[10px] text-white/90">
                      {photoUploads[f.id]?.status === 'uploaded' && 'Uploaded'}
                      {photoUploads[f.id]?.status === 'failed' && 'Failed'}
                      {(!photoUploads[f.id] ||
                        photoUploads[f.id]?.status === 'pending') &&
                        'Ready'}
                    </p>
                  )}
                </div>

                {photoUploads[f.id]?.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/25 flex flex-col items-center justify-center text-white">
                    <svg
                      viewBox="0 0 48 48"
                      className="h-10 w-10 -rotate-90"
                      aria-hidden="true"
                    >
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        fill="none"
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        fill="none"
                        stroke="white"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 18}
                        strokeDashoffset={
                          2 *
                          Math.PI *
                          18 *
                          (1 -
                            Math.min(
                              100,
                              Math.max(0, photoUploads[f.id]?.progress ?? 0)
                            ) /
                              100)
                        }
                        className="transition-[stroke-dashoffset] duration-150"
                      />
                    </svg>
                    <p className="mt-2 text-xs font-semibold">
                      {Math.min(
                        100,
                        Math.max(0, photoUploads[f.id]?.progress ?? 0)
                      )}
                      %
                    </p>
                  </div>
                )}

                {photoUploads[f.id]?.status === 'uploaded' && (
                  <div className="absolute top-2 left-2 rounded-full bg-green-500/90 p-1 text-white shadow">
                    <CircleCheck className="h-4 w-4" />
                  </div>
                )}

                {photoUploads[f.id]?.status === 'failed' && (
                  <button
                    type="button"
                    onClick={() => retryPhotoUpload(f, i + 1)}
                    disabled={submitting}
                    className="absolute inset-0 bg-red-900/50 text-white flex flex-col items-center justify-center px-2 text-center"
                  >
                    <CircleX className="h-6 w-6" />
                    <p className="mt-2 text-[11px] font-semibold">
                      Failed - tap to retry
                    </p>
                  </button>
                )}
              </div>
            ))}
          </div>

          {estimationInProgress && (
            <div className="mb-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--muted)]">
                <div
                  className={`h-full transition-all duration-[800ms] ease-in-out ${
                    estimationStatus === 'FAILED'
                      ? 'bg-red-500'
                      : estimationStatus === 'COMPLETED'
                        ? 'bg-green-500 animate-pulse'
                        : 'bg-[color:var(--foreground)]'
                  }`}
                  style={{ width: `${estimationProgress}%` }}
                />
              </div>
              <p
                className={`mt-2 text-xs ${
                  estimationStatus === 'FAILED'
                    ? 'text-red-500'
                    : 'text-[color:var(--muted-foreground)]'
                }`}
              >
                {estimationLabel}
              </p>
            </div>
          )}

          <input
            id="file-input"
            type="file"
            accept="image/png,image/jpeg"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-full bg-[color:var(--foreground)] py-3.5 text-sm font-bold text-[color:var(--background)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Uploading & Analyzing...' : 'Get Damage Estimate'}
          </button>
        </div>
      )}

      {error && (
        <p className="text-center text-xs text-red-500 mt-4">{error}</p>
      )}

      {result && (
        <div
          className={`mx-auto max-w-2xl mt-10 transition-all duration-500 ${
            showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <div className="border-b border-[color:var(--border)] pb-4 mb-6">
            <h2 className="text-xl font-bold text-[color:var(--foreground)]">
              Estimation Result
            </h2>
            <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
              ID: {result.id}
            </p>
          </div>

          <p className="text-sm text-[color:var(--muted-foreground)] mb-6">
            {result.summary}
          </p>

          <div className="space-y-3 mb-6">
            {result.parts.map((part, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      part.severity === 'High'
                        ? 'bg-red-500'
                        : part.severity === 'Medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                  />
                  <span className="text-sm text-[color:var(--foreground)]">
                    {part.name}
                  </span>
                  <span className="text-xs text-[color:var(--muted-foreground)]">
                    ({part.severity})
                  </span>
                </div>
                <span className="text-sm font-medium text-[color:var(--foreground)]">
                  ${part.cost.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[color:var(--border)] pt-4 flex items-center justify-between">
            <span className="text-sm font-bold text-[color:var(--foreground)]">
              Estimated Total
            </span>
            <span className="text-2xl font-bold text-[color:var(--foreground)]">
              ${result.totalCost.toLocaleString()}
            </span>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() =>
                downloadEstimatePdf({
                  ...result,
                  photoUrls: result.photos ?? [],
                  userName: session?.user?.name || undefined,
                  userEmail: session?.user?.email || undefined,
                  photoCount: result.photos?.length ?? files.length,
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
