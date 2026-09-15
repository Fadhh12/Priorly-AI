import Link from "next/link";

const NAV_LINKS = [
  { href: "#fitur", label: "Fitur" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#teknologi", label: "Teknologi" },
  { href: "#tentang", label: "Tentang" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            T
          </span>
          <span>
            <span className="block text-[15px] font-semibold leading-none text-ink">TradeSim</span>
            <span className="block text-[11px] leading-none text-faint">Trading Platform</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-subtle transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Link
          href="/trading"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-accent/20 transition-opacity hover:opacity-90"
        >
          Mulai Trading
        </Link>
      </div>
    </header>
  );
}
