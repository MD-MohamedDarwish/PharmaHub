// Landing page and Sign in / Register page.
(function () {
  // ---------------- Landing ----------------
  window.pageHome = function (app) {
    const features = [
      { icon: "ClipboardList", title: tr("home.f1.title"), text: tr("home.f1.text") },
      { icon: "Truck", title: tr("home.f2.title"), text: tr("home.f2.text") },
      { icon: "ShieldCheck", title: tr("home.f3.title"), text: tr("home.f3.text") },
    ];
    app.innerHTML =
      '<div class="min-h-screen bg-background">' +
        '<header class="border-b bg-card">' +
          '<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">' +
            '<div class="flex items-center gap-2">' +
              '<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">' + icon("Pill", "h-5 w-5 text-primary-foreground") + "</div>" +
              '<span class="text-xl font-bold text-foreground">PharmaHUB</span>' +
            "</div>" +
            '<div class="flex items-center gap-3">' + langToggleHtml() +
              '<a href="#/auth" class="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">' + tr("auth.signin") + '</a>' +
            "</div>" +
          "</div>" +
        "</header>" +
        "<main>" +
          '<section class="mx-auto max-w-6xl px-4 py-20 text-center">' +
            '<h1 class="mx-auto max-w-2xl text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">' + tr("home.heroA") + ' <span class="text-primary">' + tr("home.heroB") + '</span></h1>' +
            '<p class="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">' + tr("home.sub") + '</p>' +
            '<div class="mt-8 flex justify-center gap-3">' +
              '<a href="#/auth" class="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90">' + tr("home.getStarted") + '</a>' +
            "</div>" +
          "</section>" +
          '<section class="mx-auto grid max-w-6xl gap-6 px-4 pb-20 sm:grid-cols-3">' +
            features.map((f) =>
              '<div class="rounded-2xl border bg-card p-6 shadow-sm">' +
                '<div class="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">' + icon(f.icon, "h-5 w-5 text-secondary-foreground") + "</div>" +
                '<h3 class="mt-4 font-bold text-foreground">' + f.title + "</h3>" +
                '<p class="mt-1 text-sm text-muted-foreground">' + f.text + "</p>" +
              "</div>").join("") +
          "</section>" +
        "</main>" +
      "</div>";
  };

  // ---------------- Auth ----------------
  window.pageAuth = function (app, ctx) {
    const redirectTo = ctx.params.get("redirect") || undefined;
    const s = { mode: "login", role: "user", email: "", password: "", name: "", phone: "", error: null, notice: null, loading: false };

    async function routeByRole(userId) {
      const { data: roles } = await db.from("user_roles").select("role").eq("user_id", userId);
      const isAdmin = roles && roles.some((r) => r.role === "admin");
      navigate(redirectTo || (isAdmin ? "/admin" : "/shop"), true);
    }

    async function handleLogin(e) {
      e.preventDefault();
      s.error = null; s.loading = true; render();
      try {
        const { data, error: signInError } = await db.auth.signInWithPassword({ email: s.email, password: s.password });
        if (signInError) throw signInError;
        const { data: roles } = await db.from("user_roles").select("role").eq("user_id", data.user.id);
        // Signing in as Admin with a request that is pending / refused: show the status screen.
        // Signing in as Normal User works as usual.
        const { data: reqs } = await db.from("admin_requests").select("status").eq("user_id", data.user.id);
        const req = reqs && reqs[0];
        const alreadyAdmin = roles && roles.some((r) => r.role === "admin");
        if (req && req.status !== "approved" && !alreadyAdmin && s.role === "admin") {
          await db.auth.signOut();
          s.mode = req.status === "pending" ? "pending" : "rejected";
          return;
        }
        const hasRole = roles && roles.some((r) => r.role === s.role);
        if (!hasRole) {
          await db.auth.signOut();
          throw new Error(s.role === "admin" ? tr("auth.noAdminRole") : tr("auth.noUserRole"));
        }
        await routeByRole(data.user.id);
      } catch (err) {
        s.error = err instanceof Error ? err.message : tr("auth.signinFailed");
      } finally {
        s.loading = false; render();
      }
    }

    async function handleSignup(e) {
      e.preventDefault();
      s.error = null; s.notice = null; s.loading = true; render();
      try {
        const origin = window.location.origin && window.location.origin !== "null" ? window.location.origin : window.location.href.split("#")[0];
        const { data, error: signUpError } = await db.auth.signUp({
          email: s.email, password: s.password,
          options: { data: { name: s.name, phone: s.phone, requested_role: s.role === "admin" ? "admin" : "user" }, emailRedirectTo: origin },
        });
        if (signUpError) {
          if (/already|registered|exists/i.test(signUpError.message || "")) throw new Error(tr("auth.userExists"));
          throw signUpError;
        }
        // Supabase hides existing emails by returning a user with no identities
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new Error(tr("auth.userExists"));
        if (!data.session) {
          s.notice = s.role === "admin"
            ? tr("auth.createdAdmin")
            : tr("auth.created");
          s.mode = "login";
        } else if (s.role === "admin") {
          await db.auth.signOut();
          s.mode = "pending"; // admin request sent, waiting for an admin
        } else {
          await routeByRole(data.user.id);
        }
      } catch (err) {
        s.error = err instanceof Error ? err.message : tr("auth.signupFailed");
      } finally {
        s.loading = false; render();
      }
    }

    function render() {
      if (!document.getElementById("auth-root")) return; // navigated away
      if (s.mode === "pending" || s.mode === "rejected") {
        const pending = s.mode === "pending";
        app.innerHTML =
          '<div id="auth-root" class="flex min-h-screen items-center justify-center bg-background px-4">' +
            '<div class="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">' +
              '<div class="-mt-2 mb-2 flex justify-end">' + langToggleHtml() + "</div>" +
              '<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl ' + (pending ? "bg-warning/15" : "bg-destructive/10") + '">' + (pending ? "⏳" : "⛔") + "</div>" +
              '<h1 class="mt-4 text-xl font-bold text-foreground">' + (pending ? tr("auth.pendingTitle") : tr("auth.rejectedTitle")) + "</h1>" +
              '<p class="mt-2 text-sm text-muted-foreground">' +
                (pending
                  ? tr("auth.pendingText")
                  : tr("auth.rejectedText")) +
              "</p>" +
              '<div class="mt-6 flex flex-col gap-2">' +
                (pending ? '<button id="check-again" ' + (s.loading ? "disabled" : "") + ' class="w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60">' + (s.loading ? tr("auth.checking") : tr("auth.checkAgain")) + "</button>" : "") +
                '<button id="back-login" class="w-full rounded-lg border border-input bg-background py-2.5 text-sm font-medium text-foreground hover:bg-muted">' + tr("auth.backToSignin") + '</button>' +
              "</div>" +
            "</div>" +
          "</div>";
        const ca = document.getElementById("check-again");
        if (ca) ca.addEventListener("click", () => handleLogin({ preventDefault() {} }));
        document.getElementById("back-login").addEventListener("click", () => { s.mode = "login"; s.error = null; s.notice = null; render(); });
        return;
      }
      const login = s.mode === "login";
      const lbl = '<label class="mb-1 block text-sm font-medium text-foreground">';
      app.innerHTML =
        '<div id="auth-root" class="flex min-h-screen items-center justify-center bg-background px-4">' +
          '<div class="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">' +
            '<div class="-mt-2 mb-2 flex justify-end">' + langToggleHtml() + "</div>" +
            '<div class="mb-6 flex flex-col items-center">' +
              '<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">' + icon("Pill", "h-6 w-6 text-primary-foreground") + "</div>" +
              '<h1 class="mt-3 text-2xl font-bold text-foreground">PharmaHUB</h1>' +
              '<p class="text-sm text-muted-foreground">' + (login ? tr("auth.subLogin") : tr("auth.subSignup")) + "</p>" +
            "</div>" +
            '<div class="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">' +
              ["login", "signup"].map((m) =>
                '<button type="button" data-mode="' + m + '" class="rounded-md py-2 text-sm font-semibold transition-colors ' +
                (s.mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground") + '">' +
                (m === "login" ? tr("auth.signin") : tr("auth.register")) + "</button>").join("") +
            "</div>" +
            '<form id="auth-form" class="space-y-4">' +
              "<div>" + lbl + (login ? tr("auth.signinAs") : tr("auth.registerAs")) + '</label><div class="grid grid-cols-2 gap-2">' +
                [{ value: "user", label: tr("role.user") }, { value: "admin", label: tr("role.admin") }].map((r) =>
                  '<button type="button" data-role="' + r.value + '" class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors ' +
                  (s.role === r.value ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:bg-muted") + '">' + r.label + "</button>").join("") +
                "</div>" +
                (!login && s.role === "admin" ? '<p class="mt-2 text-xs text-muted-foreground">' + tr("auth.adminNote") + '</p>' : "") +
              "</div>" +
              (login
                ? ""
                : "<div>" + lbl + tr("auth.fullName") + '</label><input data-f="name" class="' + INPUT_CLS + '" value="' + esc(s.name) + '" required /></div>' +
                  "<div>" + lbl + tr("auth.phone") + '</label><input data-f="phone" class="' + INPUT_CLS + '" value="' + esc(s.phone) + '" /></div>') +
              "<div>" + lbl + tr("auth.email") + '</label><input data-f="email" type="email" class="' + INPUT_CLS + '" value="' + esc(s.email) + '" required /></div>' +
              "<div>" + lbl + tr("auth.password") + '</label><input data-f="password" type="password" class="' + INPUT_CLS + '" value="' + esc(s.password) + '" required minlength="6" /></div>' +
              (s.error ? '<p class="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">' + esc(tErr(s.error)) + "</p>" : "") +
              (s.notice ? '<p class="rounded-lg bg-success/15 px-3 py-2 text-sm text-success">' + esc(tErr(s.notice)) + "</p>" : "") +
              '<button type="submit" ' + (s.loading ? "disabled" : "") + ' class="w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60">' +
                (s.loading ? tr("auth.wait") : login ? tr("auth.signin") : tr("auth.createAccount")) + "</button>" +
            "</form>" +
            (login
              ? '<p class="mt-4 text-center text-sm text-muted-foreground">' + tr("auth.noAccount") + ' <button type="button" data-mode="signup" class="font-semibold text-primary hover:underline">' + tr("auth.registerHere") + '</button></p>'
              : "") +
          "</div>" +
        "</div>";

      app.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
        s.mode = b.dataset.mode; s.error = null; s.notice = null; render();
      }));
      app.querySelectorAll("[data-role]").forEach((b) => b.addEventListener("click", () => { s.role = b.dataset.role; render(); }));
      app.querySelectorAll("[data-f]").forEach((i) => i.addEventListener("input", (e) => { s[i.dataset.f] = e.target.value; }));
      document.getElementById("auth-form").addEventListener("submit", login ? handleLogin : handleSignup);
    }

    ctx.onLang(render);
    app.innerHTML = '<div id="auth-root"></div>';
    render();
  };
})();
