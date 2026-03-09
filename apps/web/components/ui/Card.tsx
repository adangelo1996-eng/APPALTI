import { ReactNode } from "react";
import { clsx } from "clsx";

type CardProps = {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function Card({ title, description, children, className }: CardProps) {
  return (
    <section
      className={clsx(
        "rounded-xl border border-borderSubtle bg-surfaceElevated/80 p-4 shadow-sm backdrop-blur",
        className,
      )}
    >
      {(title || description) && (
        <header className="mb-3 space-y-1">
          {title && <h2 className="text-sm font-semibold text-slate-100">{title}</h2>}
          {description && <p className="text-xs text-slate-400">{description}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

