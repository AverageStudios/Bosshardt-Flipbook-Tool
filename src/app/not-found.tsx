import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
        <p className="text-sm font-medium text-muted">404</p>
        <h1 className="mt-2 text-xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/dashboard" className={buttonClass("primary", "md", "mt-6")}>
          Go to My Flipbooks
        </Link>
      </main>
    </div>
  );
}
