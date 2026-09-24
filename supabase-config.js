const SUPABASE_URL = "https://viihjrasitrvcwxsbbql.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "اینجا کلید Publishable خودت را بگذار";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
