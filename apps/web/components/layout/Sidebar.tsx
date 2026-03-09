import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const navItems = [
  { href: "/documents", label: "Knowledge base" },
  { href: "/tenders", label: "Bandi & criteri" },
  { href: "/editor", label: "Offerta tecnica" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-borderSubtle bg-surface/80 backdrop-blur">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/90 text-xs font-bold text-primary-foreground">
          RFP
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-100">RFP AI Co-Pilot</div>
          <div className="text-[11px] text-slate-400">Workspace gare d&apos;appalto</div>
        </div>
      </div>
      <nav className="mt-2 flex-1 space-y-1 px-2 text-sm">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2 rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800/70 hover:text-slate-50",
                active && "bg-slate-800 text-slate-50",
              )}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-borderSubtle px-4 py-3 text-xs text-slate-500">
        <div>Modalità demo</div>
        <div>Ottimizzato per team ufficio gare</div>
      </div>
    </aside>
  );
}

