import Link from "next/link";
import { notFound } from "next/navigation";
import ManageSignupForm from "@/components/ManageSignupForm";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatSlotDate, type Answer, type Question } from "@/lib/types";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ManageSignupPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;
  if (!UUID_RE.test(token)) notFound();

  const supabase = createAdminClient();
  const { data: signup } = await supabase
    .from("signups")
    .select(
      "id, name, email, phone, comment, answers(*), slots(slot_date, label, details, signup_lists:list_id(slug, title, questions(*)))",
    )
    .eq("edit_token", token)
    .single();

  if (!signup) notFound();

  const slot = signup.slots as unknown as {
    slot_date: string;
    label: string;
    details: string;
    signup_lists: { slug: string; title: string; questions: Question[] };
  };
  const list = slot.signup_lists;
  if (list.slug !== slug) notFound();

  const questions = [...list.questions].sort((a, b) => a.sort_order - b.sort_order);
  const answers = Object.fromEntries(
    (signup.answers as Answer[]).map((a) => [a.question_id, a.value]),
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

      <div className="mx-auto max-w-xl px-6 py-10">
        <h1 className="text-2xl font-bold text-stone-900">Your signup</h1>
        <p className="mt-1 text-sm text-stone-500">
          {list.title} — {slot.label} on {formatSlotDate(slot.slot_date)}
        </p>

        <div className="card mt-6 p-6">
          <ManageSignupForm
            token={token}
            slug={slug}
            initial={{
              name: signup.name,
              email: signup.email,
              phone: signup.phone,
              comment: signup.comment,
              answers,
            }}
            questions={questions}
          />
        </div>

        <p className="mt-6 text-sm text-stone-500">
          <Link href={`/s/${slug}`} className="text-emerald-700 hover:underline">
            ← Back to the signup list
          </Link>
        </p>
      </div>
    </main>
  );
}
