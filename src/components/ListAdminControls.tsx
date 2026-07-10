"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteList, removeSignup, setPublished } from "@/app/dashboard/actions";

export function PublishToggle({
  listId,
  published,
}: {
  listId: string;
  published: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="btn-secondary"
      onClick={() =>
        startTransition(async () => {
          await setPublished(listId, !published);
        })
      }
    >
      {published ? "Unpublish" : "Publish"}
    </button>
  );
}

export function DeleteListButton({ listId }: { listId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="btn-danger"
      onClick={() => {
        if (
          confirm(
            "Delete this signup list? All slots and volunteer signups will be permanently removed.",
          )
        ) {
          startTransition(async () => {
            await deleteList(listId);
          });
        }
      }}
    >
      Delete list
    </button>
  );
}

export function RemoveSignupButton({
  signupId,
  listId,
  volunteerName,
}: {
  signupId: string;
  listId: string;
  volunteerName: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      className="text-sm text-red-600 hover:underline cursor-pointer disabled:opacity-50"
      onClick={() => {
        if (confirm(`Remove ${volunteerName} from this slot?`)) {
          startTransition(async () => {
            await removeSignup(signupId, listId);
            router.refresh();
          });
        }
      }}
    >
      Remove
    </button>
  );
}
