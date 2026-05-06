import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ComponentType,
  TextChannel,
} from "discord.js";

// ══════════════════════════════════════════
//              SHARED DATA POOLS
// ══════════════════════════════════════════

const typingTexts = [
  "السلام عليكم يا أهل السيرفر",
  "من صبر ظفر وكل صعب يهون",
  "الفريق المتحد لا يمكن هزيمته أبداً",
  "اللعب الجماعي أقوى من اللعب الفردي",
  "الدفاع الجيد أفضل من الهجوم الرديء",
  "كود وارزون من أكثر الألعاب إثارة",
  "الصبر والتركيز مفتاح النجاح في الحياة",
  "كل بطل بدأ يوماً ما من الصفر",
  "لا تستسلم حتى آخر نفس في المعركة",
  "سيرفرنا الأقوى والأحسن على الإطلاق",
  "العمل الجماعي يصنع المعجزات دائماً",
  "السرعة والدقة أساس كل انتصار كبير",
  "الاستراتيجية تغلب القوة في كل الأوقات",
  "بالتدريب المستمر يصبح المستحيل ممكناً",
  "النصر حليف من يصبر على الشدائد",
  "اللاعب الحقيقي لا يستسلم أبداً",
  "الفوز يحتاج تركيز وسرعة واستراتيجية",
  "مع كل هزيمة درس يقربك من النصر",
];

const fastestWords = [
  "نار","ماء","جبل","نجمة","قمر","شمس","بحر","ريح","وردة","عقاب",
  "أسد","ذئب","نمر","صقر","سيف","درع","قلعة","معركة","نصر","فوز",
  "كود","سيرفر","بوت","لعبة","فريق","تحدي","قناص","هجوم","دفاع","ملك",
];

const triviaQuestions = [
  { q: "كم عدد سور القرآن الكريم؟", a: "114" },
  { q: "ما هي عاصمة البرازيل؟", a: "برازيليا" },
  { q: "من اخترع الهاتف؟", a: "ألكسندر غراهام بيل" },
  { q: "ما أكبر كوكب في المجموعة الشمسية؟", a: "المشتري" },
  { q: "كم عدد أضلع الإنسان؟", a: "24" },
  { q: "ما أسرع حيوان بري في العالم؟", a: "الفهد" },
  { q: "ما عاصمة اليابان؟", a: "طوكيو" },
  { q: "كم يساوي مربع 12؟", a: "144" },
  { q: "ما أطول نهر في العالم؟", a: "النيل" },
  { q: "من رسم الموناليزا؟", a: "ليوناردو دافنشي" },
  { q: "كم عدد ألوان قوس قزح؟", a: "7" },
  { q: "ما أصغر دولة في العالم؟", a: "الفاتيكان" },
  { q: "كم كوكباً في المجموعة الشمسية؟", a: "8" },
  { q: "ما لغة البرمجة الأكثر شيوعاً؟", a: "بايثون" },
  { q: "كم ساعة في الأسبوع؟", a: "168" },
];

const mysteryPersons = [
  { name: "رونالدو", hints: ["لاعب كرة قدم محترف", "جنسيته برتغالية", "فاز بالبالون دور 5 مرات"] },
  { name: "إيلون ماسك", hints: ["مليردير عالمي", "عنده شركة سيارات كهربائية", "اشترى منصة تويتر"] },
  { name: "بروس لي", hints: ["فنان قتال أسطوري", "من أصل صيني وأمريكي", "مات وعمره 32 سنة"] },
  { name: "نيل أرمسترونغ", hints: ["أمريكي الجنسية", "رائد فضاء", "أول إنسان يمشي على سطح القمر"] },
  { name: "محمد علي كلاي", hints: ["بطل ملاكمة عالمي", "غيّر اسمه بعد اعتناق الإسلام", "لقبه الأعظم"] },
  { name: "ستيف جوبز", hints: ["مؤسس شركة Apple", "أمريكي من أصل سوري", "توفي سنة 2011"] },
  { name: "ميسي", hints: ["لاعب كرة قدم أرجنتيني", "لعب في برشلونة 20 سنة", "فاز بكأس العالم 2022"] },
  { name: "إبراهيم الفقي", hints: ["خبير تطوير ذات مصري", "كاتب ومحاضر شهير", "توفي سنة 2012"] },
];

