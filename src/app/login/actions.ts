"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthResult = { error?: string; message?: string };

export async function login(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (error) return { error: error.message };
  redirect(String(formData.get("next") || "/dashboard"));
}

export async function signup(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (error) return { error: error.message };

  // If email confirmations are enabled, there is no session yet.
  if (!data.session) {
    return { message: "Check your email to confirm your account, then log in." };
  }
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
