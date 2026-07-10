import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendConfirmationEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/site";
import { formatSlotDate, type Question } from "@/lib/types";

interface SignupRequest {
  slug: string;
  slot_id: string;
  name: string;
  email: string;
  phone?: string;
  comment?: string;
  answers?: Record<string, string>; // question_id -> value
}

export async function POST(request: Request) {
  let body: SignupRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // The slot must belong to a published list matching the given slug.
  const { data: list } = await supabase
    .from("signup_lists")
    .select("*, questions(*)")
    .eq("slug", body.slug)
    .eq("published", true)
    .single();
  if (!list) {
    return NextResponse.json({ error: "Signup list not found." }, { status: 404 });
  }

  const { data: slot } = await supabase
    .from("slots")
    .select("*")
    .eq("id", body.slot_id)
    .eq("list_id", list.id)
    .single();
  if (!slot) {
    return NextResponse.json({ error: "Slot not found." }, { status: 404 });
  }

  // Enforce required questions.
  const questions = (list.questions as Question[]) ?? [];
  const answers = body.answers ?? {};
  for (const q of questions) {
    if (q.required && !(answers[q.id] ?? "").trim()) {
      return NextResponse.json(
        { error: `Please answer: "${q.prompt}"` },
        { status: 400 },
      );
    }
  }

  // Insert. The enforce_slot_capacity trigger rejects overfilled slots.
  const { data: signup, error: insertError } = await supabase
    .from("signups")
    .insert({
      slot_id: slot.id,
      name,
      email,
      phone: (body.phone ?? "").trim(),
      comment: (body.comment ?? "").trim(),
    })
    .select("id, edit_token")
    .single();

  if (insertError) {
    if (insertError.message.includes("slot_full")) {
      return NextResponse.json(
        { error: "Sorry, that slot was just filled by someone else." },
        { status: 409 },
      );
    }
    console.error("Signup insert failed:", insertError);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }

  const answerRows = questions
    .map((q) => ({
      signup_id: signup.id,
      question_id: q.id,
      value: (answers[q.id] ?? "").trim(),
    }))
    .filter((row) => row.value !== "");
  if (answerRows.length > 0) {
    const { error: answerError } = await supabase.from("answers").insert(answerRows);
    if (answerError) console.error("Failed to save answers:", answerError);
  }

  const siteUrl = getSiteUrl();
  await sendConfirmationEmail({
    to: email,
    volunteerName: name,
    listTitle: list.title,
    slotLabel: slot.label,
    slotDateFormatted: formatSlotDate(slot.slot_date),
    location: list.location,
    contactName: list.contact_name,
    contactEmail: list.contact_email,
    manageUrl: `${siteUrl}/s/${list.slug}/manage/${signup.edit_token}`,
    publicUrl: `${siteUrl}/s/${list.slug}`,
  });

  return NextResponse.json({ ok: true });
}
