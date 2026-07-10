"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/lib/types";

interface Props {
  token: string;
  slug: string;
  initial: {
    name: string;
    email: string;
    phone: string;
    comment: string;
    answers: Record<string, string>;
  };
  questions: Question[];
}

export default function ManageSignupForm({ token, slug, initial, questions }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [comment, setComment] = useState(initial.comment);
  const [answers, setAnswers] = useState(initial.answers);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      const res = await fetch(`/api/manage/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, comment, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const cancelSignup = async () => {
    if (!confirm("Cancel your signup? Your slot will open back up for others.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/manage/${token}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/s/${slug}?cancelled=1`);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label className="label">Name *</label>
        <input
          className="input"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Email</label>
          <input className="input" value={initial.email} disabled />
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
        <label className="label">Comment</label>
        <input
          className="input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-sm text-emerald-700" role="status">
          Your changes were saved.
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={cancelSignup}
          disabled={busy}
          className="btn-danger"
        >
          Cancel my signup
        </button>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
