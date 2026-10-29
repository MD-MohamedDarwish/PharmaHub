// Texts + matching rules for the "Request Medical Assistance" WhatsApp chatbot.
// The two PROMPTS are what you register as WhatsApp "ice breakers" (see WHATSAPP_SETUP.md):
// the user sees them as tappable suggested messages as soon as the chat opens.

export type Lang = "en" | "ar";
export type Choice = "surgical" | "treatment";

export const PROMPTS: Record<Choice, Record<Lang, string>> = {
  surgical: {
    en: "I would like to request financial assistance for a surgical procedure.",
    ar: "أود طلب مساعدة مالية لإجراء عملية جراحية.",
  },
  treatment: {
    en: "I would like to request assistance with a very expensive medical treatment.",
    ar: "أود طلب مساعدة لعلاج طبي مرتفع التكلفة.",
  },
};

export const TEXT: Record<Lang, {
  askSurgical: string; askTreatment: string; confirm: string; menuBody: string;
  buttons: Record<Choice, string>;
}> = {
  en: {
    askSurgical:
      "Thank you for contacting PharmaHub. We are sorry to hear about your situation and we will do our best to help.\n\n" +
      "To review your request for surgical assistance, please reply with a single message that includes:\n" +
      "1. The type of surgery and the hospital where it will be performed\n" +
      "2. The total cost of the surgery\n" +
      "3. The patient's full name and age\n" +
      "4. Your phone number\n" +
      "5. Any other relevant information (for example, the medical report and how urgent the case is)",
    askTreatment:
      "Thank you for contacting PharmaHub. We will do our best to help.\n\n" +
      "To review your request for medical treatment assistance, please reply with a single message that includes:\n" +
      "1. The name of the medicine\n" +
      "2. The type of treatment\n" +
      "3. Your phone number\n" +
      "4. Any other required information (for example, the monthly cost and the prescribing doctor)",
    confirm:
      "Thank you. We have received your information and your request has been registered successfully.\n" +
      "Our team will contact you very soon.\n\nPharmaHub - Your health, our priority",
    menuBody: "Welcome to PharmaHub. Please choose the type of assistance you need:",
    buttons: { surgical: "Surgical Assistance", treatment: "Medical Treatment" },
  },
  ar: {
    askSurgical:
      "شكراً لتواصلكم مع PharmaHub. نتمنى لكم السلامة وسنبذل قصارى جهدنا لمساعدتكم.\n\n" +
      "لدراسة طلب المساعدة الجراحية، يرجى الرد برسالة واحدة تتضمن:\n" +
      "1. نوع العملية الجراحية والمستشفى\n" +
      "2. التكلفة الإجمالية للعملية\n" +
      "3. الاسم الكامل للمريض وعمره\n" +
      "4. رقم هاتفكم\n" +
      "5. أي معلومات أخرى مهمة (مثل التقرير الطبي ومدى استعجال الحالة)",
    askTreatment:
      "شكراً لتواصلكم مع PharmaHub. سنبذل قصارى جهدنا لمساعدتكم.\n\n" +
      "لدراسة طلب المساعدة في العلاج الطبي، يرجى الرد برسالة واحدة تتضمن:\n" +
      "1. اسم الدواء\n" +
      "2. نوع العلاج\n" +
      "3. رقم هاتفكم\n" +
      "4. أي معلومات أخرى مطلوبة (مثل التكلفة الشهرية واسم الطبيب المعالج)",
    confirm:
      "شكراً لكم. تم استلام بياناتكم وتسجيل طلبكم بنجاح.\n" +
      "سيتواصل معكم فريقنا في أقرب وقت.\n\nPharmaHub - صحتك أولويتنا",
    menuBody: "مرحباً بكم في PharmaHub. يرجى اختيار نوع المساعدة المطلوبة:",
    buttons: { surgical: "مساعدة جراحية", treatment: "علاج مرتفع التكلفة" },
  },
};

// ---- matching ----
const norm = (s: string) =>
  s.toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")        // Arabic diacritics
    .replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
    .replace(/[.,!?؟،;:"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const hasArabic = (s: string) => /[\u0600-\u06FF]/.test(s);

/** Is this message exactly one of the suggested messages? */
export function detectChoice(text: string): { type: Choice; lang: Lang } | null {
  const t = norm(text);
  for (const type of ["surgical", "treatment"] as Choice[]) {
    for (const lang of ["en", "ar"] as Lang[]) {
      if (norm(PROMPTS[type][lang]) === t) return { type, lang };
    }
  }
  return null;
}

/** Reply-button ids look like assist_surgical_en / assist_treatment_ar */
export const buttonId = (type: Choice, lang: Lang) => `assist_${type}_${lang}`;
export function parseButtonId(id: string): { type: Choice; lang: Lang } | null {
  const m = /^assist_(surgical|treatment)_(en|ar)$/.exec(id || "");
  return m ? { type: m[1] as Choice, lang: m[2] as Lang } : null;
}
