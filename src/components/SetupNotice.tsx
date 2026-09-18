import { DatabaseZap } from "lucide-react";

/**
 * Shown instead of data when Supabase environment variables are missing.
 * Lists variable NAMES only (never values) so a deployment can be diagnosed.
 */
export function SetupNotice({ missing = [] }: { missing?: string[] }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <DatabaseZap className="size-4" />
        Supabase is not configured yet
      </div>
      {missing.length > 0 && (
        <p className="mb-2">
          Missing or empty:{" "}
          {missing.map((name, i) => (
            <span key={name}>
              {i > 0 && ", "}
              <code className="rounded bg-amber-100 px-1">{name}</code>
            </span>
          ))}
        </p>
      )}
      <p className="leading-relaxed">
        Locally, add them to <code className="rounded bg-amber-100 px-1">.env.local</code> and restart the server.
        On Vercel, add them for this environment (Production/Preview) and redeploy: a deployment keeps the variables
        it was created with.
      </p>
    </div>
  );
}
