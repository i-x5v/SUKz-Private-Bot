import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { GoogleGenAI } from "@google/genai";

const geminiBaseUrl = process.env["AI_INTEGRATIONS_GEMINI_BASE_URL"];
const geminiApiKey = process.env["AI_INTEGRATIONS_GEMINI_API_KEY"] ?? process.env["GEMINI_API_KEY"] ?? "no-key";
const geminiClient = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: { apiVersion: "", ...(geminiBaseUrl ? { baseUrl: geminiBaseUrl } : {}) },
});

const aiConversations = new Map<string, { role: "user" | "model"; text: string }[]>();

interface MapEntry { name: string; desc: string; tip?: string }
interface GameData {
  label: string;
  color: number;
  emoji: string;
  thumbnail: string;
  maps: MapEntry[];
}

const GAMES: Record<string, GameData> = {
  bo2: {
    label: "Call of Duty: Black Ops II",
    color: 0x1a1a2e,
    emoji: "🎯",
    thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/202970/header.jpg",
    maps: [
      { name: "Nuketown 2025", desc: "أصغر وأسرع ماب في اللعبة — مناسب للاشتباك المباشر والقنص السريع.", tip: "حاول تسيطر على المنتصف والسيارات للسيطرة على الماب" },
      { name: "Hijacked", desc: "يخت فاخر في وسط المحيط — معارك قريبة ومفتوحة في آن واحد.", tip: "المطبخ والغرفة الخلفية أفضل مناطق للتحصن" },
      { name: "Raid", desc: "منزل فاخر كبير مع حمام سباحة — يجمع المعارك القريبة والمتوسطة.", tip: "السلالم الداخلية وحمام السباحة نقاط ساخنة" },
      { name: "Standoff", desc: "بلدة صغيرة في الحدود — متوازنة لجميع الأسلحة.", tip: "السيارات والمباني في المنتصف توفر تغطية ممتازة" },
      { name: "Slums", desc: "أحياء قديمة متهالكة — ضيقة وسريعة الإيقاع.", tip: "أسطح المباني تمنحك أفضلية على الخصوم" },
      { name: "Cargo", desc: "ميناء شحن بضائع — طرق متعددة وحاويات كتغطية.", tip: "الحاويات الزرقاء نقطة تكتيكية مهمة" },
      { name: "Carrier", desc: "حاملة طائرات — طويلة ومتعددة المستويات.", tip: "الممرات الضيقة خطيرة — استخدم الرصاصة الذكية" },
      { name: "Drone", desc: "مصنع طائرات مسيّرة — ماب متوسط الحجم بأروقة واسعة.", tip: "المنتصف منطقة معارك دائمة" },
      { name: "Express", desc: "محطة قطار سريع — طويلة مع مسارات متوازية وقطار يمر.", tip: "انتبه للقطار — يمكن أن يقتلك إذا وقفت على الخط" },
      { name: "Aftermath", desc: "مدينة دمرتها حرب نووية — تعطي طابعاً مميزاً وأماكن متعددة للاختباء.", tip: "الأنقاض والسيارات المحترقة نقاط تغطية ممتازة" },
      { name: "Yemen", desc: "ماب في اليمن — منازل متلاصقة وأزقة ضيقة مليئة بالمفاجآت.", tip: "الأسطح والشبابيك مواقع قنص ممتازة" },
      { name: "Overflow", desc: "شوارع فيضانات — مفتوحة مع بعض التغطيات المتفرقة.", tip: "حافة الخريطة توفر رؤية أوسع" },
      { name: "Turbine", desc: "صحراء بها توربينات رياح ضخمة — واسعة وطويلة مناسبة للقناصة.", tip: "التوربينات نقاط تغطية مهمة لتجنب القناصة" },
      { name: "Plaza", desc: "منتجع ساحلي فاخر — متوسط الحجم مع حمامات سباحة.", tip: "السطح والمداخل الخلفية أماكن مفضلة للمحترفين" },
      { name: "Downhill", desc: "منتجع تزلج جبلي — يصعب التنبؤ بمسارات الخصوم فيه.", tip: "الكابينات الزجاجية مكان مميز للمراقبة" },
    ],
  },
  warzone: {
    label: "Call of Duty: Warzone",
    color: 0x0a0a0a,
    emoji: "🪂",
    thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/1962660/header.jpg",
    maps: [
      { name: "Verdansk", desc: "الماب الأصلي والأشهر — مدينة ضخمة مع مناطق متنوعة.", tip: "المطار، التلال، والمركز التجاري نقاط ساخنة" },
      { name: "Caldera", desc: "جزيرة استوائية ذات طابع حرب عالمية ثانية.", tip: "قمة البركان توفر أفضل رؤية للخريطة" },
      { name: "Urzikstan", desc: "المدينة الحديثة مع بيئات متعددة.", tip: "الشوارع الضيقة في قلب المدينة منطقة اشتباكات مكثفة" },
      { name: "Al Mazrah", desc: "مدينة شرق أوسطية واسعة ومتنوعة.", tip: "التلال المحيطة مواقع مميزة للقناصة" },
      { name: "Ashika Island", desc: "جزيرة صغيرة مكثفة للمعارك السريعة.", tip: "المصنع في الوسط نقطة التحكم الأساسية" },
    ],
  },
  pubg: {
    label: "PUBG: BATTLEGROUNDS",
    color: 0xf5a623,
    emoji: "🪖",
    thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/578080/header.jpg",
    maps: [
      { name: "Erangel", desc: "الماب الأصلي — جزيرة خضراء واسعة مع قرى ومدن متعددة.", tip: "Pochinki وSchool أكثر المناطق خطورة في البداية" },
      { name: "Miramar", desc: "صحراء مكسيكية جافة — معارك طويلة المدى في الغالب.", tip: "المرتفعات والوديان نقاط استراتيجية" },
      { name: "Sanhok", desc: "غابة استوائية صغيرة — معارك سريعة ومكثفة.", tip: "Boot Camp وRuins أماكن نزول ساخنة جداً" },
      { name: "Vikendi", desc: "تضاريس ثلجية — أصعقك في التمويه الأبيض.", tip: "آثار الأقدام في الثلج تكشف مكانك — تحرك بحذر" },
      { name: "Taego", desc: "كوريا الجنوبية ريفية — خريطة كبيرة مع مركبات كثيرة.", tip: "الخريطة الداخلية (Self AED) ميزة حصرية مهمة" },
      { name: "Deston", desc: "مدينة مستقبلية أمريكية — ناطحات سحاب وأنفاق.", tip: "الطابق السفلي للمدينة يحتوي على لوت ثمين" },
      { name: "Rondo", desc: "ماب ضخم يجمع الغابات والمدن والمزارع.", tip: "الكهوف نقاط سرية للهروب والكمين" },
    ],
  },
  fortnite: {
    label: "Fortnite",
    color: 0x0066ff,
    emoji: "⛏️",
    thumbnail: "https://cdn2.unrealengine.com/fortnite-chapter-5-season-4-key-art-1920x1080-57e99d8cd50b.jpg",
    maps: [
      { name: "Tilted Towers", desc: "المنطقة الأشهر في فورتنايت — مبانٍ عالية وكثافة قتالية عالية جداً.", tip: "البناء السريع أساسي للبقاء في Tilted" },
      { name: "Pleasant Park", desc: "حي سكني هادئ نسبياً مع منازل جميلة.", tip: "بيت القبو يخفي الكثير من الموارد" },
      { name: "Retail Row", desc: "مركز تسوق كبير — لوت وفير ومعارك داخلية.", tip: "السطح يعطيك ميزة على الخصوم في الداخل" },
      { name: "Salty Springs", desc: "قرية صغيرة — لوت معقول ومعارك متوسطة.", tip: "مثالية للمبتدئين لممارسة البناء" },
      { name: "Snobby Shores", desc: "منازل فاخرة على الشاطئ — هادئة في البداية.", tip: "القبو في أحد المنازل يحتوي لوت مميز دائماً" },
      { name: "Fatal Fields", desc: "مزارع واسعة — هادئة ومناسبة للبحث عن المركبات.", tip: "انتبه للبُرج الأحمر — غالباً فيه قناصة" },
      { name: "Lonely Lodge", desc: "مخيم في الغابة — لوت متوسط وأماكن هروب كثيرة.", tip: "البُرج الخشبي مكان استراتيجي للقنص" },
    ],
  },
  dls: {
    label: "Dream League Soccer",
    color: 0x00cc44,
    emoji: "⚽",
    thumbnail: "https://play-lh.googleusercontent.com/haT-jUSMIWpYNHjvWOuSO-dxB3VRwHkGBqsomFWVLg8aBqlY7EI55mGVzFHT2ePW",
    maps: [
      { name: "Dream Stadium", desc: "الملعب الأيقوني الرسمي للعبة — عشب مثالي وإضاءة احترافية.", tip: "أفضل ملعب للسيطرة والتمريرات القصيرة" },
      { name: "Wembley Stadium", desc: "أسطورة كرة القدم الإنجليزية — ملعب تاريخي بطاقة 90,000 مشجع.", tip: "الأجواء الحماسية ترفع من أداء فريقك" },
      { name: "Camp Nou", desc: "معقل برشلونة — أحد أكبر الملاعب في العالم.", tip: "الملعب واسع يناسب كرة الحواف والجناح" },
      { name: "Allianz Arena", desc: "الوعاء الليلي بألوانه الزاهية — ملعب بايرن ميونخ الأسطوري.", tip: "الإضاءة المتغيرة تجعل البيئة مميزة" },
      { name: "Old Trafford", desc: "مسرح الأحلام — ملعب مانشستر يونايتد التاريخي.", tip: "الأجواء ترفع من روح الفريق بشكل ملحوظ" },
      { name: "San Siro", desc: "المعقل الميلاني — أيقونة كرة القدم الإيطالية.", tip: "عشب عالي الجودة يناسب كرة التمرير" },
      { name: "Signal Iduna Park", desc: "عرين بوروسيا دورتموند — الجدار الأصفر الشهير.", tip: "ضجيج الجماهير يُضخ الطاقة في فريقك" },
      { name: "Anfield", desc: "ملعب ليفربول الأسطوري وأجواء You'll Never Walk Alone.", tip: "ليل أنفيلد تجربة استثنائية" },
    ],
  },
  minecraft: {
    label: "Minecraft",
    color: 0x6d4c41,
    emoji: "⛏️",
    thumbnail: "https://www.minecraft.net/content/dam/games/minecraft/key-art/MC-Vanilla_Block-Slab_KeyArt.jpg",
    maps: [
      { name: "Plains (السهول)", desc: "أفضل بيئة للمبتدئين — مسطحة ومضاءة جيداً.", tip: "قريات القرى تمنحك موارد مجانية في البداية" },
      { name: "Forest (الغابة)", desc: "خشب وفير — البيئة الأكثر انتاجاً في البداية.", tip: "انتبه ليلاً — الزومبي والعناكب تختبئ بين الأشجار" },
      { name: "Desert (الصحراء)", desc: "بيئة جافة مع معابد مخفية وكميات كبيرة من الرمل.", tip: "معبد الصحراء يحتوي صناديق كنز — اضغط اللوح الأزرق بحذر!" },
      { name: "Mountains (الجبال)", desc: "مرتفعات خطيرة وثلج وأكواز ضخمة.", tip: "الثلج ومصادر المعادن وفيرة في المرتفعات" },
      { name: "Jungle (الغابة الاستوائية)", desc: "أشجار ضخمة ومعابد مخفية بمصائد.", tip: "القطط تولد هنا — اربطها لتحمي منزلك من الزومبي" },
      { name: "Swamp (المستنقع)", desc: "غامضة وكئيبة — موطن الساحرات والضفادع.", tip: "Slime تولد هنا — مهم لتصنيع الـ Piston" },
      { name: "Mesa / Badlands (الصحراء الحمراء)", desc: "صخور ملونة نادرة وذهب وفير.", tip: "الذهب يولد هنا على أي مستوى — استثمره!" },
      { name: "Ocean (المحيط)", desc: "بيئة مائية شاسعة مع مزارع مرجانية وحطام سفن.", tip: "حطام السفن يحتوي كنوز ثمينة وتعويذة التنفس" },
    ],
  },
  gta: {
    label: "GTA V",
    color: 0xffd700,
    emoji: "🚗",
    thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/271590/header.jpg",
    maps: [
      { name: "Los Santos Downtown", desc: "قلب المدينة — ناطحات سحاب وشوارع مزدحمة ومطاردات لا تنتهي.", tip: "تجنب النجوم الخمسة هنا — الشرطة عدوانية جداً" },
      { name: "Vinewood Hills", desc: "أحياء المشاهير الراقية فوق التلال.", tip: "المنازل الفارهة أهداف سهلة للسطو" },
      { name: "Chumash", desc: "شاطئ هادئ على الساحل الغربي — مثالي للتسلية.", tip: "القفز بالمظلة من الجبال المجاورة تجربة مجنونة" },
      { name: "Sandy Shores", desc: "صحراء مهجورة فيها سكان غريبو الأطوار.", tip: "المطار الصغير مثالي للطائرات الصغيرة والسرعة" },
      { name: "Paleto Bay", desc: "بلدة ريفية شمالية — بنك أسطوري وغابات كثيفة.", tip: "المناطق الغابية مثالية للهروب من الشرطة" },
      { name: "Fort Zancudo", desc: "قاعدة عسكرية محصنة — المكان المحظور الأكثر جاذبية.", tip: "الدبابة والطائرة الشبح F-22 موجودتان هنا" },
      { name: "Alamo Sea", desc: "بحيرة كبيرة متردية تحيط بها مصانع مهجورة.", tip: "الطقس سيء دائماً هنا — مناخ غير عادي" },
      { name: "LSIA (مطار لوس سانتوس)", desc: "مطار دولي ضخم — إجرام منظم وفوضى مستمرة.", tip: "سرقة طائرة ركاب كبيرة من هنا تحدٍ كبير" },
    ],
  },
  fifa: {
    label: "FIFA 24 / EA Sports FC",
    color: 0x003399,
    emoji: "🏆",
    thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/2195250/header.jpg",
    maps: [
      { name: "Camp Nou", desc: "ملعب برشلونة الأسطوري — أكبر ملاعب أوروبا.", tip: "كرة التمرير السريع مثالية على هذا العشب" },
      { name: "Santiago Bernabéu", desc: "معقل ريال مدريد المُجدَّد بالكامل.", tip: "جماهير الإمارات تُولّد ضغطاً على الخصم" },
      { name: "Old Trafford", desc: "مسرح الأحلام — مانشستر يونايتد.", tip: "الأجواء الليلية في الكأس تجربة مختلفة" },
      { name: "Allianz Arena", desc: "ملعب بايرن ميونخ الذكي والحديث.", tip: "الإضاءة الحمراء والزرقاء تعتمد على الفريق اللاعب" },
      { name: "Anfield", desc: "ليفربول — الصوت والضجيج جزء من المباراة.", tip: "يتميز بأعلى صوت جماهيري في اللعبة" },
      { name: "Etihad Stadium", desc: "ملعب مانشستر سيتي الحديث.", tip: "يمنحك جو محترف ورياح ثابتة نسبياً" },
      { name: "Wembley", desc: "أيقونة كرة القدم الإنجليزية — كأس الاتحاد.", tip: "الجو الكبير يناسب الضربات الحرة" },
    ],
  },
};

