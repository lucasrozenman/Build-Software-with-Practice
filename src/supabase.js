import { createClient } from "@supabase/supabase-js";

// Strip out trailing slashes or accidentally pasted /rest/v1 paths
const rawUrl = import.meta.env.VITE_SUPABASE_URL || "";
const cleanUrl = rawUrl
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/+$/, "");

const supabaseUrl = cleanUrl || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    "Supabase environment variables are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);