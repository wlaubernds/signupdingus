"use client";

import { useState, useTransition } from "react";
import {
  saveList,
  type ListPayload,
  type SlotDraft,
  type QuestionDraft,
} from "@/app/dashboard/actions";
import type { QuestionType } from "@/lib/types";

interface Props {
  initial?: ListPayload;
}

const emptySlot = (): SlotDraft => ({
  slot_date: "",
  label: "",
  details: "",
  capacity: 1,
});

const emptyQuestion = (): QuestionDraft => ({
  prompt: "",
  qtype: "short_text",
  required: false,
});

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isSunday(isoDate: string): boolean {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 0;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Generate the standard host-week slots: 7 meal hosts + 7 overnight hosts. */
function hostWeekSlots(startSunday: string): SlotDraft[] {
  const slots: SlotDraft[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(startSunday, i);
    const day = DAY_NAMES[(0 + i) % 7];
    slots.push({
      slot_date: date,
      label: "Meal Host",
      details: `Provide and serve dinner for the families ${day} evening.`,
      capacity: 1,
    });
    slots.push({
      slot_date: date,
      label: "Overnight Host",
      details: `Stay overnight at the church ${day} evening through the next morning.`,
      capacity: 1,
    });
  }
  return slots;
}

export default function ListEditor({ initial }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [contactName, setContactName] = useState(initial?.contact_name ?? "");
  const [contactEmail, setContactEmail] = useState(initial?.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(initial?.contact_phone ?? "");
  const [slots, setSlots] = useState<SlotDraft[]>(initial?.slots ?? []);
  const [questions, setQuestions] = useState<QuestionDraft[]>(initial?.questions ?? []);
  const [templateStart, setTemplateStart] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const updateSlot = (i: number, patch: Partial<SlotDraft>) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const updateQuestion = (i: number, patch: Partial<QuestionDraft>) =>
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const applyHostWeek = () => {
    if (!templateStart) {
      setError("Pick the start Sunday for the host week first.");
      return;
    }
    if (!isSunday(templateStart)) {
      setError("The host week template expects the start date to be a Sunday.");
      return;
    }
    setError(null);
    setSlots((prev) => [...prev, ...hostWeekSlots(templateStart)]);
  };

  const submit = () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (slots.length === 0) {
      setError("Add at least one slot.");
      return;
    }
    if (slots.some((s) => !s.slot_date)) {
      setError("Every slot needs a date.");
      return;
    }
    const sorted = [...slots].sort(
      (a, b) => a.slot_date.localeCompare(b.slot_date) || a.label.localeCompare(b.label),
    );
    startTransition(async () => {
      const result = await saveList({
        id: initial?.id,
        title,
        description,
        location,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        slots: sorted,
        questions,
      });
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="space-y-8">
      {/* Details */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-stone-900">Details</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Family Promise Host Week — March 8-15"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-28"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell volunteers what this opportunity is about, what to expect, arrival times, etc."
            />
          </div>
          <div>
            <label className="label">Location</label>
            <input
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="First Presbyterian Church, 123 Main St"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Contact name</label>
              <input
                className="input"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Contact email</label>
              <input
                className="input"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Contact phone</label>
              <input
                className="input"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Slots */}
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-stone-900">Slots</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              className="input w-auto"
              value={templateStart}
              onChange={(e) => setTemplateStart(e.target.value)}
              aria-label="Host week start Sunday"
            />
            <button type="button" onClick={applyHostWeek} className="btn-secondary">
              Add Host Week (14 slots)
            </button>
            <button
              type="button"
              onClick={() => setSlots((prev) => [...prev, emptySlot()])}
              className="btn-secondary"
            >
              Add slot
            </button>
          </div>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          The Host Week template creates a Meal Host and an Overnight Host slot for
          each day, Sunday through Saturday.
        </p>

        {slots.length === 0 ? (
          <p className="mt-4 rounded-lg bg-stone-50 p-4 text-sm text-stone-500">
            No slots yet. Use the Host Week template or add slots one at a time.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {slots.map((slot, i) => (
              <div
                key={slot.id ?? `new-${i}`}
                className="grid gap-3 rounded-lg border border-stone-200 p-3 sm:grid-cols-[10rem_12rem_1fr_5rem_auto]"
              >
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    className="input"
                    value={slot.slot_date}
                    onChange={(e) => updateSlot(i, { slot_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Role</label>
                  <input
                    className="input"
                    value={slot.label}
                    onChange={(e) => updateSlot(i, { label: e.target.value })}
                    placeholder="Meal Host"
                  />
                </div>
                <div>
                  <label className="label">Details</label>
                  <input
                    className="input"
                    value={slot.details}
                    onChange={(e) => updateSlot(i, { details: e.target.value })}
                    placeholder="What does this volunteer do?"
                  />
                </div>
                <div>
                  <label className="label"># needed</label>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={slot.capacity}
                    onChange={(e) =>
                      updateSlot(i, { capacity: Math.max(1, Number(e.target.value) || 1) })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setSlots((prev) => prev.filter((_, idx) => idx !== i))}
                    className="btn-danger"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Questions */}
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">
            Questions for volunteers
          </h2>
          <button
            type="button"
            onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
            className="btn-secondary"
          >
            Add question
          </button>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          Volunteers answer these when they sign up (e.g. &quot;What meal are you
          planning to bring?&quot;).
        </p>

        {questions.length > 0 && (
          <div className="mt-4 space-y-3">
            {questions.map((q, i) => (
              <div
                key={q.id ?? `new-${i}`}
                className="grid gap-3 rounded-lg border border-stone-200 p-3 sm:grid-cols-[1fr_11rem_auto_auto]"
              >
                <div>
                  <label className="label">Question</label>
                  <input
                    className="input"
                    value={q.prompt}
                    onChange={(e) => updateQuestion(i, { prompt: e.target.value })}
                    placeholder="What will you bring for dinner?"
                  />
                </div>
                <div>
                  <label className="label">Answer type</label>
                  <select
                    className="input"
                    value={q.qtype}
                    onChange={(e) =>
                      updateQuestion(i, { qtype: e.target.value as QuestionType })
                    }
                  >
                    <option value="short_text">Short text</option>
                    <option value="long_text">Long text</option>
                    <option value="yes_no">Yes / No</option>
                  </select>
                </div>
                <label className="flex items-end gap-2 pb-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => updateQuestion(i, { required: e.target.checked })}
                    className="h-4 w-4 accent-emerald-700"
                  />
                  Required
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() =>
                      setQuestions((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="btn-danger"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="btn-primary px-8"
        >
          {pending ? "Saving…" : initial?.id ? "Save changes" : "Create signup list"}
        </button>
      </div>
    </div>
  );
}
