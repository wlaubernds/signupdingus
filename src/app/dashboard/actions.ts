"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { QuestionType } from "@/lib/types";

export interface SlotDraft {
  id?: string;
  slot_date: string;
  label: string;
  details: string;
  capacity: number;
}

export interface QuestionDraft {
  id?: string;
  prompt: string;
  qtype: QuestionType;
  required: boolean;
}

export interface ListPayload {
  id?: string;
  title: string;
  description: string;
  location: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  slots: SlotDraft[];
  questions: QuestionDraft[];
}

export async function saveList(payload: ListPayload): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (!payload.title.trim()) return { error: "Title is required." };
  if (payload.slots.length === 0) return { error: "Add at least one slot." };

  const listFields = {
    title: payload.title.trim(),
    description: payload.description.trim(),
    location: payload.location.trim(),
    contact_name: payload.contact_name.trim(),
    contact_email: payload.contact_email.trim(),
    contact_phone: payload.contact_phone.trim(),
    updated_at: new Date().toISOString(),
  };

  let listId = payload.id;

  if (listId) {
    const { error } = await supabase
      .from("signup_lists")
      .update(listFields)
      .eq("id", listId);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase
      .from("signup_lists")
      .insert({ ...listFields, owner_id: user.id })
      .select("id")
      .single();
    if (error) return { error: error.message };
    listId = data.id;
  }

  // Reconcile slots: update existing, insert new, delete removed.
  {
    const { data: existing, error } = await supabase
      .from("slots")
      .select("id")
      .eq("list_id", listId);
    if (error) return { error: error.message };

    const keptIds = new Set(payload.slots.map((s) => s.id).filter(Boolean));
    const toDelete = (existing ?? []).filter((s) => !keptIds.has(s.id));
    if (toDelete.length > 0) {
      const { error: delError } = await supabase
        .from("slots")
        .delete()
        .in("id", toDelete.map((s) => s.id));
      if (delError) return { error: delError.message };
    }

    for (let i = 0; i < payload.slots.length; i++) {
      const s = payload.slots[i];
      const row = {
        list_id: listId,
        slot_date: s.slot_date,
        label: s.label.trim() || "Volunteer",
        details: s.details.trim(),
        capacity: Math.max(1, s.capacity),
        sort_order: i,
      };
      const { error: slotError } = s.id
        ? await supabase.from("slots").update(row).eq("id", s.id)
        : await supabase.from("slots").insert(row);
      if (slotError) return { error: slotError.message };
    }
  }

  // Reconcile questions the same way.
  {
    const { data: existing, error } = await supabase
      .from("questions")
      .select("id")
      .eq("list_id", listId);
    if (error) return { error: error.message };

    const keptIds = new Set(payload.questions.map((q) => q.id).filter(Boolean));
    const toDelete = (existing ?? []).filter((q) => !keptIds.has(q.id));
    if (toDelete.length > 0) {
      const { error: delError } = await supabase
        .from("questions")
        .delete()
        .in("id", toDelete.map((q) => q.id));
      if (delError) return { error: delError.message };
    }

    for (let i = 0; i < payload.questions.length; i++) {
      const q = payload.questions[i];
      if (!q.prompt.trim()) continue;
      const row = {
        list_id: listId,
        prompt: q.prompt.trim(),
        qtype: q.qtype,
        required: q.required,
        sort_order: i,
      };
      const { error: qError } = q.id
        ? await supabase.from("questions").update(row).eq("id", q.id)
        : await supabase.from("questions").insert(row);
      if (qError) return { error: qError.message };
    }
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/lists/${listId}`);
}

export async function deleteList(listId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("signup_lists").delete().eq("id", listId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function setPublished(listId: string, published: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("signup_lists")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", listId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/lists/${listId}`);
  return {};
}

export async function updateSlot(
  slotId: string,
  listId: string,
  fields: { slot_date: string; label: string; details: string; capacity: number },
): Promise<{ error?: string }> {
  const supabase = await createClient();

  if (!fields.slot_date) return { error: "Date is required." };

  const { count } = await supabase
    .from("signups")
    .select("id", { count: "exact", head: true })
    .eq("slot_id", slotId);
  if (count !== null && fields.capacity < count) {
    return {
      error: `Capacity can't be less than the ${count} volunteer${count === 1 ? "" : "s"} already signed up. Remove them first.`,
    };
  }

  const { error } = await supabase
    .from("slots")
    .update({
      slot_date: fields.slot_date,
      label: fields.label.trim() || "Volunteer",
      details: fields.details.trim(),
      capacity: Math.max(1, fields.capacity),
    })
    .eq("id", slotId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/lists/${listId}`);
  return {};
}

export async function deleteSlot(slotId: string, listId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("slots").delete().eq("id", slotId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/lists/${listId}`);
  return {};
}

export async function removeSignup(signupId: string, listId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("signups").delete().eq("id", signupId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/lists/${listId}`);
  return {};
}
