"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatSlotDate, type Question } from "@/lib/types";

export interface PublicSlot {
  id: string;
  slot_date: string;
  label: string;
  details: string;
  capacity: number;
  volunteers: string[];
}

interface Props {
  slug: string;
  slots: PublicSlot[];
  questions: Question[];
}

export default function SlotBoard({ slug, slots, questions }: Props) {
  const [activeSlot, setActiveSlot] = useState<PublicSlot | null>(null);
  const [justSignedUp, setJustSignedUp] = useState<string | null>(null);

  const byDate = new Map<string, PublicSlot[]>();
  for (const slot of slots) {
    const group = byDate.get(slot.slot_date) ?? [];
    group.push(slot);
    byDate.set(slot.slot_date, group);
  }

  return (
    <div className="space-y-6">
      {justSignedUp && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <p className="font-semibold">You&apos;re signed up!</p>
          <p className="mt-1 text-sm">
            Thanks for volunteering for {justSignedUp}. If you need to make a
            change, contact the coordinator listed above.
          </p>
        </div>
      )}

      {[...byDate.entries()].map(([date, dateSlots]) => (
        <section key={date}>
          <h3 className="font-semibold text-stone-900">{formatSlotDate(date)}</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {dateSlots.map((slot) => {
              const openSpots = slot.capacity - slot.volunteers.length;
              const isFull = openSpots <= 0;
              return (
                <div
                  key={slot.id}
                  className={`card p-4 ${isFull ? "opacity-75" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-stone-900">{slot.label}</p>
                      {slot.details && (
                        <p className="mt-1 text-sm text-stone-500">{slot.details}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isFull
                          ? "bg-stone-100 text-stone-500"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isFull
                        ? "Filled"
                        : `${openSpots} open`}
                    </span>
                  </div>

                  {slot.volunteers.length > 0 && (
                    <p className="mt-3 text-sm text-stone-600">
                      <span className="font-medium">Signed up:</span>{" "}
                      {slot.volunteers.join(", ")}
                    </p>
                  )}

                  {!isFull && (
                    <button
                      type="button"
                      onClick={() => {
                        setJustSignedUp(null);
                        setActiveSlot(slot);
                      }}
                      className="btn-primary mt-3 w-full"
                    >
                      Sign up
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {activeSlot && (
        <SignupDialog
          slug={slug}
          slot={activeSlot}
          questions={questions}
          onClose={() => setActiveSlot(null)}
          onSuccess={(label) => {
            setActiveSlot(null);
            setJustSignedUp(label);
          }}
        />
      )}
    </div>
  );
}

function SignupDialog({
  slug,
  slot,
  questions,
  onClose,
  onSuccess,
}: {
  slug: string;
  slot: PublicSlot;
  questions: Question[];
  onClose: () => void;
  onSuccess: (slotLabel: string) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          slot_id: slot.id,
          name,
          email,
          phone,
          comment,
          answers,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      onSuccess(`${slot.label} on ${formatSlotDate(slot.slot_date)}`);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-bold text-stone-900">
          Sign up: {slot.label}
        </h3>
        <p className="mt-1 text-sm text-stone-500">
          {formatSlotDate(slot.slot_date)}
          {slot.details && ` · ${slot.details}`}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="label">Your name *</label>
            <input
              className="input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Email *</label>
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {questions.map((q) => (
            <div key={q.id}>
              <label className="label">
                {q.prompt} {q.required && "*"}
              </label>
              {q.qtype === "long_text" ? (
                <textarea
                  className="input min-h-20"
                  required={q.required}
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                />
              ) : q.qtype === "yes_no" ? (
                <select
                  className="input"
                  required={q.required}
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                >
                  <option value="">Choose…</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              ) : (
                <input
                  className="input"
                  required={q.required}
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                />
              )}
            </div>
          ))}

          <div>
            <label className="label">Comment (optional)</label>
            <input
              className="input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Anything the coordinator should know?"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Signing up…" : "Sign me up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
