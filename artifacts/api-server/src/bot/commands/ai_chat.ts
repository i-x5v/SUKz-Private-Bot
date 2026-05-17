import { Message, MessageFlags } from "discord.js";
import { GoogleGenAI } from "@google/genai";
import { logger } from "../../lib/logger";

// ── إعداد Gemini ────────────────────────────────────────────────────────────

const geminiBaseUrl = process.env["AI_INTEGRATIONS_GEMINI_BASE_URL"];
const geminiApiKey  = process.env["AI_INTEGRATIONS_GEMINI_API_KEY"]
  ?? process.env["GEMINI_API_KEY"]
  ?? "no-key";

const gemini = new GoogleGenAI({
  apiKey: geminiApiKey,
  ...(geminiBaseUrl ? { httpOptions: { apiVersion: "", baseUrl: geminiBaseUrl } } : {}),
});

// ── شخصية البوت ──────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `أنت "SUKz" — عضو في سيرفر ديسكورد. لاعب كود قديم من زمن PS3 و Xbox 360.

شخصيتك:
- تتكلم عربي خليجي عفوي (مزيج سعودي/خليجي)
- ردودك قصيرة جداً — جملة أو جملتين بالحد الأقصى
- تهايط وتطقطق أحياناً بشكل خفيف وبدون إهانة حقيقية
- فاهم جو الكونسل والكود: مابات، سلاح، كيل ديث، سنايبر، هارد سكوب، قيم شات
- أحياناً تبالغ في الثقة بنفسك وأحياناً تنبسط مع الناس
- ما تشتم شتيمة قبيحة — أقصى شيء "يخزيك" أو "وين كنت؟" أو "خسارة" 😂
- ما تعلم بأنك AI أو بوت — تتصرف كأنك عضو حقيقي
- ما تعطي معلومات طويلة أو تشرح — فقط ترد بشكل اجتماعي طبيعي
- تستخدم إيموجيات أحياناً: 😂 💀 🎮 🔫 🤙

أمثلة على ردودك:
- "ايه والله الحمدلله 🙏"
- "هههه وين كنت؟ 💀"
- "اشخاصن يا جاهل"
- "هارد سكوب وإلا ما تعد كيل 😂"
- "والله ما أعرف اسأل غيري"
- "خسارة ما جيت أمس"

لا تطوّل الرد أبداً. ما تعطي قوائم أو نقاط أو شرح. رد طبيعي مثل شخص في شات.`;

// ── حالة النظام ──────────────────────────────────────────────────────────────

// القنوات اللي فيها الشات شغّال: channelId → true
const enabledChannels = new Map<string, boolean>();

// cooldown: userId → آخر وقت رد (ms)
const cooldowns = new Map<string, number>();
const COOLDOWN_MS = 8_000; // 8 ثواني بين كل رد

// سجل المحادثة: channelId → آخر 10 رسائل
const chatHistory = new Map<string, Array<{ role: "user" | "model"; text: string }>>();
const MAX_HISTORY = 10;

// ── دوال مساعدة ──────────────────────────────────────────────────────────────

function isEnabled(channelId: string): boolean {
  return enabledChannels.get(channelId) === true;
}

function isOnCooldown(userId: string): boolean {
  const last = cooldowns.get(userId);
  if (!last) return false;
  return Date.now() - last < COOLDOWN_MS;
}

function setCooldown(userId: string): void {
  cooldowns.set(userId, Date.now());
}

function addToHistory(channelId: string, role: "user" | "model", text: string): void {
  if (!chatHistory.has(channelId)) chatHistory.set(channelId, []);
  const history = chatHistory.get(channelId)!;
  history.push({ role, text });
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
}

function buildContents(channelId: string, newUserMessage: string) {
  const history = chatHistory.get(channelId) ?? [];
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const entry of history) {
    contents.push({ role: entry.role, parts: [{ text: entry.text }] });
  }
  contents.push({ role: "user", parts: [{ text: newUserMessage }] });
  return contents;
}

// ── المعالجة الرئيسية ─────────────────────────────────────────────────────────

/**
 * معالجة رسالة فيها منشن للبوت.
 * يُستدعى من index.ts في حدث MessageCreate.
 */
export async function handleAiMention(message: Message, botId: string): Promise<void> {
  const channelId = message.channelId;

  // تحقق: الشات شغّال في هذه القناة؟
  if (!isEnabled(channelId)) return;

  // تحقق: البوت ما يرد على نفسه
  if (message.author.id === botId) return;

  // تحقق: cooldown
  if (isOnCooldown(message.author.id)) return;

  // استخرج النص بدون المنشن
  const rawText = message.content
    .replace(/<@!?\d+>/g, "")
    .trim();

  if (!rawText) {
    try { await message.reply("أيوه؟ 🎮"); } catch { /* ignore */ }
    return;
  }

  try {
    await message.channel.sendTyping();
  } catch { /* ignore */ }

  // ابنِ السياق مع التاريخ
  const contents = buildContents(channelId, rawText);

  let replyText = "";
  try {
    const result = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.9, maxOutputTokens: 120 },
      contents,
    });
    replyText = result.text?.trim() ?? "";
  } catch (err) {
    logger.warn({ err }, "AI chat: Gemini error");
    return;
  }

  if (!replyText) return;

  // احفظ في التاريخ
  addToHistory(channelId, "user", rawText);
  addToHistory(channelId, "model", replyText);

  // ضبط cooldown
  setCooldown(message.author.id);

  // أرسل الرد
  try {
    await message.reply({ content: replyText });
  } catch (err) {
    logger.warn({ err }, "AI chat: failed to send reply");
  }
}

/**
 * معالجة أوامر !chat on / !chat off
 * يُستدعى من index.ts في حدث MessageCreate.
 * يشترط صلاحية ManageChannels أو Administrator.
 */
export async function handleChatCommand(message: Message): Promise<boolean> {
  const content = message.content.trim().toLowerCase();
  if (!content.startsWith("!chat")) return false;

  const parts = content.split(/\s+/);
  const action = parts[1];
  const channelId = message.channelId;

  // تحقق الصلاحيات
  const member = message.member;
  const hasPermission =
    member?.permissions.has("ManageChannels") ||
    member?.permissions.has("Administrator");

  if (!hasPermission) {
    try {
      await message.reply("❌ تحتاج صلاحية **Manage Channels** لتشغيل أو إيقاف الشات.");
    } catch { /* ignore */ }
    return true;
  }

  if (action === "on") {
    enabledChannels.set(channelId, true);
    chatHistory.delete(channelId); // ابدأ محادثة نظيفة
    try {
      await message.reply("✅ **شات AI شغّال في هذه القناة.**\nمنشن البوت وكلّمه! 🎮");
    } catch { /* ignore */ }
    logger.info({ channelId }, "AI chat enabled");
    return true;
  }

  if (action === "off") {
    enabledChannels.delete(channelId);
    chatHistory.delete(channelId);
    try {
      await message.reply("🔴 **شات AI مطفي في هذه القناة.**");
    } catch { /* ignore */ }
    logger.info({ channelId }, "AI chat disabled");
    return true;
  }

  // أمر غير معروف
  try {
    await message.reply("الأوامر المتاحة:\n`!chat on` — تشغيل\n`!chat off` — إيقاف");
  } catch { /* ignore */ }
  return true;
}
