"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { bandClass } from "./chrome";

/** The navy → indigo band painted behind the header and the top of the screen; fades into the page color. */
export function PageBand() {
  const pathname = usePathname();
  const cls = bandClass(pathname);
  if (!cls) return null;
  return <div aria-hidden className={cn("bg-band pointer-events-none absolute inset-x-0 top-0 -z-10", cls)} />;
}