export const gamingMapsCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("map")
      .setDescription("🗺️ اختار لعبة وشوف ماب عشوائي بتفاصيله / Random map picker for popular games")
      .addStringOption(opt =>
        opt.setName("game")
          .setDescription("اختار اللعبة / Choose a game")
          .setRequired(true)
          .addChoices(
            { name: "🎯 Call of Duty: Black Ops 2", value: "bo2" },
            { name: "🪂 Call of Duty: Warzone", value: "warzone" },
            { name: "🪖 PUBG: BATTLEGROUNDS", value: "pubg" },
            { name: "⛏️ Fortnite", value: "fortnite" },
            { name: "⚽ Dream League Soccer (DLS)", value: "dls" },
            { name: "🏆 FIFA 24 / EA Sports FC", value: "fifa" },
            { name: "🧱 Minecraft", value: "minecraft" },
            { name: "🚗 GTA V", value: "gta" },
          )
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const gameKey = interaction.options.getString("game", true);
      const game = GAMES[gameKey];
      if (!game) return interaction.reply({ content: "❌ اللعبة غير موجودة!", ephemeral: true });

      const map = game.maps[Math.floor(Math.random() * game.maps.length)]!;

      const embed = new EmbedBuilder()
        .setTitle(`${game.emoji} ماب عشوائي — ${game.label}`)
        .setColor(game.color)
        .addFields(
          { name: "🗺️ الماب", value: `**${map.name}**`, inline: false },
          { name: "📖 الوصف", value: map.desc, inline: false },
          ...(map.tip ? [{ name: "💡 نصيحة", value: map.tip, inline: false }] : []),
          { name: "🎮 اللعبة", value: game.label, inline: true },
          { name: "📊 عدد المابات", value: `${game.maps.length} ماب`, inline: true },
        )
        .setThumbnail(game.thumbnail)
        .setFooter({ text: "Bot_SUKz • Map Picker • اكتب /map مرة ثانية للحصول على ماب آخر" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("ai")
      .setDescription("🤖 تحدث مع الذكاء الاصطناعي — يتذكر المحادثة / Chat with AI (remembers context)")
      .addStringOption(opt =>
        opt.setName("message")
          .setDescription("رسالتك / Your message")
          .setRequired(true)
      )
      .addBooleanOption(opt =>
        opt.setName("reset")
          .setDescription("ابدأ محادثة جديدة وامسح التاريخ / Start fresh conversation")
          .setRequired(false)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const message = interaction.options.getString("message", true);
      const reset = interaction.options.getBoolean("reset") ?? false;
      const userId = interaction.user.id;

      if (reset) aiConversations.delete(userId);

      const history = aiConversations.get(userId) ?? [];

      try {
        await interaction.deferReply();

        history.push({ role: "user", text: message });

        const response = await geminiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
          config: {
            systemInstruction: `أنت مساعد ذكي ومرح اسمك SUKz AI في سيرفر ديسكورد.
- تتذكر سياق المحادثة السابقة وتبني عليها
- إذا تكلم المستخدم بالعربية، رد بالعربية
- إذا تكلم بالإنجليزية، رد بالإنجليزية
- أجوبتك مختصرة ومفيدة ومرحة (لا تتجاوز 500 كلمة)
- إذا سألك عن نفسك: أخبره أنك SUKz AI مدعوم بجيميني`,
            maxOutputTokens: 1800,
          },
        });

        const aiReply = response.text ?? "عذراً، ما قدرت أرد. جرب مرة ثانية.";

        history.push({ role: "model", text: aiReply });
        if (history.length > 10) history.splice(0, 2);
        aiConversations.set(userId, history);

        const turnCount = Math.ceil(history.length / 2);

        const embed = new EmbedBuilder()
          .setTitle("🤖 SUKz AI")
          .setColor(0x5865f2)
          .addFields(
            { name: `💬 ${interaction.user.username}`, value: message.slice(0, 1024) },
            { name: "🤖 SUKz AI", value: aiReply.slice(0, 1024) },
          )
          .setThumbnail(interaction.user.displayAvatarURL())
          .setFooter({ text: `المحادثة رقم ${turnCount} • اكتب /ai reset:نعم لبدء محادثة جديدة` })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        await interaction.editReply({ content: `❌ حدث خطأ: \`${errMsg.slice(0, 200)}\`` });
      }
    },
  },
];
