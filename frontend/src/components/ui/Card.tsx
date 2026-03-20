import type { PropsWithChildren } from "react";
import clsx from "clsx";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx("rounded-2xl border border-slate-200 bg-white p-6 shadow-soft", className)}>
      {children}
    </div>
  );
}
