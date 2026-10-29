// Shop, Cart and My Orders pages (Normal User).
(function () {
  // ---------------- Shop ----------------
  window.pageShop = async function (app, ctx) {
    let selectedCategory = null;
    let added = null;
    let categories = [];
    let medicines = [];
    let loading = true;
    let search = (ctx.params && ctx.params.get("q")) || "";

    const catBtn = (active, id, label) =>
      '<button data-cat="' + id + '" class="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ' +
      (active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-muted-foreground hover:bg-muted") + '">' + label + "</button>";

    function cardHtml(med) {
      const inCart = Cart.items.find((i) => i.medicineId === med.id);
      let action;
      if (inCart) {
        action =
          '<div class="mt-3 flex items-center justify-between rounded-lg border border-primary bg-primary/5 px-2 py-1.5">' +
            '<button data-dec="' + med.id + '" class="h-8 w-8 rounded-md border border-primary text-lg font-bold text-primary hover:bg-primary/10" aria-label="' + tr("common.decrease") + '">−</button>' +
            '<span class="text-sm font-bold text-foreground">' + tr("shop.inCart", { n: inCart.quantity }) + "</span>" +
            '<button data-inc="' + med.id + '" ' + (inCart.quantity >= med.quantity ? "disabled" : "") + ' class="h-8 w-8 rounded-md border border-primary text-lg font-bold text-primary hover:bg-primary/10 disabled:opacity-40" aria-label="' + tr("common.increase") + '">+</button>' +
          "</div>";
      } else {
        action =
          '<button data-add="' + med.id + '" ' + (med.quantity === 0 ? "disabled" : "") + ' class="mt-3 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">' +
          (added === med.id ? tr("shop.added") : tr("shop.addToCart")) + "</button>";
      }
      return (
        '<div class="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">' +
          '<div class="flex h-44 items-center justify-center bg-muted">' +
            (med.image
              ? '<img src="' + esc(med.image) + '" alt="' + esc(med.name) + '" class="h-full w-full object-cover" loading="lazy" />'
              : icon("Package", "h-10 w-10 text-muted-foreground")) +
          "</div>" +
          '<div class="flex flex-1 flex-col p-4">' +
            '<h3 dir="auto" class="font-bold text-foreground">' + esc(med.name) + "</h3>" +
            '<p dir="auto" class="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">' + esc(med.description) + "</p>" +
            '<div class="mt-3 flex items-center justify-between">' +
              '<span class="text-lg font-bold text-primary">' + money(med.price) + "</span>" +
              '<span class="text-xs font-medium ' + (med.quantity > 0 ? "text-success" : "text-destructive") + '">' +
                (med.quantity > 0 ? tr("shop.inStock", { n: med.quantity }) : tr("shop.outOfStock")) + "</span>" +
            "</div>" +
            action +
          "</div>" +
        "</div>"
      );
    }

    function render() {
      if (!document.getElementById("shop-root")) return;
      // keep the cursor in the search box while the page re-draws
      const active = document.activeElement;
      const hadFocus = !!active && active.id === "shop-search";
      const caret = hadFocus ? active.selectionStart : null;
      const q = search.trim().toLowerCase();
      const shown = q ? medicines.filter((m) => String(m.name || "").toLowerCase().includes(q)) : medicines;
      app.innerHTML =
        '<div id="shop-root" class="min-h-screen bg-background">' +
          appHeader(false) +
          '<main class="mx-auto max-w-6xl px-4 py-8">' +
            '<h1 class="text-2xl font-bold text-foreground">' + tr("shop.title") + '</h1>' +
            '<input id="shop-search" type="search" dir="auto" autocomplete="off" placeholder="' + esc(tr("common.searchByName")) + '" value="' + esc(search) + '" class="mt-4 ' + INPUT_CLS + ' sm:max-w-md" />' +
            '<div class="mt-5 flex flex-wrap gap-2">' +
              catBtn(selectedCategory === null, "all", tr("common.all")) +
              categories.map((c) => catBtn(selectedCategory === c.id, c.id, '<span dir="auto">' + esc(c.name) + "</span>")).join("") +
            "</div>" +
            (loading
              ? '<p class="mt-10 text-center text-muted-foreground">' + tr("shop.loading") + '</p>'
              : shown.length === 0
                ? '<p class="mt-10 text-center text-muted-foreground">' + tr("common.noMedicines") + '</p>'
                : '<div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">' + shown.map(cardHtml).join("") + "</div>") +
          "</main>" +
        "</div>";
      if (hadFocus) {
        const input = document.getElementById("shop-search");
        if (input) { input.focus(); input.setSelectionRange(caret, caret); }
      }
    }

    async function loadMedicines() {
      loading = true; render();
      let q = db.from("medicines").select("*").order("id");
      if (selectedCategory !== null) q = q.eq("category_id", selectedCategory);
      const { data, error } = await q;
      if (!ctx.isCurrent()) return;
      if (error) console.error(error);
      medicines = data || [];
      loading = false; render();
    }

    function handleAdd(med) {
      Cart.addItem({ medicineId: med.id, name: med.name, price: Number(med.price), image: med.image, maxQuantity: med.quantity }, 1);
      added = med.id;
      setTimeout(() => { added = null; if (ctx.isCurrent()) render(); }, 1200);
    }

    app.addEventListener("click", function onClick(e) {
      if (!ctx.isCurrent()) return app.removeEventListener("click", onClick);
      const t = e.target.closest("[data-cat],[data-add],[data-inc],[data-dec]");
      if (!t || !app.contains(t)) return;
      if (t.dataset.cat !== undefined) {
        selectedCategory = t.dataset.cat === "all" ? null : Number(t.dataset.cat);
        loadMedicines();
        return;
      }
      const id = Number(t.dataset.add || t.dataset.inc || t.dataset.dec);
      const med = medicines.find((m) => m.id === id);
      const inCart = Cart.items.find((i) => i.medicineId === id);
      if (t.dataset.add !== undefined && med) handleAdd(med);
      else if (t.dataset.inc !== undefined && inCart) Cart.updateQuantity(id, inCart.quantity + 1);
      else if (t.dataset.dec !== undefined && inCart) Cart.updateQuantity(id, inCart.quantity - 1);
      render();
    });

    app.addEventListener("input", function onInput(e) {
      if (!ctx.isCurrent()) return app.removeEventListener("input", onInput);
      if (e.target.id !== "shop-search") return;
      search = e.target.value;
      render();
    });

    ctx.onLang(render);
    app.innerHTML = '<div id="shop-root"></div>';
    render();
    const { data: cats, error } = await db.from("categories").select("*").order("id");
    if (!ctx.isCurrent()) return;
    if (error) console.error(error);
    categories = cats || [];
    await loadMedicines();
  };

  // ---------------- Cart ----------------
  window.pageCart = function (app, ctx) {
    let address = "";
    let loading = false;
    let error = null;

    async function placeOrder() {
      error = null;
      if (!address.trim()) { error = tr("cart.needAddress"); render(); return; }
      loading = true; render();
      try {
        const { error: rpcError } = await db.rpc("place_order", {
          _address: address.trim(),
          _items: Cart.items.map((i) => ({ medicine_id: i.medicineId, quantity: i.quantity })),
        });
        if (rpcError) throw rpcError;
        Cart.clear();
        navigate("/orders");
        return;
      } catch (err) {
        error = err instanceof Error ? err.message : tr("cart.failed");
      }
      loading = false;
      if (ctx.isCurrent()) render();
    }

    function render() {
      if (!document.getElementById("cart-root")) return;
      const items = Cart.items;
      let body;
      if (items.length === 0) {
        body =
          '<div class="mt-10 rounded-2xl border bg-card p-10 text-center">' +
            '<p class="text-muted-foreground">' + tr("cart.empty") + '</p>' +
            '<a href="#/shop" class="mt-4 inline-block rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">' + tr("cart.browse") + '</a>' +
          "</div>";
      } else {
        body =
          '<div class="mt-6 space-y-3">' +
            items.map((item) =>
              '<div class="flex items-center gap-4 rounded-xl border bg-card p-4">' +
                '<div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">' +
                  (item.image ? '<img src="' + esc(item.image) + '" alt="' + esc(item.name) + '" class="h-full w-full object-cover" />' : "") +
                "</div>" +
                '<div class="flex-1">' +
                  '<p dir="auto" class="font-semibold text-foreground">' + esc(item.name) + "</p>" +
                  '<p class="text-sm text-muted-foreground">' + tr("cart.each", { p: money(item.price) }) + "</p>" +
                "</div>" +
                '<div class="flex items-center gap-2">' +
                  '<button data-dec="' + item.medicineId + '" class="h-7 w-7 rounded-md border text-sm font-bold text-foreground hover:bg-muted">−</button>' +
                  '<span class="w-8 text-center text-sm font-semibold">' + item.quantity + "</span>" +
                  '<button data-inc="' + item.medicineId + '" ' + (item.quantity >= item.maxQuantity ? "disabled" : "") + ' class="h-7 w-7 rounded-md border text-sm font-bold text-foreground hover:bg-muted disabled:opacity-40">+</button>' +
                "</div>" +
                '<p class="w-20 text-end font-bold text-foreground">' + (item.price * item.quantity).toFixed(2) + "</p>" +
                '<button data-rm="' + item.medicineId + '" class="text-muted-foreground hover:text-destructive">' + icon("Trash2", "h-4 w-4") + "</button>" +
              "</div>").join("") +
          "</div>" +
          '<div class="mt-6 rounded-2xl border bg-card p-6">' +
            '<label class="mb-1 block text-sm font-medium text-foreground">' + tr("cart.address") + '</label>' +
            '<textarea id="addr" rows="2" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="' + esc(tr("cart.addressPh")) + '">' + esc(address) + "</textarea>" +
            '<div class="mt-4 flex items-center justify-between border-t pt-4">' +
              '<span class="text-lg font-bold text-foreground">' + tr("common.total") + '</span>' +
              '<span class="text-xl font-bold text-primary">' + money(Cart.total) + "</span>" +
            "</div>" +
            (error ? '<p class="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">' + esc(tErr(error)) + "</p>" : "") +
            '<button id="place" ' + (loading ? "disabled" : "") + ' class="mt-4 w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60">' +
              (loading ? tr("cart.placing") : tr("cart.place")) + "</button>" +
          "</div>";
      }
      app.innerHTML =
        '<div id="cart-root" class="min-h-screen bg-background">' +
          appHeader(false) +
          '<main class="mx-auto max-w-3xl px-4 py-8"><h1 class="text-2xl font-bold text-foreground">' + tr("cart.title") + '</h1>' + body + "</main>" +
        "</div>";
      const ta = document.getElementById("addr");
      if (ta) ta.addEventListener("input", (e) => { address = e.target.value; });
      const pb = document.getElementById("place");
      if (pb) pb.addEventListener("click", placeOrder);
    }

    app.addEventListener("click", function onClick(e) {
      if (!ctx.isCurrent()) return app.removeEventListener("click", onClick);
      const t = e.target.closest("[data-inc],[data-dec],[data-rm]");
      if (!t || !app.contains(t)) return;
      const id = Number(t.dataset.inc || t.dataset.dec || t.dataset.rm);
      const item = Cart.items.find((i) => i.medicineId === id);
      if (!item) return;
      if (t.dataset.inc !== undefined) Cart.updateQuantity(id, item.quantity + 1);
      else if (t.dataset.dec !== undefined) Cart.updateQuantity(id, item.quantity - 1);
      else Cart.removeItem(id);
      render();
    });

    ctx.onLang(render);
    app.innerHTML = '<div id="cart-root"></div>';
    render();
  };

  // ---------------- My Orders ----------------
  window.pageOrders = async function (app, ctx) {
    let current = [];
    let loaded = false;
    let cancelling = null;
    let errorMsg = null;
    function render(orders, isLoading) {
      if (!ctx.isCurrent()) return;
      let body;
      if (isLoading) {
        body = '<p class="mt-10 text-center text-muted-foreground">' + tr("orders.loading") + '</p>';
      } else if (!orders || !orders.length) {
        body = '<p class="mt-10 rounded-2xl border bg-card p-10 text-center text-muted-foreground">' + tr("orders.none") + '</p>';
      } else {
        body =
          '<div class="mt-6 space-y-4">' +
          orders.map((order) => {
            return (
              '<div class="rounded-2xl border bg-card p-5">' +
                '<div class="flex flex-wrap items-center justify-between gap-2">' +
                  "<div>" +
                    '<p class="font-bold text-foreground">' + tr("orders.order", { id: order.id }) + "</p>" +
                    '<p class="text-xs text-muted-foreground">' + esc(fmtDate(order.created_at)) + "</p>" +
                  "</div>" +
                  '<span class="rounded-full px-3 py-1 text-xs font-semibold ' + statusClasses(order.status) + '">' +
                    esc(statusText(order.status)) + "</span>" +
                "</div>" +
                '<p dir="auto" class="mt-2 text-sm text-muted-foreground">📍 ' + esc(order.address) + "</p>" +
                '<div class="mt-3 space-y-1 border-t pt-3">' +
                  order.order_items.map((item) =>
                    '<div class="flex justify-between text-sm">' +
                      '<span dir="auto" class="text-foreground">' + esc((item.medicines && item.medicines.name) || item.medicine_name || tr("common.deletedMedicine")) + " × " + item.quantity + "</span>" +
                      '<span class="text-muted-foreground">' + money(Number(item.unit_price) * item.quantity) + "</span>" +
                    "</div>").join("") +
                "</div>" +
                '<div class="mt-3 flex justify-between border-t pt-3 font-bold text-foreground">' +
                  "<span>" + tr("common.total") + "</span>" +
                  '<span class="text-primary">' + money(order.total_price) + "</span>" +
                "</div>" +
                (order.status === 0 || order.status === 1
                  ? '<div class="mt-3 flex justify-end">' +
                      '<button data-cancel="' + order.id + '" ' + (cancelling !== null ? "disabled" : "") + ' class="rounded-lg border border-destructive px-4 py-1.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60">' +
                        (cancelling === order.id ? tr("orders.canceling") : tr("orders.cancel")) + "</button>" +
                    "</div>"
                  : "") +
              "</div>"
            );
          }).join("") + "</div>";
      }
      app.innerHTML =
        '<div class="min-h-screen bg-background">' + appHeader(false) +
        '<main class="mx-auto max-w-3xl px-4 py-8"><h1 class="text-2xl font-bold text-foreground">' + tr("orders.title") + '</h1>' +
        (errorMsg ? '<p class="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">' + esc(tErr(errorMsg)) + "</p>" : "") +
        body + "</main></div>";
    }

    async function load(showLoading) {
      if (showLoading) render(null, true);
      const { data, error } = await db
        .from("orders")
        .select("*, order_items(*, medicines(name, image))")
        .order("created_at", { ascending: false });
      if (error) console.error(error);
      current = data || [];
      loaded = true;
      render(current, false);
    }

    // Cancel an order (Pending / Delivering) — stock is returned by the cancel_my_order() RPC
    app.addEventListener("click", async function onClick(e) {
      if (!ctx.isCurrent()) return app.removeEventListener("click", onClick);
      const b = e.target.closest("[data-cancel]");
      if (!b || !app.contains(b) || cancelling !== null) return;
      const id = Number(b.dataset.cancel);
      if (!confirm(tr("orders.confirmCancel", { id: id }))) return;
      cancelling = id; errorMsg = null; render(current, false);
      const { error } = await db.rpc("cancel_my_order", { _order_id: id });
      cancelling = null;
      if (error) errorMsg = error.message || tr("orders.cancelFailed");
      if (ctx.isCurrent()) await load(false);
    });

    ctx.onLang(() => render(current, !loaded));
    await load(true);
  };

  // ---------------- Help (مساعدة) ----------------
  window.pageHelp = function (app, ctx) {
    const ASSIST_WA_DEFAULT = "201104275696"; // used only until the number stored in the database (site_settings) is loaded
    const tag = "rounded-xl border border-primary/40 bg-background px-4 py-2 text-sm font-medium text-foreground";
    const soon = '<span class="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">' + tr("help.soon") + '</span>';
    const option = (n, title, text, extra, highlight) =>
      '<div class="rounded-2xl border p-4 ' + (highlight ? "border-primary/50 bg-primary/5" : "bg-card") + '">' +
        '<div class="flex items-center gap-3">' +
          '<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">' + n + "</span>" +
          '<h3 class="flex-1 font-bold text-foreground">' + title + "</h3>" +
          (highlight ? "" : soon) +
        "</div>" +
        '<p class="mt-3 text-sm leading-loose text-muted-foreground">' + text + "</p>" +
        (extra || "") +
      "</div>";
    app.innerHTML =
      '<div id="help-root" class="min-h-screen bg-background">' +
        appHeader(false) +
        '<main class="mx-auto max-w-5xl space-y-6 px-4 py-8">' +
          '<div class="rounded-3xl border bg-primary/5 p-6 md:p-10">' +
            '<h1 class="text-2xl font-bold leading-relaxed text-foreground md:text-3xl">' + tr("help.heroA") + '<br />' + tr("help.heroB") + '</h1>' +
            '<div class="mt-6 flex flex-wrap gap-3">' +
              '<a href="#/unavailable" class="rounded-xl border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">1. ' + tr("help.opt1") + '</a>' +
              '<a href="#/cheaper" class="rounded-xl border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">2. ' + tr("help.opt2") + '</a>' +
              '<a data-wa-assist href="https://wa.me/' + ASSIST_WA_DEFAULT + '" target="_blank" rel="noopener noreferrer" class="rounded-xl border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">3. ' + tr("help.opt3") + '</a>' +
            "</div>" +
          "</div>" +
          '<div class="grid gap-6 rounded-3xl border bg-card p-4 shadow-sm md:grid-cols-[300px_1fr] md:p-6">' +
            '<div class="self-start md:sticky md:top-24">' +
              '<img src="img/pharmacist.jpg" width="1000" height="1200" alt="' + esc(tr("help.imgAlt")) + '" loading="lazy" class="mx-auto block h-auto w-full max-w-sm rounded-2xl bg-muted object-contain shadow-sm md:max-w-none" />' +
            "</div>" +
            "<div>" +
              '<h2 class="text-xl font-bold text-foreground">' + tr("help.how") + '</h2>' +
              '<p class="mt-2 text-sm leading-loose text-muted-foreground">' + tr("help.intro") + '</p>' +
              '<div class="mt-5 space-y-3">' +
                option(1, tr("help.opt1"), tr("help.opt1Text"),
                  '<a href="#/unavailable" class="mt-4 inline-block rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">' + tr("help.start") + '</a>', true) +
                option(2, tr("help.opt2"), tr("help.opt2Text"),
                  '<a href="#/cheaper" class="mt-4 inline-block rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">' + tr("help.start") + '</a>', true) +
                option(3, tr("help.opt3"), tr("help.opt3Text"),
                  '<a data-wa-assist href="https://wa.me/' + ASSIST_WA_DEFAULT + '" target="_blank" rel="noopener noreferrer" class="mt-4 inline-block rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">' + tr("help.openWa") + '</a>', true) +
              "</div>" +
            "</div>" +
          "</div>" +
        "</main>" +
      "</div>";

    // The WhatsApp number is stored in the database (table site_settings, key whatsapp_number)
    db.from("site_settings").select("value").eq("key", "whatsapp_number").maybeSingle().then(({ data }) => {
      const digits = data && String(data.value || "").replace(/\D/g, "");
      if (!digits || !ctx.isCurrent()) return;
      app.querySelectorAll("[data-wa-assist]").forEach((a) => { a.href = "https://wa.me/" + digits; });
    });
  };

  // ---------------- Request a medicine that is not available (اطلب دواء غير متوفر) ----------------
  window.pageUnavailable = async function (app, ctx) {
    const norm = (v) => String(v == null ? "" : v).toLowerCase().replace(/\s+/g, " ").trim();
    let medicines = [];
    let loading = true;
    let name = "";
    let sending = false;
    let sent = false;
    let errorMsg = null;

    function resultHtml(typed, exact, similar) {
      if (typed.length < 2) return '<p class="mt-4 text-sm text-muted-foreground">' + tr("unav.typeMore") + '</p>';
      let html = "";
      if (exact && exact.quantity > 0) {
        // exists and in stock -> cannot be requested
        return (
          '<div class="mt-4 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">' +
            '<p class="font-bold">' + tr("unav.inStock") + '</p>' +
            '<p class="mt-1">' + tr("unav.inStockText") + '</p>' +
            '<a href="#/shop?q=' + encodeURIComponent(exact.name) + '" class="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">' + tr("unav.goShop") + '</a>' +
          "</div>"
        );
      }
      html +=
        '<div class="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-foreground">' +
          (exact
            ? '<p class="font-bold">' + tr("unav.zeroStock") + '</p>'
            : '<p class="font-bold">' + tr("unav.notFound") + '</p>') +
          '<p class="mt-1 text-muted-foreground">' + tr("unav.canRequest") + '</p>' +
        "</div>";
      if (similar.length) {
        html +=
          '<div class="mt-3 rounded-xl border bg-card p-4 text-sm">' +
            '<p class="font-medium text-foreground">' + tr("unav.similar") + '</p>' +
            '<div class="mt-2 flex flex-wrap gap-2">' +
              similar.map((m) => '<a href="#/shop?q=' + encodeURIComponent(m.name) + '" dir="auto" class="rounded-full border border-primary/40 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10">' + esc(m.name) + "</a>").join("") +
            "</div>" +
          "</div>";
      }
      html +=
        (errorMsg ? '<p class="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">' + esc(tErr(errorMsg)) + "</p>" : "") +
        '<button type="button" id="send-medreq" ' + (sending ? "disabled" : "") + ' class="mt-4 w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 sm:w-auto sm:px-8">' +
          (sending ? tr("common.sending") : tr("unav.send")) + "</button>";
      return html;
    }

    function render() {
      if (!document.getElementById("unavail-root")) return;
      // keep the cursor in the input while the page re-draws
      const active = document.activeElement;
      const hadFocus = !!active && active.id === "unavail-name";
      const caret = hadFocus ? active.selectionStart : null;
      const typed = name.trim().replace(/\s+/g, " ");
      const exact = medicines.find((m) => norm(m.name) === norm(typed));
      const similar = typed.length < 2 ? [] : medicines
        .filter((m) => m.quantity > 0 && (!exact || m.id !== exact.id) && norm(m.name).includes(norm(typed)))
        .slice(0, 5);
      let body;
      if (sent) {
        body =
          '<div class="mt-6 rounded-2xl border border-success/40 bg-success/10 p-6 text-center">' +
            '<p class="text-3xl">✓</p>' +
            '<p class="mt-2 font-bold text-foreground">' + tr("unav.sent") + '</p>' +
            '<p class="mt-1 text-sm text-muted-foreground">' + tr("unav.sentText") + '</p>' +
            '<div class="mt-4 flex flex-col justify-center gap-2 sm:flex-row">' +
              '<a href="#/notifications" class="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">' + tr("common.goNotifications") + '</a>' +
              '<button type="button" id="another-medreq" class="rounded-lg border border-input bg-background px-5 py-2 text-sm font-medium text-foreground hover:bg-muted">' + tr("common.requestAnother") + '</button>' +
            "</div>" +
          "</div>";
      } else if (loading) {
        body = '<p class="mt-6 text-center text-muted-foreground">' + tr("common.loading") + '</p>';
      } else {
        body =
          '<div class="mt-6 rounded-2xl border bg-card p-5">' +
            '<label class="mb-1 block text-sm font-medium text-foreground">' + tr("unav.name") + '</label>' +
            '<input id="unavail-name" type="text" dir="auto" autocomplete="off" maxlength="120" placeholder="' + esc(tr("unav.namePh")) + '" value="' + esc(name) + '" class="' + INPUT_CLS + '" />' +
            resultHtml(typed, exact, similar) +
          "</div>";
      }
      app.innerHTML =
        '<div id="unavail-root" class="min-h-screen bg-background">' +
          appHeader(false) +
          '<main class="mx-auto max-w-2xl px-4 py-8">' +
            '<a href="#/help" class="text-sm font-medium text-primary hover:underline">' + tr("help.back") + '</a>' +
            '<h1 class="mt-2 text-2xl font-bold text-foreground">' + tr("help.opt1") + '</h1>' +
            '<p class="mt-1 text-sm text-muted-foreground">' + tr("unav.sub") + '</p>' +
            body +
          "</main>" +
        "</div>";
      if (hadFocus) {
        const input = document.getElementById("unavail-name");
        if (input) { input.focus(); input.setSelectionRange(caret, caret); }
      }
    }

    async function sendRequest() {
      if (sending) return;
      sending = true; errorMsg = null; render();
      const { error } = await db.rpc("create_medicine_request", { _name: name.trim().replace(/\s+/g, " ") });
      sending = false;
      if (error) errorMsg = error.message || tr("common.sendFailed");
      else sent = true;
      if (ctx.isCurrent()) render();
    }

    app.addEventListener("input", function onInput(e) {
      if (!ctx.isCurrent()) return app.removeEventListener("input", onInput);
      if (e.target.id !== "unavail-name") return;
      name = e.target.value; errorMsg = null;
      render();
    });

    app.addEventListener("click", function onClick(e) {
      if (!ctx.isCurrent()) return app.removeEventListener("click", onClick);
      if (e.target.closest("#send-medreq")) sendRequest();
      else if (e.target.closest("#another-medreq")) { name = ""; sent = false; errorMsg = null; render(); }
    });

    ctx.onLang(render);
    app.innerHTML = '<div id="unavail-root"></div>';
    render();
    const { data, error } = await db.from("medicines").select("id, name, quantity");
    if (!ctx.isCurrent()) return;
    if (error) console.error(error);
    medicines = data || [];
    loading = false;
    render();
  };

  // ---------------- Order a medicine at a cheaper price (30% off) ----------------
  window.pageCheaper = async function (app, ctx) {
    const DISCOUNT = 30; // percent (the same 30% is applied in the database function)
    const discounted = (price) => Math.round((Math.round(Number(price) * 100) * (100 - DISCOUNT)) / 100) / 100;

    let categories = [];
    let medicines = [];
    let loading = true;
    let selectedCategory = null;
    let search = "";
    let selectedId = null;
    let sending = false;
    let sent = false;
    let errorMsg = null;

    const catBtn = (active, id, label) =>
      '<button type="button" data-medcat="' + id + '" class="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ' +
      (active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-muted-foreground hover:bg-muted") + '">' + label + "</button>";

    function panelHtml(sel) {
      if (sent && sel) {
        return (
          '<div class="rounded-2xl border border-success/40 bg-success/10 p-5 text-center">' +
            '<p class="text-3xl">✓</p>' +
            '<p class="mt-2 font-bold text-foreground">' + tr("ch.sent") + '</p>' +
            '<p class="mt-1 text-sm text-muted-foreground">' + tr("ch.sentText") + '</p>' +
            '<div class="mt-4 flex flex-col gap-2">' +
              '<a href="#/notifications" class="rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">' + tr("common.goNotifications") + '</a>' +
              '<button type="button" id="another" class="rounded-lg border border-input bg-background py-2 text-sm font-medium text-foreground hover:bg-muted">' + tr("common.requestAnother") + '</button>' +
            "</div>" +
          "</div>"
        );
      }
      if (!sel) {
        return '<div class="rounded-2xl border bg-card p-5 text-center text-sm text-muted-foreground">' + tr("ch.pick") + '</div>';
      }
      return (
        '<div class="rounded-2xl border bg-card p-5">' +
          '<h2 dir="auto" class="font-bold text-foreground">' + esc(sel.name) + "</h2>" +
          '<div class="mt-4 space-y-2 text-sm">' +
            '<div class="flex justify-between"><span class="text-muted-foreground">' + tr("ch.original") + '</span><span class="font-medium text-muted-foreground line-through">' + money(sel.price) + "</span></div>" +
            '<div class="flex justify-between"><span class="text-muted-foreground">' + tr("ch.discount") + '</span><span class="font-medium text-success">' + DISCOUNT + "%</span></div>" +
            '<div class="flex justify-between border-t pt-3"><span class="font-bold text-foreground">' + tr("ch.after") + '</span><span class="text-xl font-bold text-primary">' + money(discounted(sel.price)) + "</span></div>" +
          "</div>" +
          (errorMsg ? '<p class="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">' + esc(tErr(errorMsg)) + "</p>" : "") +
          '<button type="button" id="send-request" ' + (sending ? "disabled" : "") + ' class="mt-4 w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60">' +
            (sending ? tr("common.sending") : tr("ch.orderNow")) + "</button>" +
        "</div>"
      );
    }

    function render() {
      if (!document.getElementById("cheaper-root")) return;
      // keep the cursor in the search box while the page re-draws
      const active = document.activeElement;
      const hadFocus = !!active && active.id === "cheaper-search";
      const caret = hadFocus ? active.selectionStart : null;
      const q = search.trim().toLowerCase();
      const shown = medicines.filter((m) =>
        (selectedCategory === null || m.category_id === selectedCategory) &&
        (!q || String(m.name || "").toLowerCase().includes(q)));
      const sel = medicines.find((m) => m.id === selectedId);
      app.innerHTML =
        '<div id="cheaper-root" class="min-h-screen bg-background">' +
          appHeader(false) +
          '<main class="mx-auto max-w-5xl px-4 py-8">' +
            '<a href="#/help" class="text-sm font-medium text-primary hover:underline">' + tr("help.back") + '</a>' +
            '<h1 class="mt-2 text-2xl font-bold text-foreground">' + tr("help.opt2") + '</h1>' +
            '<p class="mt-1 text-sm text-muted-foreground">' + tr("ch.sub", { d: DISCOUNT }) + "</p>" +
            '<input id="cheaper-search" type="search" dir="auto" autocomplete="off" placeholder="' + esc(tr("common.searchByName")) + '" value="' + esc(search) + '" class="mt-4 ' + INPUT_CLS + ' sm:max-w-md" />' +
            '<div class="mt-4 flex flex-wrap gap-2">' +
              catBtn(selectedCategory === null, "all", tr("common.all")) +
              categories.map((c) => catBtn(selectedCategory === c.id, c.id, '<span dir="auto">' + esc(c.name) + "</span>")).join("") +
            "</div>" +
            '<div class="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">' +
              "<div>" +
                (loading
                  ? '<p class="text-center text-muted-foreground">' + tr("common.loading") + '</p>'
                  : shown.length === 0
                    ? '<p class="rounded-2xl border bg-card p-8 text-center text-muted-foreground">' + tr("ch.noMatch") + '</p>'
                    : '<div class="grid gap-3 sm:grid-cols-2">' + shown.map((m) =>
                        '<button type="button" data-pick="' + m.id + '" ' + (m.quantity === 0 ? "disabled" : "") + ' class="flex w-full items-center gap-3 rounded-xl border p-3 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-50 ' +
                          (m.id === selectedId ? "border-primary bg-primary/10 ring-2 ring-primary" : "bg-card hover:bg-muted") + '">' +
                          '<div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">' +
                            (m.image ? '<img src="' + esc(m.image) + '" alt="' + esc(m.name) + '" class="h-full w-full object-cover" loading="lazy" />' : icon("Package", "h-6 w-6 text-muted-foreground")) +
                          "</div>" +
                          '<div class="min-w-0 flex-1">' +
                            '<p dir="auto" class="truncate font-semibold text-foreground">' + esc(m.name) + "</p>" +
                            '<p class="text-sm text-muted-foreground">' + money(m.price) + "</p>" +
                          "</div>" +
                          '<span class="text-xs font-medium ' + (m.quantity > 0 ? "text-success" : "text-destructive") + '">' + (m.quantity > 0 ? tr("ch.available") : tr("ch.unavailable")) + "</span>" +
                        "</button>").join("") + "</div>") +
              "</div>" +
              '<div class="lg:sticky lg:top-24 lg:self-start">' + panelHtml(sel) + "</div>" +
            "</div>" +
          "</main>" +
        "</div>";
      if (hadFocus) {
        const input = document.getElementById("cheaper-search");
        if (input) { input.focus(); input.setSelectionRange(caret, caret); }
      }
    }

    async function sendRequest() {
      if (sending || selectedId === null) return;
      sending = true; errorMsg = null; render();
      const { error } = await db.rpc("create_discount_request", { _medicine_id: selectedId });
      sending = false;
      if (error) errorMsg = error.message || tr("common.sendFailed");
      else sent = true;
      if (ctx.isCurrent()) render();
    }

    app.addEventListener("input", function onInput(e) {
      if (!ctx.isCurrent()) return app.removeEventListener("input", onInput);
      if (e.target.id !== "cheaper-search") return;
      search = e.target.value;
      render();
    });

    app.addEventListener("click", function onClick(e) {
      if (!ctx.isCurrent()) return app.removeEventListener("click", onClick);
      const pick = e.target.closest("[data-pick]");
      const cat = e.target.closest("[data-medcat]");
      if (pick && app.contains(pick)) {
        selectedId = Number(pick.dataset.pick); sent = false; errorMsg = null; render();
      } else if (cat && app.contains(cat)) {
        selectedCategory = cat.dataset.medcat === "all" ? null : Number(cat.dataset.medcat); render();
      } else if (e.target.closest("#send-request")) {
        sendRequest();
      } else if (e.target.closest("#another")) {
        selectedId = null; sent = false; errorMsg = null; render();
      }
    });

    ctx.onLang(render);
    app.innerHTML = '<div id="cheaper-root"></div>';
    render();
    const [c, m] = await Promise.all([
      db.from("categories").select("*").order("id"),
      db.from("medicines").select("*").order("name"),
    ]);
    if (!ctx.isCurrent()) return;
    if (c.error) console.error(c.error);
    if (m.error) console.error(m.error);
    categories = c.data || [];
    medicines = m.data || [];
    loading = false;
    render();
  };

  // ---------------- Notifications (Normal User) ----------------
  window.pageNotifications = async function (app, ctx) {
    const MAX_DISCOUNT_QTY = 5; // max units per discounted order (the same limit is enforced in the database function)
    let items = null; // null = loading
    const addresses = {};
    const quantities = {};
    const errors = {};
    let busy = null;

    // The most he can order = the smaller of: 5 units, and the stock available right now
    const maxQty = (r) => Math.min(MAX_DISCOUNT_QTY, r.medicines ? Number(r.medicines.quantity) : 0);
    const qtyFor = (r) => Math.max(1, Math.min(quantities[r.id] || 1, maxQty(r)));
    const lineTotal = (r, qty) => Math.round(Number(r.discounted_price) * 100) * qty / 100;

    // Notification text in the current language (the database saves it in Arabic; we rebuild it from the
    // notification type + medicine name + prices, and fall back to the saved text if something is missing)
    function notifText(n) {
      const r = n.discount_requests;
      const quoted = String(n.message || "").match(/"([^"]+)"/);
      const raw = (r && r.medicine_name) || n.medicine_name || (quoted && quoted[1]);
      const name = raw ? "\u2068" + raw + "\u2069" : raw; // keep an Arabic name inside an English sentence (or the reverse) in the right order
      if (n.type === "discount_approved" && r) {
        return { title: tr("notif.approvedTitle"), message: tr("notif.approvedMsg", { name: name, new: money(r.discounted_price), old: money(r.original_price) }) };
      }
      if (n.type === "discount_rejected" && name) {
        return { title: tr("notif.rejectedTitle"), message: tr("notif.rejectedMsg", { name: name }) };
      }
      if (n.type === "medicine_available" && name) {
        return { title: tr("notif.availableTitle"), message: tr("notif.availableMsg", { name: name }) };
      }
      return { title: n.title, message: n.message };
    }

    function actionHtml(n) {
      if (n.type === "medicine_available") {
        return '<a href="#/shop?q=' + encodeURIComponent(n.medicine_name || "") + '" class="mt-4 inline-block rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">' + tr("notif.shopNow") + '</a>';
      }
      const r = n.discount_requests;
      if (n.type !== "discount_approved" || !r) return "";
      if (r.status === "ordered") {
        return (
          '<div class="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm">' +
            '<span class="font-medium text-success">' + tr("notif.ordered") + '</span>' +
            '<a href="#/orders" class="font-semibold text-primary hover:underline">' + tr("notif.viewOrders") + '</a>' +
          "</div>"
        );
      }
      if (r.status !== "approved") return "";
      const max = maxQty(r);
      if (max < 1) {
        return '<div class="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">' + tr("notif.unavailable") + '</div>';
      }
      const qty = qtyFor(r);
      return (
        '<div class="mt-4 rounded-xl border bg-background p-4">' +
          '<div class="mb-3 flex justify-between text-sm"><span class="text-muted-foreground">' + tr("notif.unitPrice") + '</span>' +
            '<span class="font-bold text-primary">' + money(r.discounted_price) + ' <span class="font-normal text-muted-foreground line-through">' + money(r.original_price) + "</span></span></div>" +
          '<div class="mb-1 flex items-center justify-between">' +
            '<span class="text-sm font-medium text-foreground">' + tr("notif.qty") + '</span>' +
            '<div class="flex items-center gap-2">' +
              '<button type="button" data-qty-dec="' + r.id + '" ' + (qty <= 1 || busy !== null ? "disabled" : "") + ' class="h-8 w-8 rounded-md border text-lg font-bold text-foreground hover:bg-muted disabled:opacity-40" aria-label="' + tr("common.decrease") + '">−</button>' +
              '<span class="w-8 text-center text-sm font-bold text-foreground">' + qty + "</span>" +
              '<button type="button" data-qty-inc="' + r.id + '" ' + (qty >= max || busy !== null ? "disabled" : "") + ' class="h-8 w-8 rounded-md border text-lg font-bold text-foreground hover:bg-muted disabled:opacity-40" aria-label="' + tr("common.increase") + '">+</button>' +
            "</div>" +
          "</div>" +
          '<p class="mb-3 text-xs text-muted-foreground">' + tr("notif.maxNote", { max: max, limit: MAX_DISCOUNT_QTY }) + "</p>" +
          '<label class="mb-1 block text-sm font-medium text-foreground">' + tr("cart.address") + '</label>' +
          '<textarea data-addr="' + r.id + '" rows="2" dir="auto" class="' + INPUT_CLS + '" placeholder="' + esc(tr("cart.addressPh")) + '">' + esc(addresses[r.id] || "") + "</textarea>" +
          (errors[r.id] ? '<p class="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">' + esc(tErr(errors[r.id])) + "</p>" : "") +
          '<button type="button" data-order-req="' + r.id + '" ' + (busy !== null ? "disabled" : "") + ' class="mt-3 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60">' +
            (busy === r.id ? tr("notif.placing") : tr("notif.orderBtn", { total: money(lineTotal(r, qty)) })) + "</button>" +
        "</div>"
      );
    }

    function render() {
      if (!ctx.isCurrent()) return;
      let body;
      if (items === null) {
        body = '<p class="mt-10 text-center text-muted-foreground">' + tr("common.loading") + '</p>';
      } else if (items.length === 0) {
        body = '<p class="mt-10 rounded-2xl border bg-card p-10 text-center text-muted-foreground">' + tr("notif.none") + '</p>';
      } else {
        body =
          '<div class="mt-6 space-y-4">' +
          items.map((n) =>
            '<div class="rounded-2xl border p-5 ' + (n.wasUnread ? "border-primary/50 bg-primary/5" : "bg-card") + '">' +
              '<div class="flex items-start justify-between gap-3">' +
                '<h2 class="font-bold text-foreground">' + esc(notifText(n).title) + "</h2>" +
                (n.wasUnread ? '<span class="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">' + tr("notif.new") + '</span>' : "") +
              "</div>" +
              '<p class="mt-2 text-sm leading-relaxed text-foreground">' + esc(notifText(n).message) + "</p>" +
              '<p class="mt-2 text-xs text-muted-foreground">' + esc(fmtDate(n.created_at)) + "</p>" +
              actionHtml(n) +
            "</div>").join("") +
          "</div>";
      }
      app.innerHTML =
        '<div id="notif-root" class="min-h-screen bg-background">' +
          appHeader(false) +
          '<main class="mx-auto max-w-3xl px-4 py-8"><h1 class="text-2xl font-bold text-foreground">' + tr("notif.title") + "</h1>" + body + "</main>" +
        "</div>";
    }

    async function load() {
      const { data, error } = await db
        .from("notifications")
        .select("*, discount_requests(id, status, medicine_id, medicine_name, original_price, discounted_price, medicines(quantity))")
        .order("created_at", { ascending: false });
      if (error) console.error(error);
      if (!ctx.isCurrent()) return;
      const wasNew = new Set((items || []).filter((x) => x.wasUnread).map((x) => x.id));
      items = (data || []).map((n) => Object.assign({}, n, { wasUnread: !n.is_read || wasNew.has(n.id) }));
      render();
    }

    app.addEventListener("input", function onInput(e) {
      if (!ctx.isCurrent()) return app.removeEventListener("input", onInput);
      if (e.target.dataset && e.target.dataset.addr !== undefined) addresses[e.target.dataset.addr] = e.target.value;
    });

    app.addEventListener("click", async function onClick(e) {
      if (!ctx.isCurrent()) return app.removeEventListener("click", onClick);
      const stepper = e.target.closest("[data-qty-dec],[data-qty-inc]");
      if (stepper && app.contains(stepper) && busy === null) {
        const sid = Number(stepper.dataset.qtyDec || stepper.dataset.qtyInc);
        const sn = (items || []).find((x) => x.discount_requests && x.discount_requests.id === sid);
        if (sn) {
          quantities[sid] = qtyFor(sn.discount_requests) + (stepper.dataset.qtyInc !== undefined ? 1 : -1);
          quantities[sid] = qtyFor(sn.discount_requests); // keep it between 1 and the maximum
          render();
        }
        return;
      }
      const b = e.target.closest("[data-order-req]");
      if (!b || !app.contains(b) || busy !== null) return;
      const id = Number(b.dataset.orderReq);
      const address = (addresses[id] || "").trim();
      const note = (items || []).find((x) => x.discount_requests && x.discount_requests.id === id);
      const qty = note ? qtyFor(note.discount_requests) : 1;
      errors[id] = null;
      if (!address) { errors[id] = tr("err.needAddress"); render(); return; }
      busy = id; render();
      const { error } = await db.rpc("place_discount_order", { _request_id: id, _address: address, _quantity: qty });
      busy = null;
      if (error) {
        errors[id] = error.message || tr("common.sendFailed");
        await load();
        return;
      }
      navigate("/orders");
    });

    ctx.onLang(render);
    render();
    await load();
    // everything shown is now read -> clear the red badge in the header
    await db.rpc("mark_notifications_read");
    window.loadUnreadNotifications();
  };
})();
