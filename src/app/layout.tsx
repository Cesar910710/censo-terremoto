import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Censo Terremoto",
  description: "Censo de familias e inventario de donaciones post-terremoto",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="flex items-center justify-between border-b border-black/[.08] px-4 py-3 dark:border-white/[.145] sm:px-6">
          <Link href="/" className="font-semibold tracking-tight">
            Censo Terremoto
          </Link>
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/inventario" className="hover:underline">
              Inventario
            </Link>
            <Link href="/censo" className="hover:underline">
              Censo
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
