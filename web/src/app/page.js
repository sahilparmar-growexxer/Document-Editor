import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-10">
      <div className="glass w-full max-w-5xl rounded-3xl p-8 md:p-12">
        <div className="mb-10 flex items-center justify-between gap-4">
          <p className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Day 1 Build
          </p>
          <p className="text-sm text-slate-300">Block Editor Workspace</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 md:items-end">
          <div>
            <h1 className="title-glow mb-4 text-4xl font-semibold leading-tight text-white md:text-6xl">
              Shape your ideas in blocks.
            </h1>
            <p className="max-w-md text-base text-slate-300 md:text-lg">
              A clean Notion-like editor foundation with auth, document workflows, and a deployable API.
            </p>
          </div>

          <div className="grid gap-3">
            <Link
              href="/register"
              className="rounded-2xl bg-cyan-400 px-5 py-4 text-center text-base font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-slate-600 bg-slate-900/50 px-5 py-4 text-center text-base font-semibold text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200"
            >
              Login
            </Link>
            <Link
              href="/dashboard"
              className="rounded-2xl border border-slate-700 bg-slate-950/40 px-5 py-4 text-center text-base font-medium text-slate-300 transition hover:border-slate-400 hover:text-white"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
