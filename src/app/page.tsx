import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex-1 flex flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-emerald-800">
            Signup<span className="text-amber-600">Dingus</span>
          </span>
          {user ? (
            <Link href="/dashboard" className="btn-primary">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="btn-secondary">
              Log in
            </Link>
          )}
        </div>
      </header>

      <section className="flex-1 flex items-center">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-stone-900">
            Volunteer signups,{" "}
            <span className="text-emerald-700">without the hassle</span>
          </h1>
          <p className="mt-6 text-lg text-stone-600">
            Create a signup list, share a link or QR code, and let volunteers
            claim open slots — no account needed for them to sign up.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href={user ? "/dashboard/lists/new" : "/login"} className="btn-primary text-base px-6 py-3">
              Create a signup list
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
