import Link from "next/link";
import { logout } from "@/app/login/actions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-emerald-800">
            Signup<span className="text-amber-600">Dingus</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/lists/new" className="btn-primary">
              New signup list
            </Link>
            <form action={logout}>
              <button type="submit" className="btn-secondary">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}
