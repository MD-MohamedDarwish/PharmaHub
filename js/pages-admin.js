// Admin dashboard: Orders, Medicines, Categories, Users.
(function () {
  window.pageAdmin = async function (app, ctx) {
    app.innerHTML = '<p class="flex min-h-screen items-center justify-center text-muted-foreground">' + tr("common.loading") + '</p>';

    // useIsAdmin
    const { data: userData } = await db.auth.getUser();
    let isAdmin = false;
    if (userData.user) {
      const { data, error } = await db.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin");
      if (error) console.error(error);
      isAdmin = ((data && data.length) || 0) > 0;
    }
    if (!ctx.isCurrent()) return;
    if (!isAdmin) { navigate("/shop", true); return; }

    let tab = "orders";
    const TABS = ["orders", "medicines", "categories", "users", "requests", "discounts", "medreqs", "assist"].map((k) => [k, "admin.tab." + k]);

    function renderShell() {
      app.innerHTML =
        '<div class="min-h-screen bg-background">' + appHeader(true) +
          '<main class="mx-auto max-w-6xl px-4 py-8">' +
            '<h1 class="text-2xl font-bold text-foreground">' + tr("admin.title") + '</h1>' +
            '<div class="mt-5 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">' +
              TABS.map(([t, label]) =>
                '<button data-tab="' + t + '" class="flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors ' +
                (tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground") + '">' + tr(label) + "</button>").join("") +
            "</div>" +
            '<div id="tab-body" class="mt-6"></div>' +
          "</main>" +
        "</div>";
      app.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; renderShell(); }));
      const el = document.getElementById("tab-body");
      const fn = { orders: ordersTab, medicines: medicinesTab, categories: categoriesTab, users: usersTab, requests: requestsTab, discounts: discountsTab, medreqs: medicineRequestsTab, assist: assistanceTab }[tab];
      fn(el, () => ctx.isCurrent() && document.getElementById("tab-body") === el);
      updateRequestsBadge();
      updateDiscountsBadge();
      updateMedReqBadge();
    }
    ctx.onLang(renderShell);
    renderShell();
  };

  /* ---------------- Orders ---------------- */
  async function ordersTab(el, alive) {
    el.innerHTML = '<p class="text-muted-foreground">' + tr("orders.loading") + '</p>';

    let contacts = {};
    async function load() {
      const [{ data, error }, { data: people, error: peopleError }] = await Promise.all([
        db.from("orders").select("*, order_items(*, medicines(name))").order("created_at", { ascending: false }),
        db.rpc("admin_user_contacts"),
      ]);
      if (error) console.error(error);
      if (peopleError) console.error(peopleError);
      contacts = {};
      (people || []).forEach((c) => { contacts[c.user_id] = c; });
      if (!alive()) return;
      render(data || []);
    }

    function customerHtml(order) {
      const c = contacts[order.user_id] || {};
      const field = (label, value, dir) =>
        '<div><span class="text-muted-foreground">' + label + ': </span><span ' + (dir ? 'dir="' + dir + '" ' : "") + 'class="font-medium text-foreground">' + (value ? esc(value) : "—") + "</span></div>";
      return (
        '<div class="mt-3 flex flex-wrap gap-x-8 gap-y-1 border-t pt-3 text-sm">' +
          field(tr("admin.customer"), c.name, "auto") +
          field(tr("admin.phone"), c.phone, "ltr") +
          field(tr("admin.email"), c.email, "ltr") +
          field(tr("admin.address"), order.address, "auto") +
        "</div>"
      );
    }

    function render(orders) {
      if (!orders.length) { el.innerHTML = '<p class="text-muted-foreground">' + tr("admin.noOrders") + '</p>'; return; }
      el.innerHTML =
        '<div class="space-y-4">' +
        orders.map((order) =>
          '<div class="rounded-2xl border bg-card p-5">' +
            '<div class="flex flex-wrap items-center justify-between gap-3">' +
              "<div>" +
                '<p class="font-bold text-foreground">' + tr("orders.order", { id: order.id }) + "</p>" +
                '<p class="text-xs text-muted-foreground">' + esc(fmtDate(order.created_at)) + "</p>" +
              "</div>" +
              '<div class="flex items-center gap-3">' +
                '<span class="rounded-full px-3 py-1 text-xs font-semibold ' + statusClasses(order.status) + '">' + esc(statusText(order.status)) + "</span>" +
                '<select data-order="' + order.id + '" ' + (order.status === 4 ? 'disabled title="' + esc(tr("admin.canceledLocked")) + '"' : "") + ' class="rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60">' +
                  ORDER_STATUSES.map((s) => '<option value="' + s.value + '"' + (s.value === order.status ? " selected" : "") + ">" + esc(statusText(s.value)) + "</option>").join("") +
                "</select>" +
              "</div>" +
            "</div>" +
            customerHtml(order) +
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
          "</div>").join("") +
        "</div>";
      el.querySelectorAll("[data-order]").forEach((sel) => sel.addEventListener("change", async () => {
        const { error } = await db.from("orders").update({ status: Number(sel.value) }).eq("id", Number(sel.dataset.order));
        if (error) alert(tErr(error.message));
        load();
      }));
    }
    load();
  }

  /* ---------------- Medicines ---------------- */
  async function medicinesTab(el, alive) {
    const empty = { name: "", description: "", price: "", quantity: "", image: "", category_id: "" };
    let form = Object.assign({}, empty);
    let editingId = null;
    let categories = [];
    let medicines = [];
    let search = "";
    let selectedCategory = null;

    const catBtn = (active, id, label) =>
      '<button type="button" data-medcat="' + id + '" class="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ' +
      (active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-muted-foreground hover:bg-muted") + '">' + label + "</button>";

    async function load() {
      const [c, m] = await Promise.all([
        db.from("categories").select("*").order("id"),
        db.from("medicines").select("*, categories(name)").order("id"),
      ]);
      if (!alive()) return;
      categories = c.data || [];
      medicines = m.data || [];
      render();
    }

    function render() {
      const f = form;
      // keep the cursor in the search box while the tab re-draws
      const active = document.activeElement;
      const hadFocus = !!active && active.id === "med-search";
      const caret = hadFocus ? active.selectionStart : null;
      const q = search.trim().toLowerCase();
      const shown = medicines.filter((m) =>
        (selectedCategory === null || m.category_id === selectedCategory) &&
        (!q || String(m.name || "").toLowerCase().includes(q)));
      el.innerHTML =
        '<div class="grid gap-6 lg:grid-cols-[1fr_320px]">' +
          '<div class="min-w-0">' +
          '<input id="med-search" type="search" dir="auto" autocomplete="off" placeholder="' + esc(tr("common.searchByName")) + '" value="' + esc(search) + '" class="' + INPUT_CLS + ' sm:max-w-md" />' +
          '<div class="mt-4 flex flex-wrap gap-2">' +
            catBtn(selectedCategory === null, "all", tr("common.all")) +
            categories.map((c) => catBtn(selectedCategory === c.id, c.id, '<span dir="auto">' + esc(c.name) + "</span>")).join("") +
          "</div>" +
          '<div class="mt-4 overflow-x-auto rounded-2xl border bg-card">' +
            '<table class="w-full text-sm"><thead><tr class="border-b text-left rtl:text-right text-muted-foreground">' +
              '<th class="p-3">' + tr("admin.name") + '</th><th class="p-3">' + tr("admin.category") + '</th><th class="p-3">' + tr("admin.price") + '</th><th class="p-3">' + tr("admin.stock") + '</th><th class="p-3"></th>' +
            "</tr></thead><tbody>" +
            (shown.length === 0 ? '<tr><td colspan="5" class="p-6 text-center text-muted-foreground">' + tr("common.noMedicines") + '</td></tr>' : "") +
            shown.map((m) =>
              '<tr class="border-b last:border-0">' +
                '<td dir="auto" class="p-3 font-medium text-foreground">' + esc(m.name) + "</td>" +
                '<td dir="auto" class="p-3 text-muted-foreground">' + esc(m.categories && m.categories.name) + "</td>" +
                '<td class="p-3 text-foreground">' + Number(m.price).toFixed(2) + "</td>" +
                '<td class="p-3 font-semibold ' + (m.quantity === 0 ? "text-destructive" : "text-foreground") + '">' + m.quantity + "</td>" +
                '<td class="p-3"><div class="flex gap-2">' +
                  '<button data-edit="' + m.id + '" class="text-muted-foreground hover:text-primary">' + icon("Pencil", "h-4 w-4") + "</button>" +
                  '<button data-del="' + m.id + '" class="text-muted-foreground hover:text-destructive">' + icon("Trash2", "h-4 w-4") + "</button>" +
                "</div></td>" +
              "</tr>").join("") +
            "</tbody></table>" +
          "</div>" +
          "</div>" +
          '<form id="med-form" class="h-fit space-y-3 rounded-2xl border bg-card p-5">' +
            '<h3 class="font-bold text-foreground">' + (editingId ? tr("admin.editMed") : tr("admin.addMed")) + "</h3>" +
            '<input dir="auto" data-f="name" class="' + INPUT_CLS + '" placeholder="' + esc(tr("admin.name")) + '" value="' + esc(f.name) + '" required />' +
            '<textarea dir="auto" data-f="description" class="' + INPUT_CLS + '" placeholder="' + esc(tr("admin.description")) + '" rows="2">' + esc(f.description) + "</textarea>" +
            '<select data-f="category_id" class="' + INPUT_CLS + '" required>' +
              '<option value="">' + tr("admin.selectCat") + '</option>' +
              categories.map((c) => '<option value="' + c.id + '" dir="auto"' + (String(c.id) === String(f.category_id) ? " selected" : "") + ">" + esc(c.name) + "</option>").join("") +
            "</select>" +
            '<div class="grid grid-cols-2 gap-2">' +
              '<input data-f="price" class="' + INPUT_CLS + '" type="number" step="0.01" min="0" placeholder="' + esc(tr("admin.price")) + '" value="' + esc(f.price) + '" required />' +
              '<input data-f="quantity" class="' + INPUT_CLS + '" type="number" min="0" placeholder="' + esc(tr("admin.stock")) + '" value="' + esc(f.quantity) + '" required />' +
            "</div>" +
            '<input data-f="image" class="' + INPUT_CLS + '" placeholder="' + esc(tr("admin.imageUrl")) + '" value="' + esc(f.image) + '" />' +
            '<button type="submit" class="flex w-full items-center justify-center gap-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">' +
              icon("Plus", "h-4 w-4") + (editingId ? tr("admin.save") : tr("admin.addMed")) + "</button>" +
            (editingId ? '<button type="button" id="cancel-edit" class="w-full text-sm text-muted-foreground hover:underline">' + tr("admin.cancelEdit") + '</button>' : "") +
          "</form>" +
        "</div>";

      if (hadFocus) {
        const input = document.getElementById("med-search");
        if (input) { input.focus(); input.setSelectionRange(caret, caret); }
      }
      document.getElementById("med-search").addEventListener("input", (e) => { search = e.target.value; render(); });
      el.querySelectorAll("[data-medcat]").forEach((b) => b.addEventListener("click", () => {
        selectedCategory = b.dataset.medcat === "all" ? null : Number(b.dataset.medcat);
        render();
      }));
      el.querySelectorAll("[data-f]").forEach((i) => i.addEventListener("input", (e) => { form[i.dataset.f] = e.target.value; }));
      el.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => {
        const m = medicines.find((x) => x.id === Number(b.dataset.edit));
        editingId = m.id;
        form = {
          name: m.name, description: m.description || "", price: String(m.price),
          quantity: String(m.quantity), image: m.image || "", category_id: String(m.category_id),
        };
        render();
        const formEl = document.getElementById("med-form");
        formEl.style.scrollMarginTop = "90px"; // keep it below the sticky header
        formEl.scrollIntoView({ behavior: "smooth", block: "start" });
        const nameInput = formEl.querySelector('[data-f="name"]');
        if (nameInput) nameInput.focus({ preventScroll: true });
      }));
      el.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", async () => {
        if (!confirm(tr("admin.confirmDelMed"))) return;
        const { error } = await db.from("medicines").delete().eq("id", Number(b.dataset.del));
        if (error) alert(tErr(error.message));
        load();
      }));
      const cancel = document.getElementById("cancel-edit");
      if (cancel) cancel.addEventListener("click", () => { editingId = null; form = Object.assign({}, empty); render(); });
      document.getElementById("med-form").addEventListener("submit", save);
    }

    async function save(e) {
      e.preventDefault();
      const payload = {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        quantity: Number(form.quantity),
        image: form.image || null,
        category_id: Number(form.category_id),
      };
      const { error } = editingId
        ? await db.from("medicines").update(payload).eq("id", editingId)
        : await db.from("medicines").insert(payload);
      if (!error) {
        form = Object.assign({}, empty);
        editingId = null;
        load();
      }
    }

    load();
  }

  /* ---------------- Categories ---------------- */
  async function categoriesTab(el, alive) {
    let categories = [];
    let name = "";

    async function load() {
      const { data, error } = await db.from("categories").select("*, medicines(count)").order("id");
      if (error) console.error(error);
      if (!alive()) return;
      categories = data || [];
      render();
    }

    function render() {
      el.innerHTML =
        '<div class="max-w-lg">' +
          '<form id="cat-form" class="flex gap-2">' +
            '<input id="cat-name" dir="auto" class="' + INPUT_CLS + '" placeholder="' + esc(tr("admin.newCat")) + '" value="' + esc(name) + '" />' +
            '<button type="submit" class="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">' + icon("Plus", "h-4 w-4") + " " + tr("admin.add") + "</button>" +
          "</form>" +
          '<div class="mt-4 space-y-2">' +
            categories.map((c) =>
              '<div class="flex items-center justify-between rounded-xl border bg-card px-4 py-3">' +
                '<span dir="auto" class="font-medium text-foreground">' + esc(c.name) + "</span>" +
                '<button data-del="' + c.id + '" class="text-muted-foreground hover:text-destructive">' + icon("Trash2", "h-4 w-4") + "</button>" +
              "</div>").join("") +
          "</div>" +
        "</div>";
      document.getElementById("cat-name").addEventListener("input", (e) => { name = e.target.value; });
      document.getElementById("cat-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        const { error } = await db.from("categories").insert({ name: name.trim() });
        if (!error) { name = ""; load(); }
      });
      el.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", async () => {
        if (!confirm(tr("admin.confirmDelCat"))) return;
        await db.from("categories").delete().eq("id", Number(b.dataset.del));
        load();
      }));
    }
    load();
  }

  /* ---------------- Users ---------------- */
  async function usersTab(el, alive) {
    async function load() {
      const { data: profiles, error } = await db.from("profiles").select("*").order("created_at");
      if (error) console.error(error);
      const { data: roles } = await db.from("user_roles").select("user_id, role");
      const { data: main } = await db.from("primary_admin").select("user_id");
      if (!alive()) return;
      const users = (profiles || []).map((p) =>
        Object.assign({}, p, {
          isAdmin: (roles && roles.some((r) => r.user_id === p.user_id && r.role === "admin")) || false,
          isMain: (main && main.some((m) => m.user_id === p.user_id)) || false,
        }));
      render(users);
    }

    function render(users) {
      el.innerHTML =
        '<div class="overflow-x-auto rounded-2xl border bg-card">' +
          '<table class="w-full text-sm"><thead><tr class="border-b text-left rtl:text-right text-muted-foreground">' +
            '<th class="p-3">' + tr("admin.name") + '</th><th class="p-3">' + tr("admin.phone") + '</th><th class="p-3">' + tr("admin.joined") + '</th><th class="p-3">' + tr("admin.role") + '</th><th class="p-3"></th>' +
          "</tr></thead><tbody>" +
          users.map((u) =>
            '<tr class="border-b last:border-0">' +
              '<td dir="auto" class="p-3 font-medium text-foreground">' + esc(u.name) + "</td>" +
              '<td class="p-3 text-muted-foreground">' + (u.phone == null ? "—" : esc(u.phone)) + "</td>" +
              '<td class="p-3 text-muted-foreground">' + esc(fmtDay(u.created_at)) + "</td>" +
              '<td class="p-3"><span class="rounded-full px-2.5 py-0.5 text-xs font-semibold ' + (u.isAdmin ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground") + '">' + (u.isAdmin ? tr("role.admin") : tr("role.user")) + "</span></td>" +
              '<td class="p-3">' + (u.isMain
                ? '<span class="text-xs font-semibold text-muted-foreground">' + tr("admin.mainAdmin") + '</span>'
                : '<button data-toggle="' + esc(u.user_id) + '" data-make="' + (u.isAdmin ? "0" : "1") + '" class="text-xs font-semibold text-primary hover:underline">' + (u.isAdmin ? tr("admin.removeAdmin") : tr("admin.makeAdmin")) + "</button>") + "</td>" +
            "</tr>").join("") +
          "</tbody></table>" +
        "</div>";
      el.querySelectorAll("[data-toggle]").forEach((b) => b.addEventListener("click", async () => {
        const userId = b.dataset.toggle;
        if (b.dataset.make !== "1") {
          const { data: me } = await db.auth.getUser();
          if (me && me.user && me.user.id === userId) { alert(tr("admin.cantRemoveSelf")); return; }
        }
        if (b.dataset.make === "1") await db.from("user_roles").insert({ user_id: userId, role: "admin" });
        else {
          const { error } = await db.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
          if (error) alert(tErr(error.message));
        }
        load();
      }));
    }
    load();
  }

  /* ---------------- Admin requests ---------------- */
  async function updateRequestsBadge() {
    const { count } = await db.from("admin_requests").select("id", { count: "exact", head: true }).eq("status", "pending");
    const b = document.querySelector('[data-tab="requests"]');
    if (b) b.textContent = tr("admin.tab.requests") + (count > 0 ? " (" + count + ")" : "");
  }

  async function requestsTab(el, alive) {
    el.innerHTML = '<p class="text-muted-foreground">' + tr("admin.loadingReqs") + '</p>';
    const STATUS = {
      pending: [tr("admin.st.pending"), "bg-warning/15 text-warning-foreground"],
      approved: [tr("admin.st.accepted"), "bg-success/15 text-success"],
      rejected: [tr("admin.st.refused"), "bg-destructive/10 text-destructive"],
    };

    async function load() {
      const [{ data: reqs, error }, { data: people }] = await Promise.all([
        db.from("admin_requests").select("*").order("created_at", { ascending: false }),
        db.rpc("admin_user_contacts"),
      ]);
      if (error) console.error(error);
      if (!alive()) return;
      const byId = {};
      (people || []).forEach((c) => { byId[c.user_id] = c; });
      const list = (reqs || []).slice().sort((a, b) => (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1));
      render(list, byId);
    }

    function render(list, byId) {
      if (!list.length) { el.innerHTML = '<p class="rounded-2xl border bg-card p-10 text-center text-muted-foreground">' + tr("admin.noAdminReqs") + '</p>'; return; }
      el.innerHTML =
        '<div class="overflow-x-auto rounded-2xl border bg-card">' +
          '<table class="w-full text-sm"><thead><tr class="border-b text-left rtl:text-right text-muted-foreground">' +
            '<th class="p-3">' + tr("admin.name") + '</th><th class="p-3">' + tr("admin.email") + '</th><th class="p-3">' + tr("admin.phone") + '</th><th class="p-3">' + tr("admin.requested") + '</th><th class="p-3">' + tr("admin.status") + '</th><th class="p-3"></th>' +
          "</tr></thead><tbody>" +
          list.map((r) => {
            const c = byId[r.user_id] || {};
            const st = STATUS[r.status] || STATUS.pending;
            return (
              '<tr class="border-b last:border-0">' +
                '<td dir="auto" class="p-3 font-medium text-foreground">' + (c.name ? esc(c.name) : "—") + "</td>" +
                '<td dir="ltr" class="p-3 text-muted-foreground">' + (c.email ? esc(c.email) : "—") + "</td>" +
                '<td dir="ltr" class="p-3 text-muted-foreground">' + (c.phone ? esc(c.phone) : "—") + "</td>" +
                '<td class="p-3 text-muted-foreground">' + esc(fmtDate(r.created_at)) + "</td>" +
                '<td class="p-3"><span class="rounded-full px-2.5 py-0.5 text-xs font-semibold ' + st[1] + '">' + st[0] + "</span></td>" +
                '<td class="p-3">' + (r.status === "pending"
                  ? '<div class="flex gap-2">' +
                      '<button data-accept="' + r.id + '" class="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90">' + tr("admin.accept") + '</button>' +
                      '<button data-refuse="' + r.id + '" class="rounded-lg border border-destructive px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10">' + tr("admin.ignore") + '</button>' +
                    "</div>"
                  : "") + "</td>" +
              "</tr>"
            );
          }).join("") +
          "</tbody></table>" +
        "</div>";
      el.querySelectorAll("[data-accept],[data-refuse]").forEach((b) => b.addEventListener("click", async () => {
        const approve = b.dataset.accept !== undefined;
        const id = Number(b.dataset.accept || b.dataset.refuse);
        el.querySelectorAll("button").forEach((x) => { x.disabled = true; });
        const { error } = await db.rpc("decide_admin_request", { _request_id: id, _approve: approve });
        if (error) alert(tErr(error.message));
        await load();
        updateRequestsBadge();
      }));
    }
    load();
  }

  /* ---------------- Discount requests (طلبات دواء بسعر أرخص) ---------------- */
  async function updateDiscountsBadge() {
    const { count } = await db.from("discount_requests").select("id", { count: "exact", head: true }).eq("status", "pending");
    const b = document.querySelector('[data-tab="discounts"]');
    if (b) b.textContent = tr("admin.tab.discounts") + (count > 0 ? " (" + count + ")" : "");
  }

  async function discountsTab(el, alive) {
    el.innerHTML = '<p class="text-muted-foreground">' + tr("admin.loadingReqs") + '</p>';
    const STATUS = {
      pending: [tr("admin.st.pending"), "bg-warning/15 text-warning-foreground"],
      approved: [tr("admin.st.accepted"), "bg-success/15 text-success"],
      rejected: [tr("admin.st.refused"), "bg-destructive/10 text-destructive"],
      ordered: [tr("admin.st.ordered"), "bg-primary/10 text-primary"],
    };

    async function load() {
      const [{ data: reqs, error }, { data: people }] = await Promise.all([
        db.from("discount_requests").select("*").order("created_at", { ascending: false }),
        db.rpc("admin_user_contacts"),
      ]);
      if (error) console.error(error);
      if (!alive()) return;
      const byId = {};
      (people || []).forEach((c) => { byId[c.user_id] = c; });
      const list = (reqs || []).slice().sort((a, b) => (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1));
      render(list, byId);
    }

    function render(list, byId) {
      if (!list.length) { el.innerHTML = '<p class="rounded-2xl border bg-card p-10 text-center text-muted-foreground">' + tr("admin.noDiscounts") + '</p>'; return; }
      el.innerHTML =
        '<div class="overflow-x-auto rounded-2xl border bg-card">' +
          '<table class="w-full text-sm"><thead><tr class="border-b text-left rtl:text-right text-muted-foreground">' +
            '<th class="p-3">' + tr("admin.customer") + '</th><th class="p-3">' + tr("admin.phone") + '</th><th class="p-3">' + tr("admin.email") + '</th><th class="p-3">' + tr("admin.medicine") + '</th>' +
            '<th class="p-3">' + tr("admin.original") + '</th><th class="p-3">' + tr("admin.after30") + '</th><th class="p-3">' + tr("admin.requested") + '</th><th class="p-3">' + tr("admin.status") + '</th><th class="p-3"></th>' +
          "</tr></thead><tbody>" +
          list.map((r) => {
            const c = byId[r.user_id] || {};
            const st = STATUS[r.status] || STATUS.pending;
            return (
              '<tr class="border-b last:border-0">' +
                '<td dir="auto" class="p-3 font-medium text-foreground">' + (c.name ? esc(c.name) : "—") + "</td>" +
                '<td dir="ltr" class="p-3 text-muted-foreground">' + (c.phone ? esc(c.phone) : "—") + "</td>" +
                '<td dir="ltr" class="p-3 text-muted-foreground">' + (c.email ? esc(c.email) : "—") + "</td>" +
                '<td dir="auto" class="p-3 text-foreground">' + esc(r.medicine_name) + "</td>" +
                '<td class="p-3 text-muted-foreground line-through">' + Number(r.original_price).toFixed(2) + "</td>" +
                '<td class="p-3 font-bold text-primary">' + Number(r.discounted_price).toFixed(2) + "</td>" +
                '<td class="p-3 text-muted-foreground">' + esc(fmtDate(r.created_at)) + "</td>" +
                '<td class="p-3"><span class="rounded-full px-2.5 py-0.5 text-xs font-semibold ' + st[1] + '">' + st[0] + "</span></td>" +
                '<td class="p-3">' + (r.status === "pending"
                  ? '<div class="flex gap-2">' +
                      '<button data-accept="' + r.id + '" class="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90">' + tr("admin.accept") + '</button>' +
                      '<button data-refuse="' + r.id + '" class="rounded-lg border border-destructive px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10">' + tr("admin.refuse") + '</button>' +
                    "</div>"
                  : "") + "</td>" +
              "</tr>"
            );
          }).join("") +
          "</tbody></table>" +
        "</div>";
      el.querySelectorAll("[data-accept],[data-refuse]").forEach((b) => b.addEventListener("click", async () => {
        const approve = b.dataset.accept !== undefined;
        const id = Number(b.dataset.accept || b.dataset.refuse);
        el.querySelectorAll("button").forEach((x) => { x.disabled = true; });
        const { error } = await db.rpc("decide_discount_request", { _request_id: id, _approve: approve });
        if (error) alert(tErr(error.message));
        await load();
        updateDiscountsBadge();
      }));
    }
    load();
  }

  /* ---------------- Medicine requests (اطلب دواء غير متوفر) ---------------- */
  async function updateMedReqBadge() {
    const { count } = await db.from("medicine_requests").select("id", { count: "exact", head: true }).eq("status", "pending");
    const b = document.querySelector('[data-tab="medreqs"]');
    if (b) b.textContent = tr("admin.tab.medreqs") + (count > 0 ? " (" + count + ")" : "");
  }

  async function medicineRequestsTab(el, alive) {
    el.innerHTML = '<p class="text-muted-foreground">' + tr("admin.loadingReqs") + '</p>';
    const [{ data: reqs, error }, { data: people }] = await Promise.all([
      db.from("medicine_requests").select("*").order("created_at", { ascending: false }),
      db.rpc("admin_user_contacts"),
    ]);
    if (error) console.error(error);
    if (!alive()) return;
    const byId = {};
    (people || []).forEach((c) => { byId[c.user_id] = c; });
    const list = (reqs || []).slice().sort((a, b) => (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1));
    if (!list.length) { el.innerHTML = '<p class="rounded-2xl border bg-card p-10 text-center text-muted-foreground">' + tr("admin.noMedReqs") + '</p>'; return; }
    el.innerHTML =
      '<p class="mb-3 text-sm text-muted-foreground">' + tr("admin.medReqsNote") + '</p>' +
      '<div class="overflow-x-auto rounded-2xl border bg-card">' +
        '<table class="w-full text-sm"><thead><tr class="border-b text-left rtl:text-right text-muted-foreground">' +
          '<th class="p-3">' + tr("admin.customer") + '</th><th class="p-3">' + tr("admin.phone") + '</th><th class="p-3">' + tr("admin.email") + '</th><th class="p-3">' + tr("admin.requestedMed") + '</th><th class="p-3">' + tr("admin.requested") + '</th><th class="p-3">' + tr("admin.status") + '</th>' +
        "</tr></thead><tbody>" +
        list.map((r) => {
          const c = byId[r.user_id] || {};
          const waiting = r.status === "pending";
          return (
            '<tr class="border-b last:border-0">' +
              '<td dir="auto" class="p-3 font-medium text-foreground">' + (c.name ? esc(c.name) : "—") + "</td>" +
              '<td dir="ltr" class="p-3 text-muted-foreground">' + (c.phone ? esc(c.phone) : "—") + "</td>" +
              '<td dir="ltr" class="p-3 text-muted-foreground">' + (c.email ? esc(c.email) : "—") + "</td>" +
              '<td dir="auto" class="p-3 font-semibold text-foreground">' + esc(r.medicine_name) + "</td>" +
              '<td class="p-3 text-muted-foreground">' + esc(fmtDate(r.created_at)) + "</td>" +
              '<td class="p-3"><span class="rounded-full px-2.5 py-0.5 text-xs font-semibold ' + (waiting ? "bg-warning/15 text-warning-foreground" : "bg-success/15 text-success") + '">' +
                (waiting ? tr("admin.waiting") : tr("admin.notified")) + "</span></td>" +
            "</tr>"
          );
        }).join("") +
        "</tbody></table>" +
      "</div>";
  }

  /* ---------------- Medical assistance requests (received through the WhatsApp chatbot) ---------------- */
  async function assistanceTab(el, alive) {
    el.innerHTML = '<p class="text-muted-foreground">' + tr("admin.loadingReqs") + '</p>';
    const { data, error } = await db.from("assistance_requests").select("*").order("created_at", { ascending: false });
    if (error) console.error(error);
    if (!alive()) return;
    const TYPE = { surgical: tr("admin.typeSurgical"), treatment: tr("admin.typeTreatment") };
    const STATUS = {
      awaiting_details: [tr("admin.stAwaiting"), "bg-warning/15 text-warning-foreground"],
      submitted: [tr("admin.stSubmitted"), "bg-success/15 text-success"],
      cancelled: [tr("admin.stCancelled"), "bg-muted text-muted-foreground"],
    };
    const list = (data || []).slice().sort((a, b) => (a.status === "cancelled" ? 1 : 0) - (b.status === "cancelled" ? 1 : 0));
    if (!list.length) { el.innerHTML = '<p class="rounded-2xl border bg-card p-10 text-center text-muted-foreground">' + tr("admin.noAssist") + '</p>'; return; }
    el.innerHTML =
      '<p class="mb-3 text-sm text-muted-foreground">' + tr("admin.assistNote") + '</p>' +
      '<div class="overflow-x-auto rounded-2xl border bg-card">' +
        '<table class="w-full text-sm"><thead><tr class="border-b text-left rtl:text-right text-muted-foreground">' +
          '<th class="p-3">' + tr("admin.received") + '</th><th class="p-3">' + tr("admin.whatsapp") + '</th><th class="p-3">' + tr("admin.type") + '</th><th class="p-3">' + tr("admin.status") + '</th><th class="p-3">' + tr("admin.details") + '</th>' +
        "</tr></thead><tbody>" +
        list.map((r) => {
          const st = STATUS[r.status] || STATUS.awaiting_details;
          return (
            '<tr class="border-b align-top last:border-0">' +
              '<td class="p-3 text-muted-foreground">' + esc(fmtDate(r.submitted_at || r.created_at)) + "</td>" +
              '<td class="p-3"><a dir="ltr" href="https://wa.me/' + esc(String(r.wa_phone).replace(/\D/g, "")) + '" target="_blank" rel="noopener noreferrer" class="font-medium text-primary hover:underline">+' + esc(r.wa_phone) + "</a>" +
                (r.wa_name ? '<div dir="auto" class="text-xs text-muted-foreground">' + esc(r.wa_name) + "</div>" : "") + "</td>" +
              '<td class="p-3 font-medium text-foreground">' + esc(TYPE[r.type] || r.type) + "</td>" +
              '<td class="p-3"><span class="rounded-full px-2.5 py-0.5 text-xs font-semibold ' + st[1] + '">' + st[0] + "</span></td>" +
              '<td dir="auto" class="min-w-64 max-w-md whitespace-pre-wrap p-3 text-foreground">' + (r.details ? esc(r.details) : "—") + "</td>" +
            "</tr>"
          );
        }).join("") +
        "</tbody></table>" +
      "</div>";
  }
})();
