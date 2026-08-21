import Link from "next/link";
import { Package, Users, Gift, Truck } from "lucide-react";

const cards = [
  {
    href: "/inventario",
    label: "Inventario",
    description: "Stock de materiales",
    icon: Package,
    color: "text-blue-600 dark:text-blue-400",
    border: "hover:border-blue-300 dark:hover:border-blue-800",
  },
  {
    href: "/censo",
    label: "Censo",
    description: "Familias y solicitudes",
    icon: Users,
    color: "text-purple-600 dark:text-purple-400",
    border: "hover:border-purple-300 dark:hover:border-purple-800",
  },
  {
    href: "/donaciones",
    label: "Donaciones",
    description: "Materiales recibidos",
    icon: Gift,
    color: "text-green-600 dark:text-green-400",
    border: "hover:border-green-300 dark:hover:border-green-800",
  },
  {
    href: "/entregas",
    label: "Entregas",
    description: "Materiales entregados",
    icon: Truck,
    color: "text-amber-600 dark:text-amber-400",
    border: "hover:border-amber-300 dark:hover:border-amber-800",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-4 py-16 dark:bg-black">
      <h1 className="text-2xl font-semibold tracking-tight">
        Censo y Donaciones
      </h1>
      <p className="max-w-md text-center text-zinc-600 dark:text-zinc-400">
        Inventario de donaciones y censo de familias afectadas.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-row">
        {cards.map(({ href, label, description, icon: Icon, color, border }) => (
          <Link
            key={href}
            href={href}
            className={`flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-black/[.08] bg-white text-center transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:bg-zinc-900 dark:hover:bg-zinc-800 sm:w-40 ${border}`}
          >
            <Icon className={`h-6 w-6 ${color}`} />
            <span className="font-medium">{label}</span>
            <span className="text-xs text-zinc-500">{description}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
