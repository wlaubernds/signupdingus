export type QuestionType = "short_text" | "long_text" | "yes_no";

export interface SignupList {
  id: string;
  owner_id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Slot {
  id: string;
  list_id: string;
  slot_date: string; // YYYY-MM-DD
  label: string;
  details: string;
  capacity: number;
  sort_order: number;
  created_at: string;
}

export interface Question {
  id: string;
  list_id: string;
  prompt: string;
  qtype: QuestionType;
  required: boolean;
  sort_order: number;
}

export interface Signup {
  id: string;
  slot_id: string;
  name: string;
  email: string;
  phone: string;
  comment: string;
  edit_token: string;
  created_at: string;
}

export interface Answer {
  id: string;
  signup_id: string;
  question_id: string;
  value: string;
}

/** What the public signup page is allowed to see about a volunteer. */
export interface PublicSignup {
  id: string;
  slot_id: string;
  display_name: string;
}

/** Convert "Jane Doe" to "Jane D." for public display. */
export function toDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export function formatSlotDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
