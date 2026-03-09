import { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  children: ReactNode;
  fullWidth?: boolean;
};

export function Button({ variant = "primary", children, className, fullWidth, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        variant === "primary" &&
          "bg-primary text-primary-foreground hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-slate-400",
        variant === "ghost" &&
          "bg-transparent text-slate-200 hover:bg-slate-800/60 disabled:text-slate-500",
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