const mafiaRoles = [
  { name: "🔴 مافيا", desc: "دورك تقتل المواطنين ليلاً بشكل سري" },
  { name: "👮 شرطي", desc: "دورك تكشف هوية أحد اللاعبين كل ليلة" },
  { name: "🏥 طبيب", desc: "دورك تحمي أحد اللاعبين من القتل كل ليلة" },
  { name: "👁️ محقق", desc: "دورك تعرف إذا اللاعب بريء أو مذنب" },
  { name: "👤 مواطن", desc: "دورك تكتشف المافيا عن طريق التصويت" },
  { name: "🕵️ جاسوس", desc: "تعرف دور لاعب كل ليلة لكن ما تقدر تحكي لأحد" },
  { name: "💣 قناص", desc: "تقدر تقتل لاعب واحد بس طوال اللعبة كلها" },
  { name: "🎭 محرض", desc: "تقدر تعطي صوتين في التصويت مرة واحدة فقط" },
];

const wouldYouRather = [
  "تعيش بدون إنترنت كل حياتك أو بدون أصدقاء؟",
  "تكون الأذكى في غرفة مغفلين أو أغبى في غرفة عباقرة؟",
  "تأكل نفس الأكلة كل يوم أو ما تأكل أكلتك المفضلة أبداً؟",
  "تعرف تطير أو تعرف تتنفس تحت الماء؟",
  "تكون مشهور ومكروه أو مجهول ومحبوب؟",
  "تعيش في الماضي أو في المستقبل؟",
  "تكون قوي جسدياً أو قوي عقلياً؟",
  "تخسر ذاكرتك كلها أو تخسر جميع أصدقائك؟",
  "تعيش بلا موسيقى أو بلا أفلام طوال حياتك؟",
  "تنام 3 ساعات وتكون نشيط أو تنام 12 ساعة وتكون كسلان؟",
];

const truths = [
  "ما أكثر شيء تخجل منه في حياتك؟",
  "من آخر شخص كذبت عليه وعلى ماذا؟",
  "ما أغبى شيء فعلته في حياتك؟",
  "من الشخص الذي تحسده أكثر في حياتك؟",
  "ما السر الذي تخاف يعرفه أهلك؟",
  "ما أكبر خطأ ارتكبته ولم تعترف به؟",
];

const dares = [
  "اكتب رسالة محرجة لآخر شخص في قائمة جهات اتصالك",
  "غيّر اسمك في الديسكورد لـ 'ملك الحشرات' لمدة 10 دقائق",
  "أرسل 10 هجة في الشات متتالية بدون توقف",
  "قلّد صوت إعلان تلفزيوني واكتبه هنا",
  "اكتب أغبى نكتة تعرفها الحين",
  "امدح السيرفر في 5 أسطر بدون توقف",
];

const roulettePunishments = [
  "تغير اسمك في الديسكورد لمدة ساعة 😂",
  "ترسل صورة وجهك في الشات 😳",
  "تحكي سرك أمام الكل 🤫",
  "تبعث سلام لأكبر شخص في السيرفر 👋",
  "تحكي نكتة وكلهم يقيّمونها 🎭",
  "تكتب 5 أسطر تمدح فيها البوت 🤖",
  "تبقى صامت في الفويس 5 دقائق 🔇",
  "ترسل GIF محرج في الشات 😬",
];

