import { createClient } from "@/utils/supabase/client";
import { authNetworkErrorMessage } from "@/lib/auth/errors";
import type { AccountType } from "@/lib/types";

export type BrowserAuthResult = { error?: string; ok?: boolean };

export async function browserSignInWithPassword(
  email: string,
  password: string,
  accountType: AccountType
): Promise<BrowserAuthResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return { error: authNetworkErrorMessage(error) };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) return { error: authNetworkErrorMessage(profileError) };
  if (profile && profile.account_type !== accountType) {
    await supabase.auth.signOut();
    return {
      error: `This account is not a ${accountType.replace("_", " ")} account.`,
    };
  }

  return { ok: true };
}

export async function browserSignUp(
  email: string,
  password: string
): Promise<BrowserAuthResult & { userId?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return { error: authNetworkErrorMessage(error) };
  if (!data.user) return { error: "Could not create account." };
  return { ok: true, userId: data.user.id };
}

export async function browserSendOtp(
  email: string,
  mode: "signin" | "signup"
): Promise<BrowserAuthResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: mode === "signup" },
  });
  if (error) return { error: authNetworkErrorMessage(error) };
  return { ok: true };
}

export async function browserVerifyOtp(
  email: string,
  token: string,
  accountType: AccountType
): Promise<BrowserAuthResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: "email",
  });
  if (error) return { error: authNetworkErrorMessage(error) };
  if (!data.user) return { error: "Could not verify code." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) return { error: authNetworkErrorMessage(profileError) };
  if (profile && profile.account_type !== accountType) {
    await supabase.auth.signOut();
    return {
      error: `This account is not a ${accountType.replace("_", " ")} account.`,
    };
  }

  return { ok: true };
}
