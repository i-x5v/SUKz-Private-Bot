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
];

const mafiaRoles = [
  { name: "🔴 مافيا", desc: "دورك تقتل المواطنين ليلاً بشكل سري" },
  { name: "👮 شرطي", desc: "دورك تكشف هوية أحد اللاعبين كل ليلة" },
  { name: "🏥 طبيب", desc: "دورك تحمي أحد اللاعبين من القتل كل ليلة" },
  { name: "👁️ محقق", desc: "دورك تعرف إذا اللاعب بريء أو مذنب" },
  { name: "👤 مواطن", desc: "دورك تكتشف المافيا عن طريق التصويت" },
  { name: "🕵️ جاسوس", desc: "تعرف دور لاعب كل ليلة لكن لا تقدر تحكي لأحد" },
  { name: "💣 قناص", desc: "تقدر تقتل لاعب واحد بس طوال اللعبة" },
  { name: "🎭 محرض", desc: "تقدر تعطي صوتين في التصويت مرة واحدة" },
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
  "تكون بارد المزاج دائماً أو حار المزاج دائماً؟",
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
  "أرسل 10 هجة بالشات متتالية بدون توقف",
  "قلّد صوت إعلان تلفزيوني واكتبه هنا",
  "اكتب أغبى نكتة تعرفها الحين",
  "أمدح السيرفر في 5 أسطر بدون توقف",
];

const roulettePunishments = [
  "تغير اسمك في الديسكورد لمدة ساعة 😂",
  "ترسل صورة وجهك في الشات 😳",
  "تحكي سرك أمام الكل 🤫",
  "تبعث سلام لأكبر شخص في السيرفر 👋",
  "تحكي نكتة وكلهم يقيّمونها 🎭",
  "تكتب 5 أسطر تمدح فيها البوت 🤖",
  "تقلد شخصية كرتونية في الشات 🦸",
  "تبقى صامت في الفويس 5 دقائق 🔇",
];

const facts = [
  "النمل لا ينام أبداً طوال حياته 🐜",
  "القلب يضخ ما يكفي من الدم ليملأ مسبح أولمبي خلال عمر الإنسان 💓",
  "الأخطبوط عنده 3 قلوب وزرقاء الدم 🐙",
  "العسل لا يفسد أبداً — وُجد عسل عمره 3000 سنة في مصر 🍯",
  "الليمون يحتوي على سكر أكثر من الفراولة 🍋",
  "قلب الروبيان موجود في رأسه 🦐",
  "الفيل الوحيد الحيوان الذي لا يقدر يقفز 🐘",
  "الغيوم تزن ملايين الأطنان رغم أنها تطير 🌩️",
];

const mysteryPersons = [
  { name: "رونالدو", hints: ["لاعب كرة قدم محترف", "جنسيته برتغالية", "فاز بالبالون دور 5 مرات"] },
  { name: "إيلون ماسك", hints: ["مليردير عالمي", "عنده شركة سيارات كهربائية", "اشترى منصة تويتر"] },
  { name: "بروس لي", hints: ["فنان قتال أسطوري", "من أصل صيني وأمريكي", "مات وعمره 32 سنة"] },
  { name: "نيل أرمسترونغ", hints: ["أمريكي الجنسية", "رائد فضاء ناسا", "أول إنسان يمشي على سطح القمر"] },
  { name: "محمد علي كلاي", hints: ["أمريكي من أصل أفريقي", "بطل ملاكمة عالمي", "غيّر اسمه بعد اعتناق الإسلام"] },
];