const facts = [
  "النمل لا ينام أبداً طوال حياته 🐜",
  "القلب يضخ ما يكفي من الدم ليملأ مسبح أولمبي خلال عمر الإنسان 💓",
  "الأخطبوط عنده 3 قلوب ودمه أزرق اللون 🐙",
  "العسل لا يفسد أبداً — وُجد عسل عمره 3000 سنة في مصر 🍯",
  "الليمون يحتوي على سكر أكثر من الفراولة 🍋",
  "قلب الروبيان موجود في رأسه وليس صدره 🦐",
  "الفيل الحيوان الوحيد الذي لا يقدر يقفز 🐘",
  "الغيوم تزن ملايين الأطنان رغم أنها تطير 🌩️",
  "الإنسان الوحيد الحيوان الذي ينام على ظهره دائماً 🛌",
  "جلد الزرافة مثل بصمة الإصبع — لا يتكرر 🦒",
];

const storyStarters = [
  "كان يا ما كان، في قديم الزمان...",
  "في يوم من الأيام، فتح الباب فجأة و...",
  "لم يكن أحد يتوقع ما سيحدث عندما...",
  "كانت الساعة منتصف الليل حين...",
  "وجد البطل نفسه في غابة مجهولة و...",
];

const challenges = [
  "اكتب 3 صفات إيجابية في نفسك الحين 💪",
  "ارسل GIF يعبر عن مزاجك الحين 😄",
  "قل كلمة شكر لشخص في السيرفر 🙏",
  "اكتب أغرب شيء عندك في غرفتك الحين 🤔",
  "اكتب نكتة لم يسمعها أحد من قبل 😂",
  "امدح شخصاً في السيرفر بجملة واحدة رائعة 🌟",
];

// ══════════════════════════════════════════
//           LOOP ENGINE (CORE)
// ══════════════════════════════════════════

interface LoopRound {
  embed: EmbedBuilder;
  filter: (content: string) => boolean;
  onSuccess: (content: string, elapsedSec: string) => string;
  onFail: (content: string) => string | null; // null = keep trying, string = show msg
  timeout: number;
}

