import { notFound } from "next/navigation";
import SlotBoard, { type PublicSlot } from "@/components/SlotBoard";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  toDisplayName,
  type Question,
  type Signup,
  type Slot,
} from "@/lib/types";

export const dynamic = "force-dynamic";

type SlotWithSignups = Slot & { signups: Pick<Signup, "id" | "name">[] };

export default async function PublicSignupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: list } = await supabase
    .from("signup_lists")
    .select(
      "id, slug, title, description, location, contact_name, contact_email, contact_phone, published, slots(id, slot_date, label, details, capacity, sort_order, signups(id, name)), questions(id, prompt, qtype, required, sort_order)",
    )
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!list) notFound();

  // Strip volunteer data down to display names before it reaches the client.
  const slots: PublicSlot[] = (list.slots as SlotWithSignups[])
    .sort(
      (a, b) =>
        a.slot_date.localeCompare(b.slot_date) || a.sort_order - b.sort_order,
    )
    .map((slot) => ({
      id: slot.id,
      slot_date: slot.slot_date,
      label: slot.label,
      details: slot.details,
      capacity: slot.capacity,
      volunteers: slot.signups.map((s) => toDisplayName(s.name)),
    }));

  const questions = (list.questions as Question[]).sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return (
    <main className="flex-1">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <span className="text-lg font-bold text-emerald-800">
            Signup<span className="text-amber-600">Dingus</span>
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold text-stone-900">{list.title}</h1>

        <div className="mt-4 space-y-1 text-sm text-stone-600">
          {list.location && (
            <p>
              <span className="font-medium text-stone-700">Where:</span>{" "}
              {list.location}
            </p>
          )}
          {(list.contact_name || list.contact_email || list.contact_phone) && (
            <p>
              <span className="font-medium text-stone-700">Contact:</span>{" "}
              {[list.contact_name, list.contact_email, list.contact_phone]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>

        {list.description && (
          <div className="card mt-6 p-5">
            <p className="whitespace-pre-wrap text-stone-700">{list.description}</p>
          </div>
        )}

        <h2 className="mt-10 text-xl font-semibold text-stone-900">
          Available slots
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Click an open slot to sign up. No account needed.
        </p>

        <div className="mt-6">
          <SlotBoard slug={list.slug} slots={slots} questions={questions} />
        </div>
      </div>
    </main>
  );
}
