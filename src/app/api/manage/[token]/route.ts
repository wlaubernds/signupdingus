import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Question } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function findSignup(token: string) {
  if (!UUID_RE.test(token)) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("signups")
    .select("id, slot_id, slots(list_id, signup_lists:list_id(id, questions(*)))")
    .eq("edit_token", token)
    .single();
  return data;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const signup = await findSignup(token);
  if (!signup) {
    return NextResponse.json({ error: "Signup not found." }, { status: 404 });
  }

  let body: {
    name?: string;
    phone?: string;
    comment?: string;
    answers?: Record<string, string>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const supabase = createAdminClient();

  const slotRel = signup.slots as unknown as {
    signup_lists: { questions: Question[] };
  };
  const questions = slotRel?.signup_lists?.questions ?? [];
  const answers = body.answers ?? {};
  for (const q of questions) {
    if (q.required && !(answers[q.id] ?? "").trim()) {
      return NextResponse.json(
        { error: `Please answer: "${q.prompt}"` },
        { status: 400 },
      );
    }
  }

  const { error } = await supabase
    .from("signups")
    .update({
      name,
      phone: (body.phone ?? "").trim(),
      comment: (body.comment ?? "").trim(),
    })
    .eq("id", signup.id);
  if (error) {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }

  for (const q of questions) {
    const value = (answers[q.id] ?? "").trim();
    if (value === "") {
      await supabase
        .from("answers")
        .delete()
        .eq("signup_id", signup.id)
        .eq("question_id", q.id);
    } else {
      await supabase
        .from("answers")
        .upsert(
          { signup_id: signup.id, question_id: q.id, value },
          { onConflict: "signup_id,question_id" },
        );
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const signup = await findSignup(token);
  if (!signup) {
    return NextResponse.json({ error: "Signup not found." }, { status: 404 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("signups").delete().eq("id", signup.id);
  if (error) {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
