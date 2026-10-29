// Router + app bootstrap (hash-based so it works from any static host or by opening index.html).
(function () {
  let token = 0;
  let langRender = null; // the current page's own re-draw function (keeps typed text when the language changes)
  const TITLES = {
    "/": "title.home", "/auth": "title.auth", "/shop": "title.shop", "/cart": "title.cart", "/orders": "title.orders",
    "/admin": "title.admin", "/help": "title.help", "/cheaper": "title.cheaper", "/unavailable": "title.unavailable",
    "/notifications": "title.notifications",
  };
  const setTitle = (path) => { document.title = tr(TITLES[path] || "title.default"); };
  const app = document.getElementById("app");
  const AUTHENTICATED = ["/shop", "/cart", "/orders", "/admin", "/help", "/cheaper", "/unavailable", "/notifications"];

  function parseHash() {
    const h = window.location.hash.slice(1) || "/";
    const i = h.indexOf("?");
    return { path: i === -1 ? h : h.slice(0, i), params: new URLSearchParams(i === -1 ? "" : h.slice(i + 1)) };
  }

  window.navigate = function (path, replace) {
    if (replace) window.location.replace(window.location.pathname + window.location.search + "#" + path);
    else window.location.hash = path;
  };

  function notFound() {
    document.title = tr("title.default");
    app.innerHTML =
      '<div class="flex min-h-screen items-center justify-center bg-background px-4">' +
        '<div class="max-w-md text-center">' +
          '<h1 class="text-7xl font-bold text-foreground">404</h1>' +
          '<h2 class="mt-4 text-xl font-semibold text-foreground">' + tr("err404.title") + '</h2>' +
          '<p class="mt-2 text-sm text-muted-foreground">' + tr("err404.text") + '</p>' +
          '<div class="mt-6"><a href="#/" class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">' + tr("common.goHome") + '</a></div>' +
        "</div>" +
      "</div>";
  }

  async function route() {
    const tk = ++token;
    const { path, params } = parseHash();
    langRender = null;
    const ctx = {
      params,
      isCurrent: () => tk === token,
      // a page registers how to re-draw itself when the language button is pressed
      onLang: (fn) => { langRender = { tk, fn }; },
    };
    setTitle(path);
    window.scrollTo(0, 0);

    if (AUTHENTICATED.includes(path)) {
      const { data } = await db.auth.getUser();
      if (!ctx.isCurrent()) return;
      if (!data.user) { navigate("/auth?redirect=" + encodeURIComponent(path), true); return; }
    }

    try {
      switch (path) {
        case "/": return pageHome(app, ctx);
        case "/auth": return pageAuth(app, ctx);
        case "/shop": return await pageShop(app, ctx);
        case "/cart": return pageCart(app, ctx);
        case "/orders": return await pageOrders(app, ctx);
        case "/admin": return await pageAdmin(app, ctx);
        case "/help": return pageHelp(app, ctx);
        case "/cheaper": return await pageCheaper(app, ctx);
        case "/unavailable": return await pageUnavailable(app, ctx);
        case "/notifications": return await pageNotifications(app, ctx);
        default: return notFound();
      }
    } catch (err) {
      console.error(err);
      app.innerHTML =
        '<div class="flex min-h-screen items-center justify-center bg-background px-4">' +
          '<div class="max-w-md text-center">' +
            '<h1 class="text-xl font-semibold tracking-tight text-foreground">' + tr("errPage.title") + '</h1>' +
            '<p class="mt-2 text-sm text-muted-foreground">' + tr("errPage.text") + '</p>' +
            '<div class="mt-6 flex flex-wrap justify-center gap-2">' +
              '<button onclick="location.reload()" class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">' + tr("common.tryAgain") + '</button>' +
              '<a href="#/" class="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">' + tr("common.goHome") + '</a>' +
            "</div>" +
          "</div>" +
        "</div>";
    }
  }

  // Sign out (header button)
  document.addEventListener("click", async function (e) {
    const btn = e.target.closest('[data-action="signout"]');
    if (!btn) return;
    await db.auth.signOut();
    navigate("/auth", true);
  });

  // If the session ends while on a protected page, the guard sends the user to sign in.
  db.auth.onAuthStateChange(function (event) {
    if (event === "SIGNED_OUT" && AUTHENTICATED.includes(parseHash().path)) setTimeout(route, 0);
  });

  // Language button pressed: re-draw the current page in the new language
  window.onLangChange = function () {
    setTitle(parseHash().path);
    if (langRender && langRender.tk === token) langRender.fn();
    else route();
  };

  window.addEventListener("hashchange", route);
  route();
})();
