const STACK = [
  "Next.js 14",
  "TypeScript",
  "FastAPI",
  "WebSocket",
  "TradingView Lightweight Charts",
  "Google Gemini",
  "Claude Code",
];

export function TechStackStrip() {
  return (
    <section id="teknologi" className="mx-auto max-w-7xl px-6 py-16">
      <p className="text-center text-xs uppercase tracking-wider text-faint">Dibangun Dengan</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        {STACK.map((tech) => (
          <span key={tech} className="text-sm font-medium text-subtle">
            {tech}
          </span>
        ))}
      </div>
    </section>
  );
}
