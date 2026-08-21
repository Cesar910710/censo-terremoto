"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Users, Gift, Truck } from "lucide-react";

const navItems = [
  { href: "/", label: "Inicio", icon: Home, color: "text-zinc-600 dark:text-zinc-400" },
  { href: "/inventario", label: "Inventario", icon: Package, color: "text-blue-600 dark:text-blue-400" },
  { href: "/censo", label: "Censo", icon: Users, color: "text-purple-600 dark:text-purple-400" },
  { href: "/donaciones", label: "Donaciones", icon: Gift, color: "text-green-600 dark:text-green-400" },
  { href: "/entregas", label: "Entregas", icon: Truck, color: "text-amber-600 dark:text-amber-400" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isPublicLanding = pathname?.startsWith("/registro");

  return (
    <header
      className={
        isPublicLanding
          ? "flex items-center justify-center border-b-2 border-blue-200 px-4 py-3 sm:px-6"
          : "flex items-center justify-center border-b border-black/[.08] px-4 py-3 dark:border-white/[.145] sm:px-6"
      }
    >
      {isPublicLanding && (
        <span className="text-lg font-bold tracking-tight text-blue-500 dark:text-blue-300">
          Censo Damnificados
        </span>
      )}
      {!isPublicLanding && (
        <nav className="flex flex-wrap justify-center gap-4 text-sm font-medium">
          {navItems.map(({ href, label, icon: Icon, color }) => (
            <Link key={href} href={href} className="flex items-center gap-1.5 hover:underline">
              <Icon className={`h-4 w-4 ${color}`} />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
