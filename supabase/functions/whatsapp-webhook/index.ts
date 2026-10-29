// Supabase Edge Function: WhatsApp chatbot for "Request Medical Assistance".
// Deploy with:  supabase functions deploy whatsapp-webhook --no-verify-jwt     (see WHATSAPP_SETUP.md)
import { createClient } from "npm:@supabase/supabase-js@2";
import { handleRequest } from "./handler.ts";
import type { Sender, Store } from "./handler.ts";

const env = (k: string) => {
  const v = Deno.env.get(k);
  if (!v) throw new Error(`Missing secret: ${k}`);
  return v;
};

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

const store: Store = {
  async markProcessed(messageId) {
    const { error } = await supabase.from("wa_processed_messages").insert({ message_id: messageId });
    if (!error) return true;
    if (error.code === "23505") return false;   // already processed
    throw error;
  },
  async getOpenRequest(phone) {
    const { data, error } = await supabase.from("assistance_requests")
      .select("id, type, lang").eq("wa_phone", phone).eq("status", "awaiting_details").maybeSingle();
    if (error) throw error;
    return data;
  },
  async openRequest(phone, name, type, lang) {
    const cancel = await supabase.from("assistance_requests")
      .update({ status: "cancelled" }).eq("wa_phone", phone).eq("status", "awaiting_details");
    if (cancel.error) throw cancel.error;
    const { error } = await supabase.from("assistance_requests")
      .insert({ wa_phone: phone, wa_name: name, type, lang });
    if (error) throw error;
  },
  async submitRequest(id, details) {
    const { error } = await supabase.from("assistance_requests")
      .update({ status: "submitted", details, submitted_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
  },
};

const GRAPH = Deno.env.get("WHATSAPP_GRAPH_VERSION") ?? "v22.0";
async function send(body: Record<string, unknown>) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH}/${env("WHATSAPP_PHONE_NUMBER_ID")}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env("WHATSAPP_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });
  if (!res.ok) throw new Error(`WhatsApp send failed (${res.status}): ${await res.text()}`);
}

const sender: Sender = {
  text: (to, text) => send({ to, type: "text", text: { body: text } }),
  buttons: (to, text, buttons) => send({
    to, type: "interactive",
    interactive: {
      type: "button",
      body: { text },
      action: { buttons: buttons.map((b) => ({ type: "reply", reply: { id: b.id, title: b.title } })) },
    },
  }),
};

Deno.serve((req) =>
  handleRequest(req, {
    store,
    sender,
    config: { verifyToken: env("WHATSAPP_VERIFY_TOKEN"), appSecret: env("WHATSAPP_APP_SECRET") },
  })
);
