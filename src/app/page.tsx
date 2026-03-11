export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-base)]">
      <main className="flex flex-col items-center gap-6 p-8">
        <div
          className="rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] p-8 shadow-[var(--shadow-glass)] backdrop-blur-[var(--blur-glass-lg)]"
        >
          <h1 className="bg-gradient-to-r from-[var(--color-accent-blue)] to-[var(--color-accent-purple)] bg-clip-text text-4xl font-bold text-transparent">
            SubTracker
          </h1>
          <p className="mt-3 text-lg text-[var(--color-foreground)]/70">
            Your subscriptions, intelligently managed.
          </p>
        </div>
      </main>
    </div>
  );
}
