import { Message } from "discord.js";
import { GoogleGenAI } from "@google/genai";
import { logger } from "../../lib/logger";

// ── إعداد Gemini ─────────────────────────────────────────────────────────────

const geminiBaseUrl = process.env["AI_INTEGRATIONS_GEMINI_BASE_URL"];
const geminiApiKey  = process.env["AI_INTEGRATIONS_GEMINI_API_KEY"]
  ?? process.env["GEMINI_API_KEY"]
  ?? "no-key";

const gemini = new GoogleGenAI({
  apiKey: geminiApiKey,
  ...(geminiBaseUrl ? { httpOptions: { apiVersion: "", baseUrl: geminiBaseUrl } } : {}),
});

// ── شخصية البوت ───────────────────────────────────────────────────────────────
// قواعد صارمة: رد واحد قصير، عفوي، خليجي، بدون تكلف

const SYSTEM_PROMPT = `اسمك SUKz. لاعب كود من زمن PS3. عضو في سيرفر.

قواعد لازم تلتزم فيها:
- رد بجملة واحدة فقط، بالكثير جملتين
- عربي خليجي عامي — مثل واتساب، مو رسمي أبداً
- ما تشرح، ما تعطي معلومات، ما تعدد نقاط
- أحياناً تهايط، أحياناً تطقطق، أحياناً تنبسط
- ما تذكر إنك AI أو بوت
- إيموجي واحد أو اثنين بالكثير

أمثلة ردود (هكذا بالضبط):
"ههههه والله 😂"
"وين كنت يا زول"
"لا خسارة ما جيت"
"اشخاصن"
"والله ما أدري كلمه هو 😂"
"هارد سكوب وإلا كيل فارغ"
"ههه صادق"
"يخزيك 💀"
"لا لا ما صح"
"زين ماشي"
"طيب وش تبي مني الحين"

ممنوع: ردود طويلة، شرح، قوائم، "بالتأكيد"، "بكل سرور"، "يسعدني".`;

// ── ردود احتياطية إذا فشل AI ─────────────────────────────────────────────────

const FALLBACK_REPLIES = [
  "ههههه 😂",
  "اشخاصن",
  "والله ما أدري",
  "هيه؟",
  "لا خلني أفكر",
  "وش تبي الحين 😂",
  "يخزيك 💀",
  "ماشي زين",
  "صح صح",
  "هههه لا",
];

function randomFallback(): string {
  return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)]!;
}

// ── حالة النظام ───────────────────────────────────────────────────────────────

const enabledChannels = new Map<string, boolean>();
const cooldowns       = new Map<string, number>();
const COOLDOWN_MS     = 7_000;

const chatHistory = new Map<string, Array<{ role: "user" | "model"; text: string }>>();
const MAX_HISTORY = 8;

// ── مساعدات ──────────────────────────────────────────────────────────────────

function isEnabled(channelId: string)   { return enabledChannels.get(channelId) === true; }
function isOnCooldown(userId: string)   { const t = cooldowns.get(userId); return !!t && Date.now() - t < COOLDOWN_MS; }
function setCooldown(userId: string)    { cooldowns.set(userId, Date.now()); }

function addHistory(channelId: string, role: "user" | "model", text: string) {
  if (!chatHistory.has(channelId)) chatHistory.set(channelId, []);
  const h = chatHistory.get(channelId)!;
  h.push({ role, text });
  if (h.length > MAX_HISTORY) h.splice(0, h.length - MAX_HISTORY);
}

function buildContents(channelId: string, userMsg: string) {
  const history = chatHistory.get(channelId) ?? [];
  const out: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  for (const e of history) out.push({ role: e.role, parts: [{ text: e.text }] });
  out.push({ role: "user", parts: [{ text: userMsg }] });
  return out;
}

// ── المعالج الرئيسي ───────────────────────────────────────────────────────────

export async function handleAiMention(message: Message, botId: string): Promise<void> {
  const channelId = message.channelId;
  if (!isEnabled(channelId))           return;
  if (message.author.id === botId)     return;
  if (isOnCooldown(message.author.id)) return;

  // نص بدون المنشن
  const rawText = message.content.replace(/<@!?\d+>/g, "").trim();
  if (!rawText) {
    try { await message.reply("هيه؟ 🎮"); } catch { /* ignore */ }
    return;
  }

  // ── تحديث typing كل 8 ث حتى ما ينتهي قبل الرد ────────────────────────────
  let typingStopped = false;
  const keepTyping = async () => {
    while (!typingStopped) {
      try { await message.channel.sendTyping(); } catch { /* ignore */ }
      await new Promise(r => setTimeout(r, 8_000));
    }
  };
  keepTyping(); // لا تنتظر — شغّل في الخلفية

  // ── استدعاء Gemini مع timeout 12 ث ──────────────────────────────────────
  let replyText = "";
  try {
    const geminiPromise = gemini.models.generateContent({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 1.1,
        maxOutputTokens: 60,   // إجبار على الإيجاز
      },
      contents: buildContents(channelId, rawText),
    });

    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 12_000)
    );

    const result = await Promise.race([geminiPromise, timeoutPromise]);
    if (result) {
      replyText = (result as Awaited<typeof geminiPromise>).text?.trim() ?? "";
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ err: msg, channelId }, "AI chat: Gemini failed");
  }

  typingStopped = true;

  // ── إذا رجع فارغ → fallback ───────────────────────────────────────────────
  if (!replyText) replyText = randomFallback();

  // ── تقطيع لو طال (نادر) ──────────────────────────────────────────────────
  if (replyText.length > 200) replyText = replyText.slice(0, 200);

  // ── احفظ في التاريخ وأرسل ────────────────────────────────────────────────
  addHistory(channelId, "user",  rawText);
  addHistory(channelId, "model", replyText);
  setCooldown(message.author.id);

  try {
    await message.reply({ content: replyText });
  } catch (err) {
    logger.warn({ err }, "AI chat: reply failed");
  }
}

// ── أوامر !chat ───────────────────────────────────────────────────────────────

export async function handleChatCommand(message: Message): Promise<boolean> {
  const content = message.content.trim().toLowerCase();
  if (!content.startsWith("!chat")) return false;

  const action    = content.split(/\s+/)[1];
  const channelId = message.channelId;
  const member    = message.member;
  const hasPerm   = member?.permissions.has("ManageChannels") || member?.permissions.has("Administrator");

  if (!hasPerm) {
    try { await message.reply("❌ تحتاج صلاحية **Manage Channels**."); } catch { /* ignore */ }
    return true;
  }

  if (action === "on") {
    enabledChannels.set(channelId, true);
    chatHistory.delete(channelId);
    try { await message.reply("✅ شات AI شغّال — منشن البوت وكلّمه 🎮"); } catch { /* ignore */ }
    logger.info({ channelId }, "AI chat ON");
    return true;
  }

  if (action === "off") {
    enabledChannels.delete(channelId);
    chatHistory.delete(channelId);
    try { await message.reply("🔴 شات AI مطفي."); } catch { /* ignore */ }
    logger.info({ channelId }, "AI chat OFF");
    return true;
  }

  if (action === "reset") {
    chatHistory.delete(channelId);
    try { await message.reply("🔄 تم مسح سجل المحادثة."); } catch { /* ignore */ }
    return true;
  }

  try {
    await message.reply("`!chat on` — تشغيل\n`!chat off` — إيقاف\n`!chat reset` — مسح السجل");
  } catch { /* ignore */ }
  return true;
}
