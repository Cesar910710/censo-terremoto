"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const isPublicLanding = pathname?.startsWith("/registro");

  return (
    <header
      className={
        isPublicLanding
          ? "flex items-center justify-between border-b-2 border-blue-200 px-4 py-3 sm:px-6"
          : "flex items-center justify-between border-b border-black/[.08] px-4 py-3 dark:border-white/[.145] sm:px-6"
      }
    >
      {isPublicLanding ? (
        <span className="font-semibold tracking-tight text-blue-400 dark:text-blue-300">
          Censo Damnificados
        </span>
      ) : (
        <Link href="/" className="font-semibold tracking-tight">
          Censo Terremoto
        </Link>
      )}
      {!isPublicLanding && (
        <nav className="flex gap-4 text-sm font-medium">
          <Link href="/inventario" className="hover:underline">
            Inventario
          </Link>
          <Link href="/censo" className="hover:underline">
            Censo
          </Link>
        </nav>
      )}
    </header>
  );
}
