import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const message =
    "Supabase non è configurato correttamente. Imposta NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.";

  if (process.env.NODE_ENV === "production") {
    throw new Error(message);
  } else {
    // eslint-disable-next-line no-console
    console.warn(message);
  }
}

export const supabaseClient = createClient(
  supabaseUrl ?? "",
  supabaseAnonKey ?? "",
);

