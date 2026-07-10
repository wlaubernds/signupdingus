"use client";

import Link from "next/link";
import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { login, signup, type AuthResult } from "./actions";

const initialState: AuthResult = {};

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [state, formAction, pending] = useActionState(
    mode === "login" ? login : signup,
    initialState,
  );

  return (
    <div className="card w-full max-w-md p-8">
      <h1 className="text-2xl font-bold text-stone-900">
        {mode === "login" ? "Log in" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Coordinator accounts are used to create and manage signup lists.
        Volunteers don&apos;t need an account.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="input"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="text-sm text-emerald-700" role="status">
            {state.message}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending
            ? "Working…"
            : mode === "login"
              ? "Log in"
              : "Sign up"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="mt-4 text-sm text-emerald-700 hover:underline cursor-pointer"
      >
        {mode === "login"
          ? "New here? Create an account"
          : "Already have an account? Log in"}
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="mb-8 text-2xl font-bold text-emerald-800">
        Signup<span className="text-amber-600">Dingus</span>
      </Link>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
