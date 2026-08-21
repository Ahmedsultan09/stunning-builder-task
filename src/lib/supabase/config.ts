type SupabaseEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
};

const defaultEnvironment: SupabaseEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};

export function isSupabaseConfigured(
  environment: SupabaseEnvironment = defaultEnvironment,
) {
  return Boolean(
    environment.NEXT_PUBLIC_SUPABASE_URL &&
      environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getSupabaseConfig(
  environment: SupabaseEnvironment = defaultEnvironment,
) {
  const url = environment.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase is not configured for this environment.");
  }

  return { url, publishableKey };
}
