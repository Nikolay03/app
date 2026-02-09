export default function Loading() {
  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr]">
      <header className="bg-layer border-b border-layer-line px-6 py-4 flex items-center justify-between gap-3">
        <div className="h-5 w-56 rounded-full bg-layer-line animate-pulse" aria-hidden />
        <div className="h-5 w-40 rounded-full bg-layer-line animate-pulse" aria-hidden />
      </header>
      <main className="px-6 py-6">
        <div className="h-7 w-40 rounded-lg bg-layer-line animate-pulse" aria-hidden />
        <div className="mt-4 rounded-xl border border-layer-line bg-layer p-4 shadow-sm">
          <div className="flex flex-wrap gap-3 animate-pulse" aria-hidden>
            <div className="h-9 w-36 rounded-lg bg-layer-line" />
            <div className="h-9 w-36 rounded-lg bg-layer-line" />
            <div className="h-9 w-36 rounded-lg bg-layer-line" />
            <div className="h-9 w-36 rounded-lg bg-layer-line" />
          </div>
          <div className="mt-4 h-[420px] rounded-xl bg-layer-line/60 animate-pulse" aria-hidden />
        </div>
      </main>
    </div>
  );
}
