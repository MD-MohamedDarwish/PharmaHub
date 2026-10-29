// Shared UI helpers: escaping, icons (Lucide paths), order statuses, header.
(function () {
  const ICONS = {
    Pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
    ShoppingCart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    LogOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    Package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    Trash2: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    Pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
    Plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    ShieldCheck: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    Truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    ClipboardList: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
    Languages: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  };

  window.icon = function (name, cls) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' +
      (cls || "") + '">' + ICONS[name] + "</svg>";
  };

  window.esc = function (v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  window.INPUT_CLS =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  // ---- Order statuses (0=Pending, 1=Delivering, 2=Delivered, 3=Not Delivered, 4=Canceled)
  window.ORDER_STATUSES = [
    { value: 0, label: "Pending", labelAr: "قيد الانتظار" },
    { value: 1, label: "Delivering", labelAr: "قيد التوصيل" },
    { value: 2, label: "Delivered", labelAr: "تم التوصيل" },
    { value: 3, label: "Not Delivered", labelAr: "لم يتم التوصيل" },
    { value: 4, label: "Canceled", labelAr: "ملغي" },
  ];
  window.statusLabel = function (status) {
    return window.ORDER_STATUSES.find((s) => s.value === status) || window.ORDER_STATUSES[0];
  };
  // Status name in the current language
  window.statusText = function (status) {
    return tr("status." + window.statusLabel(status).value);
  };
  window.statusClasses = function (status) {
    switch (status) {
      case 0: return "bg-warning/15 text-warning-foreground";
      case 1: return "bg-primary/10 text-primary";
      case 2: return "bg-success/15 text-success";
      case 3:
      case 4: return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // ---- Header (AppHeader)
  const WHATSAPP_URL = "https://wa.me/201104275696"; // 01104275696 (Egypt, +20)
  const WHATSAPP_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-7 w-7" aria-hidden="true">' +
    '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>' +
    "</svg>";

  // Unread notifications (red badge on the Notifications link)
  let unreadNotifications = 0;
  window.loadUnreadNotifications = async function () {
    try {
      const { data } = await db.auth.getSession();
      if (!data.session) { unreadNotifications = 0; return; }
      const { count } = await db.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false);
      unreadNotifications = count || 0;
      window.refreshHeader();
    } catch (err) { console.error(err); }
  };
  window.addEventListener("hashchange", window.loadUnreadNotifications);
  setTimeout(window.loadUnreadNotifications, 0);

  window.appHeader = function (isAdmin) {
    const count = window.Cart.count;
    // Current page (from the hash) so the matching link gets a background + underline
    const path = (window.location.hash.slice(1) || "/").split("?")[0];
    const linkCls = (to, also) =>
      "rounded-t-md border-b-2 px-3 py-1.5 text-sm font-medium transition-colors " +
      (path === to || [].concat(also || []).includes(path)
        ? "border-primary bg-primary/10 text-primary"
        : "border-transparent text-muted-foreground hover:text-foreground");
    const nav = isAdmin
      ? '<a href="#/admin" class="' + linkCls("/admin") + '">' + tr("nav.dashboard") + '</a>'
      : '<a href="#/shop" class="' + linkCls("/shop") + '">' + tr("nav.shop") + '</a>' +
        '<a href="#/orders" class="' + linkCls("/orders") + '">' + tr("nav.orders") + '</a>' +
        '<a href="#/help" class="' + linkCls("/help", ["/cheaper", "/unavailable"]) + '">' + tr("nav.help") + '</a>' +
        '<a href="#/notifications" class="relative ' + linkCls("/notifications") + '">' + tr("nav.notifications") +
          (unreadNotifications > 0
            ? '<span class="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">' + unreadNotifications + "</span>"
            : "") +
        "</a>" +
        '<a href="#/cart" class="relative ' + linkCls("/cart") + '">' +
          icon("ShoppingCart", "h-5 w-5") +
          (count > 0
            ? '<span class="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">' + count + "</span>"
            : "") +
        "</a>";
    const deleteBtn = isAdmin
      ? ""
      : '<button data-action="delete-account" title="' + esc(tr("header.deleteAccount")) + '" class="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive">' +
          icon("Trash2", "h-4 w-4") + '<span class="hidden sm:inline"> ' + tr("header.deleteAccountShort") + '</span>' +
        "</button>";
    const whatsapp = isAdmin
      ? ""
      : '<a id="wa-float" class="wa-float" href="' + WHATSAPP_URL + '" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="' + esc(tr("header.whatsapp")) + '">' +
          WHATSAPP_ICON +
        "</a>";
    return (
      '<header id="app-header" data-admin="' + (isAdmin ? "1" : "0") + '" class="sticky top-0 z-10 border-b bg-card/95 backdrop-blur">' +
        '<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">' +
          '<a href="#' + (isAdmin ? "/admin" : "/shop") + '" class="flex items-center gap-2">' +
            '<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">' + icon("Pill", "h-4 w-4 text-primary-foreground") + "</div>" +
            '<span class="text-lg font-bold text-foreground">PharmaHUB</span>' +
          "</a>" +
          '<nav class="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 sm:gap-x-5">' + nav + langToggleHtml() +
            '<button data-action="signout" class="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive">' +
              icon("LogOut", "h-4 w-4") + " " + tr("header.signout") +
            "</button>" +
            deleteBtn +
          "</nav>" +
        "</div>" +
      "</header>" +
      whatsapp
    );
  };

  // Re-draw only the header (used when the cart count changes)
  window.refreshHeader = function () {
    const el = document.getElementById("app-header");
    if (!el) return;
    const wa = document.getElementById("wa-float");
    if (wa) wa.remove();
    el.outerHTML = window.appHeader(el.dataset.admin === "1");
  };
  window.Cart.subscribe(window.refreshHeader);

  // ---- Delete my account (Normal User only) — confirm dialog + delete_my_account() RPC
  function openDeleteAccountModal() {
    if (document.getElementById("delete-account-modal")) return;
    const wrap = document.createElement("div");
    wrap.id = "delete-account-modal";
    wrap.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4";
    wrap.innerHTML =
      '<div class="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg">' +
        '<h2 class="text-lg font-bold text-foreground">' + tr("del.title") + '</h2>' +
        '<p class="mt-2 text-sm text-muted-foreground">' + tr("del.body") + '</p>' +
        '<label class="mb-1 mt-4 block text-sm font-medium text-foreground">' + tr("del.typeConfirm") + '</label>' +
        '<input id="del-confirm" autocomplete="off" class="' + INPUT_CLS + '" />' +
        '<p id="del-error" class="mt-3 hidden rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"></p>' +
        '<div class="mt-5 flex justify-end gap-2">' +
          '<button id="del-cancel" type="button" class="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">' + tr("common.cancel") + '</button>' +
          '<button id="del-ok" type="button" disabled class="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50">' + tr("header.deleteAccount") + '</button>' +
        "</div>" +
      "</div>";
    document.body.appendChild(wrap);

    const input = wrap.querySelector("#del-confirm");
    const ok = wrap.querySelector("#del-ok");
    const cancel = wrap.querySelector("#del-cancel");
    const err = wrap.querySelector("#del-error");
    const close = () => wrap.remove();
    input.focus();
    input.addEventListener("input", () => { ok.disabled = input.value.trim() !== "DELETE"; });
    cancel.addEventListener("click", close);
    wrap.addEventListener("click", (e) => { if (e.target === wrap && !ok.dataset.busy) close(); });

    ok.addEventListener("click", async function () {
      if (input.value.trim() !== "DELETE") return;
      ok.dataset.busy = "1"; ok.disabled = true; cancel.disabled = true;
      ok.textContent = tr("del.deleting"); err.classList.add("hidden");
      const { error } = await db.rpc("delete_my_account");
      if (error) {
        err.textContent = error.message ? tErr(error.message) : tr("del.failed");
        err.classList.remove("hidden");
        delete ok.dataset.busy; ok.disabled = false; cancel.disabled = false; ok.textContent = tr("header.deleteAccount");
        return;
      }
      window.Cart.clear();
      close();
      navigate("/auth", true);
      await db.auth.signOut({ scope: "local" }); // the user no longer exists server-side, so just clear the local session
    });
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest('[data-action="delete-account"]')) openDeleteAccountModal();
  });
})();
