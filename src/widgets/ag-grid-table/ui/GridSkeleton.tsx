"use client";

export default function GridSkeleton() {
  return (
    <div
      className="absolute inset-0 z-10 grid gap-2 bg-background/70 p-3 backdrop-blur-[1px] pointer-events-none"
      aria-hidden
    >
      <div className="h-8 rounded-lg bg-layer-line animate-pulse" />
      <div className="h-7 rounded-lg bg-layer-line animate-pulse" />
      <div className="h-7 rounded-lg bg-layer-line animate-pulse" />
      <div className="h-7 rounded-lg bg-layer-line animate-pulse" />
      <div className="h-7 rounded-lg bg-layer-line animate-pulse" />
      <div className="h-7 rounded-lg bg-layer-line animate-pulse" />
      <div className="h-7 rounded-lg bg-layer-line animate-pulse" />
    </div>
  );
}
