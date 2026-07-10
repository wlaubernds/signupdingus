import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  formatSlotDate,
  type Answer,
  type Question,
  type Signup,
  type Slot,
} from "@/lib/types";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // RLS: only the list owner can read the row, so this doubles as auth.
  const supabase = await createClient();
  const { data: list } = await supabase
    .from("signup_lists")
    .select("title, slots(*, signups(*, answers(*))), questions(*)")
    .eq("id", id)
    .single();
  if (!list) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const questions = (list.questions as Question[]).sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const slots = (list.slots as (Slot & { signups: (Signup & { answers: Answer[] })[] })[]).sort(
    (a, b) => a.slot_date.localeCompare(b.slot_date) || a.sort_order - b.sort_order,
  );

  const header = [
    "Date",
    "Role",
    "Name",
    "Email",
    "Phone",
    "Comment",
    "Signed up at",
    ...questions.map((q) => q.prompt),
  ];

  const rows: string[][] = [header];
  for (const slot of slots) {
    for (const signup of slot.signups) {
      rows.push([
        formatSlotDate(slot.slot_date),
        slot.label,
        signup.name,
        signup.email,
        signup.phone,
        signup.comment,
        new Date(signup.created_at).toLocaleString("en-US"),
        ...questions.map(
          (q) => signup.answers.find((a) => a.question_id === q.id)?.value ?? "",
        ),
      ]);
    }
  }

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
  const filename = `${list.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-volunteers.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
