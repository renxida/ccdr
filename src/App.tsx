/**
 * App shell. The TrainingView (M1+) mounts here. For M0 this is a spartan
 * placeholder that proves the toolchain (Vite + React + Tailwind) is wired.
 */
export default function App() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-mono text-2xl tracking-tight text-text">ccdr</h1>
      <p className="max-w-md text-sm text-dim">
        CharaChorder 2 typing trainer — scaffold online.
      </p>
    </main>
  )
}
