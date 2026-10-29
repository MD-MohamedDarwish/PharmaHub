import { buttonId, detectChoice, hasArabic, parseButtonId, TEXT } from "./messages.ts";
import type { Choice, Lang } from "./messages.ts";

export interface OpenRequest { id: number; type: Choice; lang: Lang }
export interface Store {
  /** true the first time a WhatsApp message id is seen, false for a duplicate delivery */
  markProcessed(messageId: string): Promise<boolean>;
  getOpenRequest(phone: string): Promise<OpenRequest | null>;
  /** starts a new request (any older open one of the same phone is cancelled) */
  openRequest(phone: string, name: string | null, type: Choice, lang: Lang): Promise<void>;
  submitRequest(id: number, details: string): Promise<void>;
}
export interface Sender {
  text(to: string, body: string): Promise<void>;
  buttons(to: string, body: string, buttons: { id: string; title: string }[]): Promise<void>;
}
export interface Deps {
  store: Store;
  sender: Sender;
  config: { verifyToken: string; appSecret: string };
}

const enc = new TextEncoder();

export async function verifySignature(raw: string, header: string | null, secret: string): Promise<boolean> {
  if (!header || !header.startsWith("sha256=") || !secret) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(raw)));
  const hex = [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
  const given = header.slice(7);
  if (given.length !== hex.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= given.charCodeAt(i) ^ hex.charCodeAt(i);
  return diff === 0;
}

// deno-lint-ignore no-explicit-any
function incomingOf(msg: any): { text: string | null; buttonId: string | null; summary: string } {
  switch (msg.type) {
    case "text":
      return { text: msg.text?.body ?? "", buttonId: null, summary: msg.text?.body ?? "" };
    case "interactive": {
      const r = msg.interactive?.button_reply ?? msg.interactive?.list_reply;
      return { text: r?.title ?? null, buttonId: r?.id ?? null, summary: r?.title ?? "[Interactive reply]" };
    }
    case "button":
      return { text: msg.button?.text ?? null, buttonId: msg.button?.payload ?? null, summary: msg.button?.text ?? "[Button]" };
    case "image": return { text: null, buttonId: null, summary: "[Image] " + (msg.image?.caption ?? "") };
    case "document": return { text: null, buttonId: null, summary: "[Document] " + [msg.document?.filename, msg.document?.caption].filter(Boolean).join(" - ") };
    case "audio": return { text: null, buttonId: null, summary: "[Voice/audio message]" };
    case "video": return { text: null, buttonId: null, summary: "[Video] " + (msg.video?.caption ?? "") };
    case "location": return { text: null, buttonId: null, summary: `[Location] ${msg.location?.latitude}, ${msg.location?.longitude}` };
    default: return { text: null, buttonId: null, summary: `[${msg.type} message]` };
  }
}

// deno-lint-ignore no-explicit-any
async function processMessage(msg: any, name: string | null, deps: Deps): Promise<void> {
  const { store, sender } = deps;
  if (!msg?.id || !msg?.from) return;
  if (!(await store.markProcessed(msg.id))) return;        // duplicate delivery

  const phone: string = msg.from;
  const incoming = incomingOf(msg);

  // 1) the user picked one of the two options (tapped a suggested message, or a menu button)
  const choice = incoming.buttonId ? parseButtonId(incoming.buttonId)
               : incoming.text ? detectChoice(incoming.text) : null;
  if (choice) {
    await store.openRequest(phone, name, choice.type, choice.lang);
    const t = TEXT[choice.lang];
    await sender.text(phone, choice.type === "surgical" ? t.askSurgical : t.askTreatment);
    return;
  }

  // 2) the user is answering our request for details -> save them and confirm
  const open = await store.getOpenRequest(phone);
  if (open) {
    const details = (incoming.text ?? incoming.summary).trim().slice(0, 4000) || incoming.summary;
    await store.submitRequest(open.id, details);
    await sender.text(phone, TEXT[open.lang].confirm);
    return;
  }

  // 3) anything else -> show the two options as buttons
  const lang: Lang = hasArabic(incoming.text ?? "") ? "ar" : "en";
  const t = TEXT[lang];
  await sender.buttons(phone, t.menuBody, [
    { id: buttonId("surgical", lang), title: t.buttons.surgical },
    { id: buttonId("treatment", lang), title: t.buttons.treatment },
  ]);
}

export async function handleRequest(req: Request, deps: Deps): Promise<Response> {
  const { config } = deps;

  // Meta calls this once when you save the webhook in the dashboard
  if (req.method === "GET") {
    const q = new URL(req.url).searchParams;
    if (q.get("hub.mode") === "subscribe" && q.get("hub.verify_token") === config.verifyToken) {
      return new Response(q.get("hub.challenge") ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const raw = await req.text();
  if (!(await verifySignature(raw, req.headers.get("x-hub-signature-256"), config.appSecret))) {
    return new Response("Invalid signature", { status: 401 });
  }

  // deno-lint-ignore no-explicit-any
  let payload: any;
  try { payload = JSON.parse(raw); } catch { return new Response("Bad request", { status: 400 }); }
  if (payload?.object !== "whatsapp_business_account") return new Response("ok", { status: 200 });

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      const names: Record<string, string> = {};
      for (const c of value.contacts ?? []) if (c?.wa_id) names[c.wa_id] = c.profile?.name ?? "";
      for (const msg of value.messages ?? []) {
        try {
          await processMessage(msg, names[msg.from] || null, deps);
        } catch (err) {
          console.error("whatsapp-webhook: failed to process message", msg?.id, err);   // never make Meta retry forever
        }
      }
    }
  }
  return new Response("ok", { status: 200 });
}
