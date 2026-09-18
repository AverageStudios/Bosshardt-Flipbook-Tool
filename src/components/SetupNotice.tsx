import { DatabaseZap } from "lucide-react";

/** Shown instead of data when Supabase environment variables are missing. */
export function SetupNotice() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <DatabaseZap className="size-4" />
        Supabase is not configured yet
      </div>
      <p className="leading-relaxed">
        Copy <code className="rounded bg-amber-100 px-1">.env.example</code> to{" "}
        <code className="rounded bg-amber-100 px-1">.env.local</code>, add your Supabase project URL and keys,
        run the SQL in <code className="rounded bg-amber-100 px-1">supabase/migrations</code>, then restart the
        server.
      </p>
    </div>
  );
}