const triviaQuestions = [
  { q: "كم عدد سور القرآن الكريم؟", a: "114" },
  { q: "ما هي عاصمة البرازيل؟", a: "برازيليا" },
  { q: "من اخترع الهاتف؟", a: "ألكسندر غراهام بيل" },
  { q: "ما أكبر كوكب في المجموعة الشمسية؟", a: "المشتري" },
  { q: "كم عدد أضلع الإنسان؟", a: "24" },
  { q: "ما أسرع حيوان بري في العالم؟", a: "الفهد" },
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
          new StringSelectMenuOptionBuilder().setLabel("⚡ سرعة الكتابة").setValue("typing").setDescription("اكتب النص قبل انتهاء الوقت"),
          new StringSelectMenuOptionBuilder().setLabel("🔴 مافيا").setValue("mafia").setDescription("توزيع أدوار عشوائية للمافيا"),
          new StringSelectMenuOptionBuilder().setLabel("🎡 روليت العقوبات").setValue("roulette").setDescription("عجلة عقوبات عشوائية"),
          new StringSelectMenuOptionBuilder().setLabel("🤔 ماذا تفضل؟").setValue("wyr").setDescription("اختر بين خيارين صعبين"),
          new StringSelectMenuOptionBuilder().setLabel("🎭 صح أم جرأة").setValue("tod").setDescription("صحيح أو جرأة عشوائية"),
          new StringSelectMenuOptionBuilder().setLabel("🎲 النرد").setValue("dice").setDescription("ارمي النرد وأعلى رقم يفوز"),
          new StringSelectMenuOptionBuilder().setLabel("🪙 عملة").setValue("coin").setDescription("صورة أو كتابة"),
          new StringSelectMenuOptionBuilder().setLabel("🔢 خمّن الرقم").setValue("guess").setDescription("رقم بين 1 و100 — 3 محاولات"),
          new StringSelectMenuOptionBuilder().setLabel("❓ معلومة غريبة").setValue("fact").setDescription("معلومة غريبة وصحيحة"),
          new StringSelectMenuOptionBuilder().setLabel("🎯 تحدي اليوم").setValue("challenge").setDescription("تحدي يومي عشوائي"),
          new StringSelectMenuOptionBuilder().setLabel("🃏 بلاك جاك سريع").setValue("blackjack").setDescription("21 بدون رهان"),
          new StringSelectMenuOptionBuilder().setLabel("🔠 الحرف المشترك").setValue("letter").setDescription("كل لاعب يكمل بنفس الحرف"),
          new StringSelectMenuOptionBuilder().setLabel("🌀 الشخصية الغامضة").setValue("mystery").setDescription("خمّن أنا مين؟"),
          new StringSelectMenuOptionBuilder().setLabel("⚡ من الأسرع؟").setValue("fastest").setDescription("اكتب الكلمة قبل غيرك"),
          new StringSelectMenuOptionBuilder().setLabel("🎪 عقوبة عشوائية").setValue("random_dare").setDescription("عقوبة عشوائية من القائمة"),
          new StringSelectMenuOptionBuilder().setLabel("🧠 سؤال ثقافي").setValue("trivia").setDescription("سؤال ثقافي سريع"),
          new StringSelectMenuOptionBuilder().setLabel("💣 الكلمة المحظورة").setValue("bomb").setDescription("لا تقول الكلمة المحظورة"),
          new StringSelectMenuOptionBuilder().setLabel("👥 فرق عشوائية").setValue("teams").setDescription("قسّم الأعضاء لفريقين"),
          new StringSelectMenuOptionBuilder().setLabel("🎰 جاكبوت").setValue("jackpot").setDescription("ربح أو خسارة بالحظ"),
          new StringSelectMenuOptionBuilder().setLabel("📝 قصة جماعية").setValue("story").setDescription("كمّل القصة بجملة واحدة"),
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

      const embed = new EmbedBuilder()
        .setTitle("🎮 قائمة الألعاب التفاعلية")
        .setDescription("اختر لعبة من القائمة وابدأ اللعب فوراً!\n\n⚡ **20 لعبة** جاهزة لك")
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
        const channel = interaction.channel as TextChannel;

        switch (game) {

          case "typing": {
            const text = typingTexts[Math.floor(Math.random() * typingTexts.length)]!;
            const startEmbed = new EmbedBuilder()
              .setTitle("⚡ سرعة الكتابة")
              .setDescription(`اكتب النص التالي بأسرع وقت!\n\n\`\`\`${text}\`\`\``)
              .setColor(0xffff00)
              .setFooter({ text: "⏱️ عندك 30 ثانية!" });
            await i.editReply({ embeds: [startEmbed], components: [] });
            const start = Date.now();
            try {
              const collected = await channel.awaitMessages({
                filter: m => m.author.id === interaction.user.id && m.content === text,
                max: 1,
                time: 30000,
                errors: ["time"],
              });
              const elapsed = ((Date.now() - start) / 1000).toFixed(2);
              await collected.first()!.reply(`✅ **صح!** كتبتها في **${elapsed} ثانية** 🎉`);
            } catch {
              await channel.send(`⏰ ${interaction.user} انتهى الوقت! النص كان:\n\`${text}\``);
            }
            break;
          }

          case "mafia": {
            const shuffled = [...mafiaRoles].sort(() => Math.random() - 0.5).slice(0, 6);
            const embed = new EmbedBuilder()
              .setTitle("🔴 لعبة المافيا — توزيع الأدوار")
              .setDescription("وزّع هذه الأدوار على اللاعبين بشكل سري — كل واحد يعرف دوره فقط!")
              .setColor(0xff0000);
            shuffled.forEach((role, idx) => {
              embed.addFields({ name: `اللاعب ${idx + 1}`, value: `${role.name}\n*${role.desc}*`, inline: true });
            });
            embed.setFooter({ text: "قواعد المافيا: ليل → المافيا تقتل | نهار → الكل يصوّت" });
            await i.editReply({ embeds: [embed], components: [] });
            break;
          }

          case "roulette": {
            const punishment = roulettePunishments[Math.floor(Math.random() * roulettePunishments.length)]!;
            const embed = new EmbedBuilder()
              .setTitle("🎡 روليت العقوبات")
              .setDescription(`العجلة دارت...\n\n**عقوبتك يا ${interaction.user.username}:**\n${punishment}`)
              .setColor(0xff6b35);
            await i.editReply({ embeds: [embed], components: [] });
            break;
          }

          case "wyr": {
            const question = wouldYouRather[Math.floor(Math.random() * wouldYouRather.length)]!;
            const embed = new EmbedBuilder()
              .setTitle("🤔 ماذا تفضل؟")
              .setDescription(question)
              .setColor(0x9b59b6)
              .setFooter({ text: "رد في الشات باختيارك!" });
            await i.editReply({ embeds: [embed], components: [] });
            break;
          }

          case "tod": {
            const isTruth = Math.random() < 0.5;
            const list = isTruth ? truths : dares;
            const content = list[Math.floor(Math.random() * list.length)]!;
            const embed = new EmbedBuilder()
              .setTitle(isTruth ? "💬 صح (Truth)" : "🎭 جرأة (Dare)")
              .setDescription(content)
              .setColor(isTruth ? 0x3498db : 0xe74c3c);
            await i.editReply({ embeds: [embed], components: [] });
            break;
          }

          case "dice": {
            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;
            const embed = new EmbedBuilder()
              .setTitle("🎲 النرد")
              .setDescription(`رميت النرد مرتين:\n\n🎲 **${d1}** + 🎲 **${d2}** = **${d1 + d2}**`)
              .setColor(0x2ecc71);
            await i.editReply({ embeds: [embed], components: [] });
            break;
          }

          case "coin": {
            const result = Math.random() < 0.5 ? "🦅 صورة" : "✍️ كتابة";
            const embed = new EmbedBuilder()
              .setTitle("🪙 رمي العملة")
              .setDescription(`النتيجة: **${result}**`)
              .setColor(0xf1c40f);
            await i.editReply({ embeds: [embed], components: [] });
            break;
          }

          case "guess": {
            const num = Math.floor(Math.random() * 100) + 1;
            const embed = new EmbedBuilder()
              .setTitle("🔢 خمّن الرقم")
              .setDescription("خمّن رقم بين **1 و100** — عندك **3 محاولات**!")
              .setColor(0x1abc9c);
            await i.editReply({ embeds: [embed], components: [] });

            let attempts = 0;
            const tryCollect = async (): Promise<void> => {
              if (attempts >= 3) {
                await channel.send(`❌ انتهت محاولاتك! الرقم كان **${num}**`);
                return;
              }
              try {
                const collected = await channel.awaitMessages({
                  filter: m => m.author.id === interaction.user.id && !isNaN(parseInt(m.content)),
                  max: 1,
                  time: 15000,
                  errors: ["time"],
                });
                const msg = collected.first()!;
                const guess = parseInt(msg.content);
                attempts++;
                if (guess === num) {
                  await msg.reply(`✅ **صح!** الرقم **${num}** 🎉 في المحاولة رقم ${attempts}`);
                } else if (attempts < 3) {
                  await msg.reply(guess < num ? `📈 أكبر! (${attempts}/3)` : `📉 أصغر! (${attempts}/3)`);
                  await tryCollect();
                } else {
                  await msg.reply(`❌ انتهت المحاولات! الرقم كان **${num}**`);
                }
              } catch {
                await channel.send(`⏰ انتهى الوقت! الرقم كان **${num}**`);
              }
            };
            await tryCollect();
            break;
          }

          case "fact": {
            const fact = facts[Math.floor(Math.random() * facts.length)]!;
            const embed = new EmbedBuilder()
              .setTitle("❓ معلومة غريبة وصحيحة")
              .setDescription(fact)
              .setColor(0xe67e22);
            await i.editReply({ embeds: [embed], components: [] });
            break;
          }

          case "challenge": {
            const c = challenges[Math.floor(Math.random() * challenges.length)]!;
            const embed = new EmbedBuilder()
              .setTitle("🎯 تحدي اليوم")
              .setDescription(c)
              .setColor(0x1abc9c);
            await i.editReply({ embeds: [embed], components: [] });
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
            await i.editReply({ embeds: [embed], components: [] });
            break;
          }

          case "letter": {
            const letters = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";
            const letter = letters[Math.floor(Math.random() * letters.length)]!;
            const embed = new EmbedBuilder()
              .setTitle("🔠 الحرف المشترك")
              .setDescription(`الحرف الحين: **${letter}**\n\nكل واحد يكتب كلمة تبدأ بهذا الحرف!\nمن يتأخر أكثر من 10 ثواني أو يعيد كلمة قيلت يخسر! 💥`)
              .setColor(0x9b59b6);
            await i.editReply({ embeds: [embed], components: [] });
            break;
          }

          case "mystery": {
            const person = mysteryPersons[Math.floor(Math.random() * mysteryPersons.length)]!;
            const embed = new EmbedBuilder()
              .setTitle("🌀 خمّن أنا مين؟")
              .setDescription(`**الأدلة:**\n${person.hints.map((h, idx) => `${idx + 1}. ${h}`).join("\n")}`)
              .setColor(0x2c3e50)
              .setFooter({ text: "اكتب الاسم في الشات — عندك 20 ثانية!" });
            await i.editReply({ embeds: [embed], components: [] });
            try {
              const collected = await channel.awaitMessages({
                filter: m => m.author.id === interaction.user.id,
                max: 1,
                time: 20000,
                errors: ["time"],
              });
              const answer = collected.first()!.content.toLowerCase();
              const correct = person.name.toLowerCase().split(" ").some(w => answer.includes(w));
              await collected.first()!.reply(correct ? `✅ **صح!** هو **${person.name}** 🎉` : `❌ **غلط!** الجواب: **${person.name}**`);
            } catch {
              await channel.send(`⏰ انتهى الوقت! الجواب: **${person.name}**`);
            }
            break;
          }

          case "fastest": {
            const words = ["نار","ماء","جبل","نجمة","قمر","شمس","بحر","ريح","وردة","عقاب","أسد","ذئب"];
            const word = words[Math.floor(Math.random() * words.length)]!;
            const embed = new EmbedBuilder()
              .setTitle("⚡ من الأسرع؟")
              .setDescription(`اكتب هذي الكلمة أسرع شخص:\n\n# ${word}\n\nعندكم **10 ثواني**! 🏁`)
              .setColor(0xffff00);
            await i.editReply({ embeds: [embed], components: [] });
            const start = Date.now();
            try {
              const collected = await channel.awaitMessages({
                filter: m => m.content === word,
                max: 1,
                time: 10000,
                errors: ["time"],
              });
              const elapsed = ((Date.now() - start) / 1000).toFixed(2);
              await collected.first()!.reply(`⚡ **${collected.first()!.author.username}** الأسرع! كتبها في **${elapsed} ثانية** 🏆`);
            } catch {
              await channel.send("⏰ ما كتبها أحد! ضعاف 😅");
            }
            break;
          }

          case "random_dare": {
            const dare = dares[Math.floor(Math.random() * dares.length)]!;
            const embed = new EmbedBuilder()
              .setTitle("🎪 العقوبة العشوائية")
              .setDescription(`يا **${interaction.user.username}** عليك:\n\n${dare}`)
              .setColor(0xe74c3c);
            await i.editReply({ embeds: [embed], components: [] });
            break;
          }

          case "trivia": {
            const q = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)]!;
            const embed = new EmbedBuilder()
              .setTitle("🧠 سؤال ثقافي سريع")
              .setDescription(`**${q.q}**`)
              .setColor(0x3498db)
              .setFooter({ text: "اكتب الجواب في الشات — عندك 15 ثانية!" });
            await i.editReply({ embeds: [embed], components: [] });
            try {
              const collected = await channel.awaitMessages({
                filter: m => m.author.id === interaction.user.id,
                max: 1,
                time: 15000,
                errors: ["time"],
              });
              const ans = collected.first()!.content;
              const correct = ans.includes(q.a) || q.a.includes(ans);
              await collected.first()!.reply(correct ? `✅ **صح!** 🎉 الجواب: **${q.a}**` : `❌ **غلط!** الجواب الصحيح: **${q.a}**`);
            } catch {
              await channel.send(`⏰ انتهى الوقت! الجواب: **${q.a}**`);
            }
            break;
          }

          case "bomb": {
            const bombWords = ["فريق","نصر","هدف","لعبة","بطولة","ديسكورد","سيرفر","تحدي","فوز","كود"];
            const word = bombWords[Math.floor(Math.random() * bombWords.length)]!;
            const embed = new EmbedBuilder()
              .setTitle("💣 الكلمة المحظورة")
              .setDescription(`الكلمة المحظورة الحين: **${word}** 💣\n\nتكلموا طبيعي لكن من قال الكلمة ينفجر 💥\nعندكم **2 دقيقة**!`)
              .setColor(0xff4500);
            await i.editReply({ embeds: [embed], components: [] });
            break;
          }

          case "teams": {
            const teamNames = [
              ["🔥 الفريق الناري","🌊 الفريق المائي"],
              ["⚡ الصواعق","🌪️ الأعاصير"],
              ["🦁 الأسود","🐺 الذئاب"],
              ["🎮 الغيمرز","🏆 الأبطال"],
            ];
            const picked = teamNames[Math.floor(Math.random() * teamNames.length)]!;
            const embed = new EmbedBuilder()
              .setTitle("👥 توزيع الفرق")
              .setDescription(`**${picked[0]}**\nضع أسماء لاعبيك هنا\n\n**${picked[1]}**\nضع أسماء لاعبيك هنا\n\nكل عضو يختار فريقه بالتصويت! 🗳️`)
              .setColor(0x1abc9c);
            await i.editReply({ embeds: [embed], components: [] });
            break;
          }

          case "jackpot": {
            const win = Math.random() < 0.3;
            const amount = Math.floor(Math.random() * 5000) + 1000;
            const embed = new EmbedBuilder()
              .setTitle("🎰 جاكبوت")
              .setDescription(win
                ? `🎉 **جاكبوت!** يا **${interaction.user.username}** ربحت وهمياً **${amount.toLocaleString()} نقطة**! 🤑`
                : `❌ **خسرت!** يا **${interaction.user.username}** الحظ مو معك اليوم 😅`)
              .setColor(win ? 0xffd700 : 0xff0000);
            await i.editReply({ embeds: [embed], components: [] });
            break;
          }

          case "story": {
            const starter = storyStarters[Math.floor(Math.random() * storyStarters.length)]!;
            const embed = new EmbedBuilder()
              .setTitle("📝 قصة جماعية")
              .setDescription(`ابدأ القصة من هنا:\n\n*${starter}*\n\nكل واحد يكمل بجملة واحدة! من يتأخر أكثر من دقيقتين ينتهي دوره 📖`)
              .setColor(0x8e44ad);
            await i.editReply({ embeds: [embed], components: [] });
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
