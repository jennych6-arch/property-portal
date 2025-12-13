// portal-frontend/app/layout.tsx
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Property Portal",
  description: "Task 2 Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="font-semibold">Property Portal</div>
            <div className="flex gap-4 text-sm">
              <Link href="/estimator" className="hover:underline">
                Estimator (Python)
              </Link>
              <Link href="/analysis" className="hover:underline">
                Market Analysis (Java)
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
