import Link from "next/link";
import { notFound } from "next/navigation";
import CopyButton from "@/components/CopyButton";
import {
  DeleteListButton,
  PublishToggle,
  RemoveSignupButton,
} from "@/components/ListAdminControls";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";
import { formatSlotDate, type Answer, type Question, type Signup, type Slot } from "@/lib/types";

export const dynamic = "force-dynamic";

type SlotWithSignups = Slot & { signups: (Signup & { answers: Answer[] })[] };

export default async function ManageListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: list } = await supabase
    .from("signup_lists")
    .select("*, slots(*, signups(*, answers(*))), questions(*)")
    .eq("id", id)
    .single();

  if (!list) notFound();

  const slots = (list.slots as SlotWithSignups[]).sort(
    (a, b) => a.slot_date.localeCompare(b.slot_date) || a.sort_order - b.sort_order,
  );
  const questions = (list.questions as Question[]).sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  const publicUrl = `${getSiteUrl()}/s/${list.slug}`;
  const totalCapacity = slots.reduce((n, s) => n + s.capacity, 0);
  const filled = slots.reduce((n, s) => n + s.signups.length, 0);

  const allSignups = slots.flatMap((slot) =>
    slot.signups.map((signup) => ({ slot, signup })),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{list.title}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {filled} of {totalCapacity} slots filled
            {!list.published && " · unpublished (volunteers can't see it)"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/lists/${list.id}/edit`} className="btn-secondary">
            Edit
          </Link>
          <PublishToggle listId={list.id} published={list.published} />
          <DeleteListButton listId={list.id} />
        </div>
      </div>

      {/* Sharing */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-stone-900">Share with volunteers</h2>
        <div className="mt-4 flex flex-wrap items-start gap-8">
          <div className="min-w-64 flex-1">
            <p className="label">Public link (email it out)</p>
            <div className="flex items-center gap-2">
              <input readOnly value={publicUrl} className="input font-mono text-xs" />
              <CopyButton text={publicUrl} />
            </div>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-emerald-700 hover:underline"
            >
              Open the public signup page →
            </a>
          </div>
          <div>
            <p className="label">QR code (print it in the bulletin)</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/lists/${list.id}/qr`}
              alt={`QR code linking to ${list.title}`}
              width={160}
              height={160}
              className="rounded-lg border border-stone-200 bg-white p-2"
            />
            <a
              href={`/api/lists/${list.id}/qr?download=1`}
              className="mt-2 inline-block text-sm text-emerald-700 hover:underline"
            >
              Download PNG
            </a>
          </div>
        </div>
      </section>

      {/* Slot status */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-stone-900">Slots</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-stone-500">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Filled</th>
                <th className="py-2 font-medium">Volunteers</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot.id} className="border-b border-stone-100">
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {formatSlotDate(slot.slot_date)}
                  </td>
                  <td className="py-2 pr-4">{slot.label}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    <span
                      className={
                        slot.signups.length >= slot.capacity
                          ? "text-emerald-700 font-medium"
                          : "text-amber-600 font-medium"
                      }
                    >
                      {slot.signups.length}/{slot.capacity}
                    </span>
                  </td>
                  <td className="py-2 text-stone-600">
                    {slot.signups.map((s) => s.name).join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Volunteers */}
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">
            Volunteers ({allSignups.length})
          </h2>
          <a href={`/api/lists/${list.id}/export`} className="btn-secondary">
            Export CSV
          </a>
        </div>

        {allSignups.length === 0 ? (
          <p className="mt-4 rounded-lg bg-stone-50 p-4 text-sm text-stone-500">
            No one has signed up yet. Share the link above to get started.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-stone-500">
                  <th className="py-2 pr-4 font-medium">Slot</th>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Phone</th>
                  <th className="py-2 pr-4 font-medium">Comment</th>
                  {questions.map((q) => (
                    <th key={q.id} className="py-2 pr-4 font-medium">
                      {q.prompt}
                    </th>
                  ))}
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {allSignups.map(({ slot, signup }) => (
                  <tr key={signup.id} className="border-b border-stone-100 align-top">
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {formatSlotDate(slot.slot_date)} — {slot.label}
                    </td>
                    <td className="py-2 pr-4">{signup.name}</td>
                    <td className="py-2 pr-4">
                      <a href={`mailto:${signup.email}`} className="text-emerald-700 hover:underline">
                        {signup.email}
                      </a>
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">{signup.phone || "—"}</td>
                    <td className="py-2 pr-4">{signup.comment || "—"}</td>
                    {questions.map((q) => (
                      <td key={q.id} className="py-2 pr-4">
                        {signup.answers.find((a) => a.question_id === q.id)?.value || "—"}
                      </td>
                    ))}
                    <td className="py-2">
                      <RemoveSignupButton
                        signupId={signup.id}
                        listId={list.id}
                        volunteerName={signup.name}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
