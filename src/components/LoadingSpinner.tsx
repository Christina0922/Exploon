"use client";

export default function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900"
        aria-hidden="true"
      />
      <div className="text-sm font-medium text-zinc-900">{message}</div>
    </div>
  );
}

