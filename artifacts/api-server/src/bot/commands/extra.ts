import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { GoogleGenAI } from "@google/genai";

const geminiBaseUrl = process.env["AI_INTEGRATIONS_GEMINI_BASE_URL"];
const geminiApiKey = process.env["AI_INTEGRATIONS_GEMINI_API_KEY"] ?? process.env["GEMINI_API_KEY"] ?? "no-key";

const geminiClient = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    apiVersion: "",
    ...(geminiBaseUrl ? { baseUrl: geminiBaseUrl } : {}),
  },
});

const xpData = new Map<string, number>();
const levels = new Map<string, number>();

function getXp(userId: string): number { return xpData.get(userId) ?? 0; }
function getLevel(userId: string): number { return levels.get(userId) ?? 1; }
function addXp(userId: string, amount: number): void {
  const xp = getXp(userId) + amount;
  xpData.set(userId, xp);
  const newLevel = Math.floor(0.1 * Math.sqrt(xp));
  levels.set(userId, Math.max(1, newLevel));
}

export const extraCommands = [
  {
    data: new SlashCommandBuilder().setName("level").setDescription("Check your or someone's level").addUserOption(opt => opt.setName("user").setDescription("User to check")),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user") ?? interaction.user;
      addXp(interaction.user.id, 10);
      const xp = getXp(user.id);
      const lvl = getLevel(user.id);
      const embed = new EmbedBuilder()
        .setTitle(`📊 ${user.username}'s Level`)
        .addFields(
          { name: "Level", value: `${lvl}`, inline: true },
          { name: "XP", value: `${xp}`, inline: true },
          { name: "Next Level", value: `${Math.pow((lvl + 1) / 0.1, 2)} XP needed`, inline: true },
        )
        .setColor(0x5865f2)
        .setThumbnail(user.displayAvatarURL());
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("rank").setDescription("Show your rank on the XP leaderboard"),
    async execute(interaction: ChatInputCommandInteraction) {
      const sorted = [...xpData.entries()].sort((a, b) => b[1] - a[1]);
      const rank = sorted.findIndex(([id]) => id === interaction.user.id) + 1;
      await interaction.reply(`🏆 **${interaction.user.username}** is ranked **#${rank || "Unranked"}** on the XP leaderboard!`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("xpleaderboard").setDescription("Show the XP leaderboard"),
    async execute(interaction: ChatInputCommandInteraction) {
      const sorted = [...xpData.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      const embed = new EmbedBuilder()
        .setTitle("🏆 XP Leaderboard")
        .setDescription(sorted.length === 0 ? "No data yet!" : sorted.map((e, i) => `**${i + 1}.** <@${e[0]}> — **Level ${getLevel(e[0])}** (${e[1]} XP)`).join("\n"))
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("announce")
      .setDescription("Make an announcement")
      .addStringOption(opt => opt.setName("message").setDescription("Announcement text").setRequired(true))
      .addStringOption(opt => opt.setName("title").setDescription("Announcement title")),
    async execute(interaction: ChatInputCommandInteraction) {
      const message = interaction.options.getString("message", true);
      const title = interaction.options.getString("title") ?? "📢 Announcement";
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(message)
        .setColor(0xff6b35)
        .setFooter({ text: `Announced by ${interaction.user.username}` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("giveaway")
      .setDescription("Start a simple giveaway")
      .addStringOption(opt => opt.setName("prize").setDescription("What are you giving away?").setRequired(true))
      .addIntegerOption(opt => opt.setName("duration").setDescription("Duration in minutes").setRequired(true).setMinValue(1).setMaxValue(10080)),
    async execute(interaction: ChatInputCommandInteraction) {
      const prize = interaction.options.getString("prize", true);
      const duration = interaction.options.getInteger("duration", true);
      const endTime = Math.floor((Date.now() + duration * 60000) / 1000);
      const embed = new EmbedBuilder()
        .setTitle("🎉 GIVEAWAY!")
        .setDescription(`**Prize:** ${prize}\n\nReact with 🎉 to enter!\n\n**Ends:** <t:${endTime}:R>`)
        .setColor(0xff6b35)
        .setFooter({ text: `Hosted by ${interaction.user.username}` })
        .setTimestamp();
      const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
      await msg.react("🎉");
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("embed")
      .setDescription("Create a custom embed")
      .addStringOption(opt => opt.setName("title").setDescription("Embed title").setRequired(true))
      .addStringOption(opt => opt.setName("description").setDescription("Embed description").setRequired(true))
      .addStringOption(opt => opt.setName("color").setDescription("Hex color (e.g. ff5733)")),
    async execute(interaction: ChatInputCommandInteraction) {
      const title = interaction.options.getString("title", true);
      const description = interaction.options.getString("description", true);
      const colorHex = interaction.options.getString("color") ?? "5865f2";
      const color = parseInt(colorHex.replace("#", ""), 16) || 0x5865f2;
      const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(color);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("dm")
      .setDescription("إرسال رسالة خاصة لشخص / Send a private DM to a user")
      .addUserOption(opt => opt.setName("user").setDescription("المستخدم / User to DM").setRequired(true))
      .addStringOption(opt => opt.setName("message").setDescription("الرسالة / Message to send").setRequired(true)),
    async execute(interaction: import("discord.js").ChatInputCommandInteraction) {
      const target = interaction.options.getUser("user", true);
      const message = interaction.options.getString("message", true);
      if (target.bot) return interaction.reply({ content: "❌ ما تقدر ترسل لبوت!", ephemeral: true });
      if (target.id === interaction.user.id) return interaction.reply({ content: "❌ ما تقدر ترسل لنفسك!", ephemeral: true });
      try {
        const embed = new EmbedBuilder()
          .setTitle("📨 رسالة خاصة / Private Message")
          .setDescription(message)
          .setColor(0x5865f2)
          .setFooter({ text: `أرسلها: ${interaction.user.username} من ${interaction.guild?.name ?? "سيرفر"}` })
          .setTimestamp();
        await target.send({ embeds: [embed] });
        await interaction.reply({ content: `✅ تم إرسال الرسالة لـ **${target.username}** بنجاح!`, ephemeral: true });
      } catch {
        await interaction.reply({ content: `❌ ما قدرت أرسل لـ **${target.username}** — ربما أوقف الرسائل الخاصة.`, ephemeral: true });
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("say")
      .setDescription("خلّي البوت يتكلم عنك / Make the bot speak on your behalf")
      .addStringOption(opt =>
        opt.setName("text").setDescription("النص اللي تبي البوت يقوله / Text to say").setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName("image").setDescription("رابط صورة اختياري / Optional image URL").setRequired(false)
      )
      .addStringOption(opt =>
        opt.setName("color")
          .setDescription("لون الإطار / Embed color")
          .setRequired(false)
          .addChoices(
            { name: "💙 أزرق", value: "blue" },
            { name: "💚 أخضر", value: "green" },
            { name: "❤️ أحمر", value: "red" },
            { name: "💜 بنفسجي", value: "purple" },
            { name: "🩷 وردي", value: "pink" },
            { name: "🌙 ذهبي", value: "gold" },
          )
      ),
    async execute(interaction: import("discord.js").ChatInputCommandInteraction) {
      const text = interaction.options.getString("text", true);
      const imageUrl = interaction.options.getString("image");
      const colorChoice = interaction.options.getString("color") ?? "blue";

      const colorMap: Record<string, number> = {
        blue: 0x5865f2, green: 0x2ecc71, red: 0xe74c3c,
        purple: 0x9b59b6, pink: 0xff69b4, gold: 0xf1c40f,
      };

      const embed = new EmbedBuilder()
        .setDescription(text.slice(0, 4000))
        .setColor(colorMap[colorChoice] ?? 0x5865f2)
        .setAuthor({
          name: interaction.member && "displayName" in interaction.member
            ? (interaction.member as import("discord.js").GuildMember).displayName
            : interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      if (imageUrl) {
        try {
          new URL(imageUrl);
          embed.setImage(imageUrl);
        } catch { /* invalid URL, skip */ }
      }

      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("chat")
      .setDescription("سوالف مع الذكاء الاصطناعي / Chat with AI")
      .addStringOption(opt =>
        opt.setName("message")
          .setDescription("رسالتك للذكاء الاصطناعي / Your message to AI")
          .setRequired(true)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const userMessage = interaction.options.getString("message", true);
      try { await interaction.deferReply(); } catch { return; }

      try {
        const response = await geminiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          config: {
            systemInstruction: "أنت مساعد ذكي ومفيد في سيرفر ديسكورد. رد بشكل مختصر وواضح. إذا كان السؤال بالعربي رد بالعربي، وإذا كان بالإنجليزي رد بالإنجليزي.",
            maxOutputTokens: 1024,
          },
        });

        const aiReply = response.text ?? "لم أتمكن من الرد، حاول مرة ثانية.";

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
          .addFields(
            { name: "💬 رسالتك", value: userMessage.slice(0, 1024) },
            { name: "🤖 الذكاء الاصطناعي", value: aiReply.slice(0, 1024) },
          )
          .setFooter({ text: "Powered by Gemini AI • Bot_SUKz" })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("[/chat error]", errMsg);
        await interaction.editReply({ content: `❌ حدث خطأ: \`${errMsg.slice(0, 200)}\`` });
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("iq")
      .setDescription("Check someone's IQ")
      .addUserOption(opt => opt.setName("user").setDescription("User to check")),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user") ?? interaction.user;
      const iq = Math.floor(Math.random() * 150) + 70;
      await interaction.reply(`🧠 **${user.username}'s IQ:** ${iq}\n${iq > 130 ? "🔥 Genius!" : iq > 100 ? "✅ Above Average!" : iq > 85 ? "👍 Average!" : "😅 Keep studying!"}`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("ship")
      .setDescription("Ship two users together")
      .addUserOption(opt => opt.setName("user1").setDescription("First user").setRequired(true))
      .addUserOption(opt => opt.setName("user2").setDescription("Second user").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const u1 = interaction.options.getUser("user1", true);
      const u2 = interaction.options.getUser("user2", true);
      const percent = Math.floor(Math.random() * 101);
      const bar = "❤️".repeat(Math.floor(percent / 10)) + "🖤".repeat(10 - Math.floor(percent / 10));
      await interaction.reply(`💘 **${u1.username}** + **${u2.username}**\n${bar} **${percent}%**\n${percent > 80 ? "💍 Perfect match!" : percent > 50 ? "💕 Good match!" : percent > 30 ? "🤔 Maybe?" : "💔 Not meant to be..."}`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("console")
      .setDescription("حل مشاكل أجهزة الكونسل عن طريق كود الخطأ / Fix console errors by error code")
      .addStringOption(opt =>
        opt.setName("platform")
          .setDescription("اختر الجهاز / Choose your console")
          .setRequired(true)
          .addChoices(
            { name: "PlayStation 3 (PS3)", value: "ps3" },
            { name: "PlayStation 4 (PS4)", value: "ps4" },
            { name: "PlayStation 5 (PS5)", value: "ps5" },
            { name: "Xbox One / Series", value: "xbox" },
            { name: "Nintendo Switch", value: "nintendo" },
          )
      )
      .addStringOption(opt =>
        opt.setName("code")
          .setDescription("كود الخطأ / Error code (e.g. CE-34878-0, E100, 2110-3127)")
          .setRequired(true)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const platform = interaction.options.getString("platform", true);
      const rawCode = interaction.options.getString("code", true).trim().toUpperCase();

      type ErrorDb = Record<string, { title: string; steps: string[]; link?: string }>;

      const ps3db: ErrorDb = {
        "8001050F": { title: "خطأ الشبكة العام / General Network Error", steps: ["تحقق من اتصال الإنترنت", "اذهب لـ Settings > Network Settings > Internet Connection Test", "أعد تشغيل الراوتر", "تأكد أن PSN ما عنده صيانة: status.playstation.com"] },
        "80010017": { title: "فشل تشغيل اللعبة / Game Launch Failed", steps: ["أعد تشغيل PS3", "احذف ملف اللعبة المؤقت من Game Data Utility", "أعد تثبيت اللعبة من القرص", "تحقق من أن القرص غير مخدوش"] },
        "80029564": { title: "فشل تثبيت التحديث / Update Install Failed", steps: ["احذف ملف التحديث من Game Data Utility", "نزّل التحديث مجدداً", "جرب التحديث عبر USB", "تأكد من وجود مساحة كافية على الهارد"] },
        "80130203": { title: "انقطع الاتصال بـ PSN / PSN Disconnected", steps: ["تحقق من كلمة مرور PSN", "اذهب لـ Settings > Network Settings وأعد الإعداد", "جرب DNS يدوي: Primary 8.8.8.8 / Secondary 8.8.4.4", "تأكد أن جدار الحماية لا يحجب PS3"] },
        "80710102": { title: "مشكلة الاتصال بـ PSN / Cannot Connect to PSN", steps: ["تحقق من إعدادات الشبكة", "جرب كابل LAN بدلاً من WiFi", "غيّر DNS لـ 8.8.8.8 (Google DNS)", "أعد تشغيل PS3 والراوتر معاً"] },
        "80710016": { title: "PSN تحت الصيانة / PSN Under Maintenance", steps: ["تحقق من حالة PSN: status.playstation.com", "انتظر انتهاء الصيانة", "حاول مجدداً بعد ساعة"] },
        "80010514": { title: "تعطل اللعبة / Game Crashed", steps: ["أعد تشغيل اللعبة", "احذف بيانات اللعبة المؤقتة", "أعد بناء قاعدة البيانات: Safe Mode > Rebuild Database", "أعد تثبيت اللعبة"] },
        "8002A10D": { title: "مشكلة حساب PSN / PSN Account Error", steps: ["سجل خروج وأعد تسجيل الدخول", "تحقق من أن الاشتراك ما انتهى", "اذهب لـ playstation.com وتحقق من الحساب"] },
        "80028F10": { title: "خطأ القرص / Disc Error", steps: ["نظّف القرص بقطعة قماش ناعمة من المركز للخارج", "تحقق من أن القرص ليس مخدوشاً", "جرب قرصاً آخر للتأكد أن المشكلة في القرص أو الجهاز", "إذا كانت جميع الأقراص تعطي نفس الخطأ، مشكلة في قارئ الأقراص"] },
        "80010038": { title: "مشكلة في الهارد ديسك / HDD Error", steps: ["اذهب لـ Safe Mode > Check File System", "جرب Restore File System", "إذا استمر: Restore PS3 System (تحذير: يحذف كل البيانات)", "استبدل الهارد ديسك إذا كان تالفاً"] },
        "8002B241": { title: "DRM / محتوى مقيّد / Content Locked", steps: ["تأكد أنك مسجل بنفس حساب PSN الذي اشترى المحتوى", "فعّل PS3 كـ Primary Console لحسابك", "اذهب لـ PSN > Account Management > Activate as Primary PS3"] },
        "80023017": { title: "مشكلة متجر PlayStation / PlayStation Store Error", steps: ["أعد تشغيل PS3", "امسح بيانات المتصفح: Network > Clear Cookies", "سجل خروج وادخل مجدداً للمتجر", "تحقق من حالة PSN"] },
        "YELLOW LIGHT": { title: "ضوء أصفر / Yellow Light of Death (YLOD)", steps: ["هذه مشكلة هاردوير خطيرة (ارتفاع حرارة أو تلف اللحام)", "افصل PS3 تماماً لمدة 30 دقيقة", "تأكد من تهوية الجهاز ونظافة مروحته", "قد تحتاج لإرسال الجهاز للإصلاح أو استبدال المعجون الحراري"] },
        "BLINKING RED": { title: "ضوء أحمر وامض / Blinking Red Light", steps: ["ارتفاع حرارة شديد — أوقف الجهاز فوراً", "تأكد من وجود تهوية كافية حول PS3", "نظّف مروحة PS3 من الغبار", "أعد تشغيل بعد 30 دقيقة في مكان بارد"] },
      };

      const ps4db: ErrorDb = {
        "CE-34878-0": { title: "تعطل التطبيق / Application Crashed", steps: ["أعد تشغيل اللعبة", "احذف ملفات الحفظ التالفة من الإعدادات", "أعد تثبيت اللعبة", "تحديث نظام PS4 لآخر إصدار"] },
        "NW-31246-6": { title: "مشكلة الاتصال بالشبكة / Network Connection Error", steps: ["تحقق من اتصال الإنترنت", "أعد تشغيل الراوتر", "اذهب لـ Settings > Network > Test Internet Connection", "جرب توصيل كابل LAN مباشرة"] },
        "WS-37368-7": { title: "حساب PSN موقوف / PSN Account Suspended", steps: ["تحقق بريدك الإلكتروني لرسالة من PlayStation", "راسل دعم PlayStation على: playstation.com/support", "إذا تم إيقاف حسابك بسبب مخالفة راجع سياسة الاستخدام"] },
        "CE-32889-0": { title: "لا يمكن تشغيل التطبيق / Cannot Start Application", steps: ["احذف اللعبة وأعد تثبيتها", "تحقق من أن القرص غير مخدوش", "أعد بناء قاعدة البيانات: Safe Mode > Rebuild Database"] },
        "CE-41839-1": { title: "تحديث مطلوب / Update Required", steps: ["اذهب لـ Settings > System Software Update", "اتصل بالإنترنت وحاول مجدداً", "نزل التحديث عبر USB من موقع PlayStation"] },
        "WC-40376-0": { title: "مشكلة في المحفظة / Wallet Error", steps: ["تحقق من رصيد محفظة PSN", "أعد إضافة طريقة دفع من الإعدادات", "جرب من المتصفح على ps.playstation.com"] },
        "SU-42118-6": { title: "فشل التحديث / Update Failed", steps: ["احذف ملف التحديث وأعد التنزيل", "جرب التحديث عبر Safe Mode", "تأكد من وجود مساحة كافية على القرص الصلب"] },
        "E-8210604A": { title: "خطأ في الدفع / Payment Error", steps: ["تحقق من بيانات البطاقة", "اتصل بالبنك للتأكد من عدم وجود حجب", "جرب PayPal كبديل"] },
      };

      const ps5db: ErrorDb = {
        "CE-108255-1": { title: "تعطل النظام / System Crash", steps: ["أعد تشغيل PS5", "اذهب لـ Safe Mode واختر Clear Cache and Rebuild Database", "تحقق من التهوية وعدم ارتفاع الحرارة", "أعد تثبيت السوفت وير من USB إذا استمرت المشكلة"] },
        "CE-107520-6": { title: "خطأ في قاعدة البيانات / Database Error", steps: ["الدخول لـ Safe Mode (أمسك Power 7 ثواني)", "اختر Rebuild Database", "انتظر حتى تنتهي العملية (قد تأخذ وقتاً)"] },
        "CE-100028-1": { title: "مشكلة في تثبيت اللعبة / Game Install Error", steps: ["احذف اللعبة وأعد التثبيت", "تحقق من مساحة SSD الداخلي", "جرب تحديث النظام أولاً"] },
        "CE-112840-6": { title: "خطأ PSN / PSN Error", steps: ["تحقق من حالة PSN: status.playstation.com", "سجل خروج ثم ادخل مجدداً", "أعد تشغيل الجهاز"] },
        "NW-102216-8": { title: "مشكلة WiFi / WiFi Error", steps: ["اذهب لـ Settings > Network > Setup Internet Connection", "أعد إدخال كلمة مرور الواي فاي", "جرب كابل LAN للحصول على اتصال أستقر"] },
      };

      const xboxdb: ErrorDb = {
        "E100": { title: "فشل تحديث النظام / System Update Failed", steps: ["اضغط A لإعادة المحاولة", "إذا فشل: اذهب لـ Startup Troubleshooter", "جرب Offline System Update من support.xbox.com/xbox-one/console/system-update-solution"] },
        "E101": { title: "تحديث مطلوب / Update Required", steps: ["اتصل بالإنترنت وأعد التشغيل", "اذهب لـ Settings > System > Updates", "جرب Hard Reset: أمسك Power 10 ثواني"] },
        "E102": { title: "خطأ تحديث / Update Error E102", steps: ["جرب Offline System Update", "افصل الجهاز 30 ثانية ثم أعد التشغيل", "تواصل مع دعم Xbox إذا استمر"] },
        "0X87E11838": { title: "اللعبة غير مثبتة / Game Not Installed", steps: ["احذف اللعبة وأعد التثبيت", "تحقق من مساحة التخزين", "تحقق من صلاحية اشتراك Game Pass"] },
        "0X8007000E": { title: "ذاكرة غير كافية / Insufficient Memory", steps: ["أغلق التطبيقات التي تعمل في الخلفية", "أعد تشغيل الجهاز", "احذف بيانات غير مستخدمة"] },
        "0X80190193": { title: "خطأ حساب Xbox / Account Error", steps: ["سجل خروج وادخل مجدداً", "تحقق من اشتراك Xbox Live/Game Pass", "تأكد أن طريقة الدفع سارية"] },
        "0X87DD0006": { title: "فشل تسجيل الدخول / Sign-in Failed", steps: ["تحقق من اتصال الإنترنت", "تحقق من حالة Xbox Live: xboxstatus.com", "جرب حذف حسابك وإضافته مجدداً"] },
      };

      const nintendodb: ErrorDb = {
        "2002-4153": { title: "خطأ في الاتصال / Connection Error", steps: ["اذهب لـ System Settings > Internet > Test Connection", "أعد تشغيل الراوتر", "تحقق من أن DNS مضبوط على Auto"] },
        "2110-3127": { title: "مشكلة WiFi / WiFi Problem", steps: ["أعد إدخال كلمة مرور الواي فاي", "قرّب Switch من الراوتر", "جرب تغيير DNS لـ 8.8.8.8 و 8.8.4.4"] },
        "2137-8056": { title: "خطأ eShop / eShop Error", steps: ["تحقق من حالة Nintendo eShop", "امسح Cookies: System Settings > Internet > Connection Settings", "جرب لاحقاً إذا كان eShop تحت الصيانة"] },
        "2168-0002": { title: "خطأ في التحديث / Update Error", steps: ["تحقق من اتصال الإنترنت", "تأكد من وجود مساحة كافية على microSD", "اذهب لـ System Settings > System > System Update"] },
        "2813-1502": { title: "بطاقة microSD تالفة / Corrupt microSD", steps: ["أخرج الـ microSD وأعد إدخالها", "جرب تهيئة الكارت (Format) تحذير: سيحذف كل شيء", "جرب microSD أخرى إذا استمرت المشكلة"] },
      };

      const dbMap: Record<string, ErrorDb> = { ps3: ps3db, ps4: ps4db, ps5: ps5db, xbox: xboxdb, nintendo: nintendodb };
      const platformNames: Record<string, string> = { ps3: "PlayStation 3", ps4: "PlayStation 4", ps5: "PlayStation 5", xbox: "Xbox", nintendo: "Nintendo Switch" };
      const platformColors: Record<string, number> = { ps3: 0x003791, ps4: 0x003087, ps5: 0x00439c, xbox: 0x107c10, nintendo: 0xe4000f };

      const db = dbMap[platform]!;
      const entry = db[rawCode] ?? db[rawCode.replace(/-/g, "")] ?? null;

      const embed = new EmbedBuilder()
        .setColor(platformColors[platform]!)
        .setTimestamp()
        .setFooter({ text: `${platformNames[platform]} Error Helper • Bot_SUKz` });

      if (!entry) {
        embed
          .setTitle(`❓ كود الخطأ غير موجود في قاعدة البيانات`)
          .setDescription(`**الكود:** \`${rawCode}\`\n**الجهاز:** ${platformNames[platform]}\n\nلم يتم العثور على هذا الكود. جرب:`)
          .addFields(
            { name: "🔍 البحث اليدوي", value: ["ps3","ps4","ps5"].includes(platform) ? "[PlayStation Support](https://www.playstation.com/ar-sa/support/)" : platform === "xbox" ? "[Xbox Support](https://support.xbox.com/ar-SA/)" : "[Nintendo Support](https://www.nintendo.com/consumer/)" },
            { name: "💡 تأكد من الكود", value: "تأكد من كتابة الكود بشكل صحيح مثل: `CE-34878-0` أو `E100`" },
          );
      } else {
        embed
          .setTitle(`🎮 ${entry.title}`)
          .setDescription(`**الجهاز:** ${platformNames[platform]}\n**كود الخطأ:** \`${rawCode}\``)
          .addFields({ name: "🔧 خطوات الحل / Fix Steps", value: entry.steps.map((s, i) => `**${i + 1}.** ${s}`).join("\n") });
        if (entry.link) embed.addFields({ name: "🔗 رابط الدعم", value: entry.link });
      }

      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("tiktok")
      .setDescription("نصائح وأفكار تيك توك / TikTok tips and ideas")
      .addStringOption(opt =>
        opt.setName("type")
          .setDescription("نوع المحتوى / Content type")
          .setRequired(true)
          .addChoices(
            { name: "💡 أفكار فيديوهات / Video Ideas", value: "ideas" },
            { name: "📈 نصائح للنمو / Growth Tips", value: "growth" },
            { name: "🎵 اختيار الصوت / Sound Tips", value: "sound" },
            { name: "⏰ أوقات النشر / Best Posting Times", value: "timing" },
            { name: "🔥 هاشتاقات / Hashtags", value: "hashtags" },
          )
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const type = interaction.options.getString("type", true);

      const content: Record<string, { title: string; emoji: string; color: number; items: string[] }> = {
        ideas: {
          title: "💡 أفكار فيديوهات تيك توك",
          emoji: "💡",
          color: 0xff0050,
          items: [
            "فيديو \"يوم في حياتي\" (Day in my life) — شعبية عالية دائماً",
            "تحدي الطعام (Food Challenge) — حضر وصفة غريبة أو سريعة",
            "Get Ready With Me (GRWM) — استعداد ليومك أو لحفلة",
            "فيديو رد فعل على محتوى ترند حالياً",
            "Before & After تحويل شيء قديم لجديد",
            "POV فيديو — ضع نفسك في موقف ما",
            "تعليم شيء في 60 ثانية (Did You Know)",
            "فيديو مقارنة: توقعات vs الواقع",
            "Storytime — قصة مثيرة أو مضحكة من حياتك",
            "تحدي رقص على صوت ترند 🎵",
          ],
        },
        growth: {
          title: "📈 نصائح النمو على تيك توك",
          emoji: "📈",
          color: 0x25f4ee,
          items: [
            "انشر 1-3 فيديوهات يومياً باستمرار — الخوارزمية تكافح المنتظمين",
            "أول 3 ثواني حاسمة — ابدأ بجملة تجذب الانتباه فوراً",
            "استخدم الهاشتاقات الصحيحة: 3-5 هاشتاقات كبيرة + 3-5 صغيرة نيشية",
            "رد على كل تعليق في أول ساعة — يزيد التفاعل للخوارزمية",
            "الفيديوهات بين 7-30 ثانية تحصل على أعلى نسبة مشاهدة كاملة",
            "استخدم Duet و Stitch مع محتوى ترند",
            "ابدأ الفيديو بسؤال أو مشهد مثير — لا تقدمة",
            "أضف نص/كابشن في الفيديو — كثير يشاهدون بدون صوت",
            "اتابع Analytics وشوف أي فيديو نجح وكرره",
            "تعاون مع كريتورز في نفس المجال (Collab)",
          ],
        },
        sound: {
          title: "🎵 نصائح اختيار الصوت",
          emoji: "🎵",
          color: 0xff0050,
          items: [
            "استخدم الأصوات الترند — الخوارزمية تدفع الفيديوهات على الصوت الواحد",
            "اذهب لـ Discover وشوف الأصوات الترند الآن",
            "الأصوات الصاعدة (Rising) أفضل من المشهورة جداً — منافسة أقل",
            "إذا صنعت صوت أصلي، شجع المتابعين على استخدامه",
            "الأغاني العربية الترند تعطيك reach أكبر في الجمهور العربي",
            "اختر صوت يناسب إيقاع فيديوك — لا تفرض صوت على محتوى لا يناسبه",
            "الأصوات الكوميدية والميمز تزيد المشاركة",
          ],
        },
        timing: {
          title: "⏰ أفضل أوقات النشر على تيك توك",
          emoji: "⏰",
          color: 0x25f4ee,
          items: [
            "**الصباح:** 6-9 صباحاً — الناس يشوفون تيك توك قبل الشغل/المدرسة",
            "**الظهر:** 12-2 ظهراً — استراحة الغداء",
            "**المساء:** 7-9 مساءً — أعلى وقت تفاعل ⭐",
            "**الليل:** 10-11 مساءً — ثاني أعلى وقت",
            "**يوم الجمعة والسبت** أعلى أيام التفاعل للجمهور العربي",
            "تحقق من Analytics في حسابك لتعرف متى جمهورك نشيط تحديداً",
            "لا تنشر أكثر من 3 فيديوهات في يوم واحد — يخفض الـ reach",
          ],
        },
        hashtags: {
          title: "🔥 هاشتاقات تيك توك الفعّالة",
          emoji: "🔥",
          color: 0xff0050,
          items: [
            "**عربي عام:** #تيك_توك #fyp #foryou #اكسبلور #viral",
            "**نمو:** #tiktokarab #عرب_تيك_توك #محتوى_عربي #مشاهير_تيك_توك",
            "**ترفيه:** #كوميدي #ضحك #تحديات #ترند",
            "**ألعاب:** #gaming #جيمينج #games #PS5 #Xbox",
            "**تعليم:** #تعلم #معلومة #didyouknow #تثقيف",
            "**نصيحة الهاشتاقات:** لا تستخدم أكثر من 5-7 — أكثر منها يضر",
            "اخلط هاشتاقات كبيرة (ملايين) + صغيرة (آلاف) للوصول الأمثل",
          ],
        },
      };

      const c = content[type]!;
      const embed = new EmbedBuilder()
        .setTitle(c.title)
        .setColor(c.color)
        .setDescription(c.items.map((item, i) => `${i + 1}. ${item}`).join("\n"))
        .setFooter({ text: "TikTok Tips • Bot_SUKz" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    },
  },
];
