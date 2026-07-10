"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSlot, removeSignup, updateSlot } from "@/app/dashboard/actions";

interface SlotInfo {
  id: string;
  slot_date: string;
  label: string;
  details: string;
  capacity: number;
}

interface Props {
  slot: SlotInfo;
  signups: { id: string; name: string }[];
  listId: string;
}

export default function SlotRowMenu({ slot, signups, listId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const act = (fn: () => Promise<unknown>) => {
    setOpen(false);
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label={`Actions for ${slot.label} on ${slot.slot_date}`}
        className="rounded-lg px-2 py-1 text-stone-500 hover:bg-stone-100 hover:text-stone-800 cursor-pointer disabled:opacity-50"
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
      >
        ⋯
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
            <MenuItem
              label="Edit slot…"
              onClick={() => {
                setOpen(false);
                setEditing(true);
              }}
            />
            {signups.map((s) => (
              <MenuItem
                key={s.id}
                label={`Remove ${s.name}`}
                onClick={() => {
                  if (confirm(`Remove ${s.name} from this slot?`)) {
                    act(() => removeSignup(s.id, listId));
                  }
                }}
              />
            ))}
            <MenuItem
              label="Delete slot"
              danger
              onClick={() => {
                const warning =
                  signups.length > 0
                    ? `Delete this slot? ${signups.length} signup${signups.length === 1 ? "" : "s"} will also be removed.`
                    : "Delete this slot?";
                if (confirm(warning)) {
                  act(() => deleteSlot(slot.id, listId));
                }
              }}
            />
          </div>
        </>
      )}

      {editing && (
        <EditSlotDialog
          slot={slot}
          listId={listId}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full px-3 py-2 text-left text-sm cursor-pointer ${
        danger ? "text-red-600 hover:bg-red-50" : "text-stone-700 hover:bg-stone-50"
      }`}
    >
      {label}
    </button>
  );
}

function EditSlotDialog({
  slot,
  listId,
  onClose,
}: {
  slot: SlotInfo;
  listId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [date, setDate] = useState(slot.slot_date);
  const [label, setLabel] = useState(slot.label);
  const [details, setDetails] = useState(slot.details);
  const [capacity, setCapacity] = useState(slot.capacity);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateSlot(slot.id, listId, {
        slot_date: date,
        label,
        details,
        capacity,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-6 text-left"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-bold text-stone-900">Edit slot</h3>
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label"># needed</label>
              <input
                type="number"
                min={1}
                className="input"
                value={capacity}
                onChange={(e) => setCapacity(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          </div>
          <div>
            <label className="label">Role</label>
            <input
              className="input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Details</label>
            <input
              className="input"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
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
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="btn-primary"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
