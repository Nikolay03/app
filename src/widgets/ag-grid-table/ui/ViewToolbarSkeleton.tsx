"use client";

export default function ViewToolbarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3 animate-pulse" aria-hidden>
      <div className="h-9 w-56 rounded-lg bg-layer-line" />
      <div className="h-9 w-28 rounded-lg bg-layer-line" />
      <div className="h-9 w-36 rounded-lg bg-layer-line" />
      <div className="h-9 w-28 rounded-lg bg-layer-line" />
      <div className="h-9 w-40 rounded-lg bg-layer-line" />
      <div className="h-9 w-28 rounded-lg bg-layer-line" />
      <div className="h-6 w-28 rounded-full bg-layer-line" />
    </div>
  );
}