async function runGameLoop(
  channel: TextChannel,
  userId: string,
  username: string,
  gameName: string,
  generateRound: (round: number) => LoopRound,
): Promise<void> {
  let misses = 0;
  const MAX_MISSES = 2;
  let round = 1;

  while (true) {
    const config = generateRound(round);

    await channel.send({ embeds: [config.embed] });

    const startTime = Date.now();

    try {
      const collected = await channel.awaitMessages({
        filter: m => m.author.id === userId,
        max: 1,
        time: config.timeout,
        errors: ["time"],
      });

      const msg = collected.first()!;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      if (config.filter(msg.content)) {
        misses = 0;
        const successText = config.onSuccess(msg.content, elapsed);
        await msg.reply(successText);
        round++;
        await new Promise(r => setTimeout(r, 1800));
      } else {
        const failText = config.onFail(msg.content);
        if (failText) {
          await msg.reply(failText);
        }
        round++;
        await new Promise(r => setTimeout(r, 1500));
      }

    } catch {
      misses++;
      if (misses >= MAX_MISSES) {
        const embed = new EmbedBuilder()
          .setTitle("🛑 انتهت اللعبة")
          .setDescription(
            `يا **${username}** تجاهلت البوت **${MAX_MISSES} مرات** متتالية!\n\n` +
            `📊 **وصلت إلى الجولة رقم:** ${round}\n` +
            `⏱️ **سبب الإيقاف:** عدم الرد على الوقت المحدد مرتين\n\n` +
            `اكتب \`/games\` من جديد لتبدأ لعبة جديدة! 🎮`
          )
          .setColor(0xff0000)
          .setFooter({ text: `${gameName} • Bot_SUKz` });
        await channel.send({ embeds: [embed] });
        break;
      } else {
        await channel.send(
          `⏰ **${username}** انتهى الوقت! (تحذير ${misses}/${MAX_MISSES})\nالجولة التالية بعد ثانيتين...`
        );
        round++;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
}

// ══════════════════════════════════════════
//              GAME DEFINITIONS
// ══════════════════════════════════════════

function getTypingRound(round: number): LoopRound {
  const text = typingTexts[Math.floor(Math.random() * typingTexts.length)]!;
  return {
    embed: new EmbedBuilder()
      .setTitle(`⚡ سرعة الكتابة — الجولة ${round}`)
      .setDescription(`اكتب النص التالي بأسرع وقت:\n\n\`\`\`${text}\`\`\``)
      .setColor(0xffff00)
      .setFooter({ text: "⏱️ عندك 30 ثانية!" }),
    filter: (c) => c === text,
    onSuccess: (_, elapsed) => `✅ **صح! كتبتها في ${elapsed} ثانية** 🎉 — الجولة التالية قادمة...`,
    onFail: () => `❌ **غلط!** النص المطلوب كان مختلفاً — الجولة التالية...`,
    timeout: 30000,
  };
}

function getFastestRound(round: number): LoopRound {
  const word = fastestWords[Math.floor(Math.random() * fastestWords.length)]!;
  return {
    embed: new EmbedBuilder()
      .setTitle(`⚡ من الأسرع؟ — الجولة ${round}`)
      .setDescription(`اكتب هذي الكلمة بأسرع ما تقدر:\n\n# ${word}`)
      .setColor(0xffff00)
      .setFooter({ text: "⏱️ عندك 10 ثواني!" }),
    filter: (c) => c === word,
    onSuccess: (_, elapsed) => `⚡ **صح! كتبتها في ${elapsed} ثانية** 🏆 — الجولة التالية...`,
    onFail: () => `❌ **غلط!** الكلمة المطلوبة كانت مختلفة — الجولة التالية...`,
    timeout: 10000,
  };
}

function getGuessRound(round: number): LoopRound {
  const num = Math.floor(Math.random() * 100) + 1;
  return {
    embed: new EmbedBuilder()
      .setTitle(`🔢 خمّن الرقم — الجولة ${round}`)
      .setDescription(`خمّن رقم بين **1 و100**!\n\n_لديك تلميح بعد كل محاولة_`)
      .setColor(0x1abc9c)
      .setFooter({ text: "⏱️ عندك 20 ثانية للإجابة!" }),
    filter: (c) => parseInt(c) === num,
    onSuccess: (_, elapsed) => `✅ **صح! الرقم ${num} في ${elapsed} ثانية** 🎉 — الجولة التالية...`,
    onFail: (c) => {
      const guess = parseInt(c);
      if (isNaN(guess)) return null;
      return guess < num ? `📈 أكبر من **${guess}**! حاول مجدداً...` : `📉 أصغر من **${guess}**! حاول مجدداً...`;
    },
    timeout: 20000,
  };
}

function getTriviaRound(round: number): LoopRound {
  const q = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)]!;
  return {
    embed: new EmbedBuilder()
      .setTitle(`🧠 سؤال ثقافي — الجولة ${round}`)
      .setDescription(`**${q.q}**`)
      .setColor(0x3498db)
      .setFooter({ text: "⏱️ عندك 15 ثانية للإجابة!" }),
    filter: (c) => c.includes(q.a) || q.a.includes(c),
    onSuccess: () => `✅ **صح! الجواب: ${q.a}** 🎉 — السؤال التالي قادم...`,
    onFail: () => `❌ **غلط! الجواب الصحيح: ${q.a}** — السؤال التالي...`,
    timeout: 15000,
  };
}

function getMysteryRound(round: number): LoopRound {
  const person = mysteryPersons[Math.floor(Math.random() * mysteryPersons.length)]!;
  return {
    embed: new EmbedBuilder()
      .setTitle(`🌀 خمّن الشخصية — الجولة ${round}`)
      .setDescription(
        `**الأدلة:**\n` +
        person.hints.map((h, i) => `${i + 1}. ${h}`).join("\n") +
        `\n\n_اكتب اسم الشخص في الشات_`
      )
      .setColor(0x2c3e50)
      .setFooter({ text: "⏱️ عندك 20 ثانية!" }),
    filter: (c) => person.name.split(" ").some(w => c.includes(w)),
    onSuccess: () => `✅ **صح! هو ${person.name}** 🎉 — الشخصية التالية قادمة...`,
    onFail: () => `❌ **غلط! الجواب: ${person.name}** — الجولة التالية...`,
    timeout: 20000,
  };
}

// ══════════════════════════════════════════
//           ONE-SHOT GAME HELPERS
// ══════════════════════════════════════════

function oneShotEmbed(title: string, desc: string, color: number): EmbedBuilder {
  return new EmbedBuilder().setTitle(title).setDescription(desc).setColor(color);
}

// ══════════════════════════════════════════
//              MAIN COMMAND
// ══════════════════════════════════════════

export const interactiveGamesCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("games")
      .setDescription("🎮 قائمة الألعاب التفاعلية — 20 لعبة"),
    async execute(interaction: ChatInputCommandInteraction) {
      const select = new StringSelectMenuBuilder()
        .setCustomId("game_select")
        .setPlaceholder("🎮 اختر لعبة...")
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel("⚡ سرعة الكتابة").setValue("typing").setDescription("اكتب النص — تلقائي بلا توقف"),
          new StringSelectMenuOptionBuilder().setLabel("⚡ من الأسرع؟").setValue("fastest").setDescription("اكتب الكلمة — تلقائي بلا توقف"),
          new StringSelectMenuOptionBuilder().setLabel("🔢 خمّن الرقم").setValue("guess").setDescription("رقم بين 1 و100 — تلقائي"),
          new StringSelectMenuOptionBuilder().setLabel("🧠 سؤال ثقافي").setValue("trivia").setDescription("أسئلة متنوعة — تلقائي"),
          new StringSelectMenuOptionBuilder().setLabel("🌀 خمّن الشخصية").setValue("mystery").setDescription("أدلة وخمّن المشهور — تلقائي"),
          new StringSelectMenuOptionBuilder().setLabel("🔴 مافيا").setValue("mafia").setDescription("توزيع أدوار عشوائية"),
          new StringSelectMenuOptionBuilder().setLabel("🎡 روليت العقوبات").setValue("roulette").setDescription("عجلة عقوبات عشوائية"),
          new StringSelectMenuOptionBuilder().setLabel("🤔 ماذا تفضل؟").setValue("wyr").setDescription("اختر بين خيارين صعبين"),
          new StringSelectMenuOptionBuilder().setLabel("🎭 صح أم جرأة").setValue("tod").setDescription("صحيح أو جرأة عشوائية"),
          new StringSelectMenuOptionBuilder().setLabel("🎲 النرد").setValue("dice").setDescription("ارمي النرد"),
          new StringSelectMenuOptionBuilder().setLabel("🪙 عملة").setValue("coin").setDescription("صورة أو كتابة"),
          new StringSelectMenuOptionBuilder().setLabel("❓ معلومة غريبة").setValue("fact").setDescription("معلومة غريبة وصحيحة"),
          new StringSelectMenuOptionBuilder().setLabel("🎯 تحدي اليوم").setValue("challenge").setDescription("تحدي يومي عشوائي"),
          new StringSelectMenuOptionBuilder().setLabel("🃏 بلاك جاك سريع").setValue("blackjack").setDescription("21 بدون رهان"),
          new StringSelectMenuOptionBuilder().setLabel("🔠 الحرف المشترك").setValue("letter").setDescription("كل لاعب يكمل بنفس الحرف"),
          new StringSelectMenuOptionBuilder().setLabel("🎪 عقوبة عشوائية").setValue("random_dare").setDescription("عقوبة عشوائية"),
          new StringSelectMenuOptionBuilder().setLabel("💣 الكلمة المحظورة").setValue("bomb").setDescription("لا تقل الكلمة المحظورة"),
          new StringSelectMenuOptionBuilder().setLabel("👥 فرق عشوائية").setValue("teams").setDescription("قسّم الأعضاء لفريقين"),
          new StringSelectMenuOptionBuilder().setLabel("🎰 جاكبوت").setValue("jackpot").setDescription("ربح أو خسارة بالحظ"),
          new StringSelectMenuOptionBuilder().setLabel("📝 قصة جماعية").setValue("story").setDescription("كمّل القصة بجملة واحدة"),
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

      const embed = new EmbedBuilder()
        .setTitle("🎮 قائمة الألعاب التفاعلية")
        .setDescription(
          "اختر لعبة من القائمة وابدأ اللعب فوراً!\n\n" +
          "⚡ **الألعاب التلقائية** — البوت يكمل بلا توقف حتى تتجاهله مرتين\n" +
          "🎯 **الألعاب الأخرى** — جولة واحدة ممتعة"
        )
        .setColor(0x5865f2)
        .setFooter({ text: "Bot_SUKz • Games" });

      const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 30000,
        filter: i => i.user.id === interaction.user.id,
        max: 1,
      });

      collector.on("collect", async i => {
        const game = i.values[0]!;
        await i.deferUpdate();
        await i.editReply({ components: [] });

        const channel = interaction.channel as TextChannel;
        const userId = interaction.user.id;
        const username = interaction.user.username;

        // ─── LOOP GAMES ───────────────────────────────────────
        if (game === "typing") {
          const startEmbed = new EmbedBuilder()
            .setTitle("⚡ سرعة الكتابة — بدأت!")
            .setDescription(`يا **${username}** — البوت راح يرسل لك نصوص بلا توقف!\nاكتب كل نص بأسرع ما تقدر.\n\n🛑 لو ما رددت مرتين البوت يوقف ويخبرك السبب.`)
            .setColor(0xffff00);
          await channel.send({ embeds: [startEmbed] });
          await new Promise(r => setTimeout(r, 1500));
          await runGameLoop(channel, userId, username, "سرعة الكتابة", getTypingRound);
          return;
        }

        if (game === "fastest") {
          const startEmbed = new EmbedBuilder()
            .setTitle("⚡ من الأسرع؟ — بدأت!")
            .setDescription(`يا **${username}** — البوت راح يرسل كلمات بلا توقف!\nاكتب كل كلمة بأسرع ما تقدر.\n\n🛑 لو ما رددت مرتين البوت يوقف ويخبرك السبب.`)
            .setColor(0xffff00);
          await channel.send({ embeds: [startEmbed] });
          await new Promise(r => setTimeout(r, 1500));
          await runGameLoop(channel, userId, username, "من الأسرع؟", getFastestRound);
          return;
        }

        if (game === "guess") {
          const startEmbed = new EmbedBuilder()
            .setTitle("🔢 خمّن الرقم — بدأت!")
            .setDescription(`يا **${username}** — البوت راح يختار أرقام بلا توقف!\nخمّن كل رقم بين 1 و100.\n\n🛑 لو ما رددت مرتين البوت يوقف ويخبرك السبب.`)
            .setColor(0x1abc9c);
          await channel.send({ embeds: [startEmbed] });
          await new Promise(r => setTimeout(r, 1500));
          await runGameLoop(channel, userId, username, "خمّن الرقم", getGuessRound);
          return;
        }

        if (game === "trivia") {
          const startEmbed = new EmbedBuilder()
            .setTitle("🧠 أسئلة ثقافية — بدأت!")
            .setDescription(`يا **${username}** — البوت راح يسألك أسئلة بلا توقف!\nارد بأسرع ما تقدر.\n\n🛑 لو ما رددت مرتين البوت يوقف ويخبرك السبب.`)
            .setColor(0x3498db);
          await channel.send({ embeds: [startEmbed] });
          await new Promise(r => setTimeout(r, 1500));
          await runGameLoop(channel, userId, username, "الأسئلة الثقافية", getTriviaRound);
          return;
        }

        if (game === "mystery") {
          const startEmbed = new EmbedBuilder()
            .setTitle("🌀 خمّن الشخصية — بدأت!")
            .setDescription(`يا **${username}** — البوت راح يعطيك أدلة بلا توقف!\nخمّن الشخصية من الأدلة.\n\n🛑 لو ما رددت مرتين البوت يوقف ويخبرك السبب.`)
            .setColor(0x2c3e50);
          await channel.send({ embeds: [startEmbed] });
          await new Promise(r => setTimeout(r, 1500));
          await runGameLoop(channel, userId, username, "خمّن الشخصية", getMysteryRound);
          return;
        }

        // ─── ONE-SHOT GAMES ───────────────────────────────────

        switch (game) {
          case "mafia": {
            const shuffled = [...mafiaRoles].sort(() => Math.random() - 0.5).slice(0, 6);
            const embed = new EmbedBuilder()
              .setTitle("🔴 لعبة المافيا — توزيع الأدوار")
              .setDescription("وزّع هذه الأدوار على اللاعبين بشكل سري!")
              .setColor(0xff0000);
            shuffled.forEach((role, idx) => {
              embed.addFields({ name: `اللاعب ${idx + 1}`, value: `${role.name}\n*${role.desc}*`, inline: true });
            });
            embed.setFooter({ text: "ليل → مافيا تقتل | نهار → كلهم يصوّتون" });
            await channel.send({ embeds: [embed] });
            break;
          }

          case "roulette": {
            const p = roulettePunishments[Math.floor(Math.random() * roulettePunishments.length)]!;
            await channel.send({ embeds: [oneShotEmbed("🎡 روليت العقوبات", `العجلة دارت...\n\n**عقوبتك يا ${username}:**\n${p}`, 0xff6b35)] });
            break;
          }

          case "wyr": {
            const q = wouldYouRather[Math.floor(Math.random() * wouldYouRather.length)]!;
            const embed = oneShotEmbed("🤔 ماذا تفضل؟", q, 0x9b59b6);
            embed.setFooter({ text: "رد في الشات باختيارك!" });
            await channel.send({ embeds: [embed] });
            break;
          }

          case "tod": {
            const isTruth = Math.random() < 0.5;
            const list = isTruth ? truths : dares;
            const content = list[Math.floor(Math.random() * list.length)]!;
            await channel.send({ embeds: [oneShotEmbed(isTruth ? "💬 صح (Truth)" : "🎭 جرأة (Dare)", content, isTruth ? 0x3498db : 0xe74c3c)] });
            break;
          }

          case "dice": {
            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;
            await channel.send({ embeds: [oneShotEmbed("🎲 النرد", `رميت النرد مرتين:\n\n🎲 **${d1}** + 🎲 **${d2}** = **${d1 + d2}**`, 0x2ecc71)] });
            break;
          }

          case "coin": {
            const result = Math.random() < 0.5 ? "🦅 صورة" : "✍️ كتابة";
            await channel.send({ embeds: [oneShotEmbed("🪙 رمي العملة", `النتيجة: **${result}**`, 0xf1c40f)] });
            break;
          }

          case "fact": {
            const fact = facts[Math.floor(Math.random() * facts.length)]!;
            await channel.send({ embeds: [oneShotEmbed("❓ معلومة غريبة وصحيحة", fact, 0xe67e22)] });
            break;
          }

          case "challenge": {
            const c = challenges[Math.floor(Math.random() * challenges.length)]!;
            await channel.send({ embeds: [oneShotEmbed("🎯 تحدي اليوم", c, 0x1abc9c)] });
            break;
          }

          case "blackjack": {
            const cards = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
            const vals: Record<string, number> = { A: 11, J: 10, Q: 10, K: 10 };
            const draw = () => cards[Math.floor(Math.random() * cards.length)]!;
            const val = (c: string) => vals[c] ?? parseInt(c);
            const player = [draw(), draw()];
            const bot = [draw(), draw()];
            const pt = player.reduce((s, c) => s + val(c), 0);
            const bt = bot.reduce((s, c) => s + val(c), 0);
            const result = pt === 21 ? "🎉 بلاك جاك! فزت!" : bt === 21 ? "😢 البوت بلاك جاك!" : pt > bt ? "✅ فزت!" : bt > pt ? "❌ البوت فاز!" : "🤝 تعادل!";
            const embed = new EmbedBuilder()
              .setTitle("🃏 بلاك جاك سريع")
              .addFields(
                { name: `يدك (${pt})`, value: player.join(" "), inline: true },
                { name: `يد البوت (${bt})`, value: bot.join(" "), inline: true },
                { name: "النتيجة", value: result },
              )
              .setColor(pt > bt ? 0x00ff00 : 0xff0000);
            await channel.send({ embeds: [embed] });
            break;
          }

          case "letter": {
            const letters = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";
            const letter = letters[Math.floor(Math.random() * letters.length)]!;
            await channel.send({ embeds: [oneShotEmbed("🔠 الحرف المشترك", `الحرف الحين: **${letter}**\n\nكل واحد يكتب كلمة تبدأ بهذا الحرف!\nمن يتأخر أكثر من 10 ثواني أو يعيد كلمة قيلت يخسر! 💥`, 0x9b59b6)] });
            break;
          }

          case "random_dare": {
            const dare = dares[Math.floor(Math.random() * dares.length)]!;
            await channel.send({ embeds: [oneShotEmbed("🎪 العقوبة العشوائية", `يا **${username}** عليك:\n\n${dare}`, 0xe74c3c)] });
            break;
          }

          case "bomb": {
            const bombWords = ["فريق","نصر","هدف","لعبة","بطولة","ديسكورد","سيرفر","تحدي","فوز","كود"];
            const word = bombWords[Math.floor(Math.random() * bombWords.length)]!;
            await channel.send({ embeds: [oneShotEmbed("💣 الكلمة المحظورة", `الكلمة المحظورة: **${word}** 💣\n\nتكلموا طبيعي لكن من قال الكلمة ينفجر 💥\nعندكم **دقيقتان**!`, 0xff4500)] });
            break;
          }

          case "teams": {
            const teamPairs = [
              ["🔥 الفريق الناري", "🌊 الفريق المائي"],
              ["⚡ الصواعق", "🌪️ الأعاصير"],
              ["🦁 الأسود", "🐺 الذئاب"],
              ["🎮 الغيمرز", "🏆 الأبطال"],
            ];
            const [t1, t2] = teamPairs[Math.floor(Math.random() * teamPairs.length)]!;
            await channel.send({ embeds: [oneShotEmbed("👥 توزيع الفرق", `**${t1}**\nضع أسماء لاعبيك هنا\n\n**${t2}**\nضع أسماء لاعبيك هنا\n\nكل عضو يختار فريقه! 🗳️`, 0x1abc9c)] });
            break;
          }

          case "jackpot": {
            const win = Math.random() < 0.3;
            const amount = Math.floor(Math.random() * 5000) + 1000;
            await channel.send({ embeds: [oneShotEmbed("🎰 جاكبوت", win ? `🎉 **جاكبوت!** يا **${username}** ربحت وهمياً **${amount.toLocaleString()} نقطة**! 🤑` : `❌ **خسرت!** يا **${username}** الحظ مو معك اليوم 😅`, win ? 0xffd700 : 0xff0000)] });
            break;
          }

          case "story": {
            const starter = storyStarters[Math.floor(Math.random() * storyStarters.length)]!;
            await channel.send({ embeds: [oneShotEmbed("📝 قصة جماعية", `ابدأ القصة من هنا:\n\n*${starter}*\n\nكل واحد يكمل بجملة واحدة! 📖`, 0x8e44ad)] });
            break;
          }
        }
      });

      collector.on("end", (_, reason) => {
        if (reason === "time") {
          interaction.editReply({ components: [] }).catch(() => {});
        }
      });
    },
  },
];
