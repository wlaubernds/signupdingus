import { notFound } from "next/navigation";
import ListEditor from "@/components/ListEditor";
import { createClient } from "@/lib/supabase/server";
import type { Question, Slot } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: list } = await supabase
    .from("signup_lists")
    .select("*, slots(*), questions(*)")
    .eq("id", id)
    .single();

  if (!list) notFound();

  const slots = (list.slots as Slot[])
    .sort((a, b) => a.slot_date.localeCompare(b.slot_date) || a.sort_order - b.sort_order)
    .map((s) => ({
      id: s.id,
      slot_date: s.slot_date,
      label: s.label,
      details: s.details,
      capacity: s.capacity,
    }));

  const questions = (list.questions as Question[])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((q) => ({
      id: q.id,
      prompt: q.prompt,
      qtype: q.qtype,
      required: q.required,
    }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Edit signup list</h1>
      <p className="mt-1 text-sm text-red-600">
        Careful: removing a slot also removes anyone signed up for it.
      </p>
      <div className="mt-6">
        <ListEditor
          initial={{
            id: list.id,
            title: list.title,
            description: list.description,
            location: list.location,
            contact_name: list.contact_name,
            contact_email: list.contact_email,
            contact_phone: list.contact_phone,
            slots,
            questions,
          }}
        />
      </div>
    </div>
  );
}
