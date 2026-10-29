// Supabase client — same setup as the original (new-style publishable keys are opaque, not JWTs).
(function () {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = window.PHARMAHUB_CONFIG;

  function isNewSupabaseApiKey(value) {
    return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
  }

  function createSupabaseFetch(supabaseKey) {
    return function (input, init) {
      const headers = new Headers(
        typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
      );
      if (init && init.headers) {
        new Headers(init.headers).forEach((value, key) => headers.set(key, value));
      }
      if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === "Bearer " + supabaseKey) {
        headers.delete("Authorization");
      }
      headers.set("apikey", supabaseKey);
      return fetch(input, Object.assign({}, init, { headers }));
    };
  }

  window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY) },
    auth: { persistSession: true, autoRefreshToken: true },
  });
})();
