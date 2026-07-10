import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatSlotDate } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: lists } = await supabase
    .from("signup_lists")
    .select("id, title, slug, published, created_at, slots(id, slot_date, capacity, signups(id))")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Your signup lists</h1>

      {!lists || lists.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="text-stone-600">
            You don&apos;t have any signup lists yet.
          </p>
          <Link href="/dashboard/lists/new" className="btn-primary mt-4">
            Create your first list
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {lists.map((list) => {
            const totalCapacity = list.slots.reduce((n, s) => n + s.capacity, 0);
            const filled = list.slots.reduce((n, s) => n + s.signups.length, 0);
            const dates = list.slots.map((s) => s.slot_date).sort();
            return (
              <Link
                key={list.id}
                href={`/dashboard/lists/${list.id}`}
                className="card p-5 hover:border-emerald-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-stone-900">{list.title}</h2>
                  {!list.published && (
                    <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                      Unpublished
                    </span>
                  )}
                </div>
                {dates.length > 0 && (
                  <p className="mt-1 text-sm text-stone-500">
                    {formatSlotDate(dates[0])}
                    {dates.length > 1 && ` – ${formatSlotDate(dates[dates.length - 1])}`}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600"
                      style={{
                        width: totalCapacity
                          ? `${Math.round((filled / totalCapacity) * 100)}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <span className="text-sm text-stone-600">
                    {filled}/{totalCapacity} filled
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
